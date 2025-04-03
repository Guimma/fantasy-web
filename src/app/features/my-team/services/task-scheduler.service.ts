import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subscription, interval, switchMap, takeWhile, of, tap, catchError, delay, finalize } from 'rxjs';
import { PontuacaoService } from './pontuacao.service';
import { MyTeamService } from './my-team.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StorageService } from '../../../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class TaskSchedulerService implements OnDestroy {
  private pontuacaoService = inject(PontuacaoService);
  private myTeamService = inject(MyTeamService);
  private notificationService = inject(NotificationService);
  private storageService = inject(StorageService);
  
  private readonly LAST_CALCULATED_KEY = 'ultima_rodada_calculada';
  private checkIntervalMinutes = 5; // Verificar a cada 5 minutos para evitar conflitos
  
  private subscriptions: Subscription[] = [];
  private isRunning = false;
  // Adicionado semáforo para evitar cálculos concorrentes
  private calculatingRodadas = new Set<number>();

  constructor() { }

  /**
   * Inicia o agendador de tarefas
   */
  startScheduler(): Promise<boolean> {
    if (this.isRunning) {
      console.log('[TaskScheduler] Agendador já está em execução, ignorando chamada.');
      return Promise.resolve(true);
    }
    
    this.isRunning = true;
    console.log('[TaskScheduler] Iniciando agendador de tarefas (intervalo: ' + this.checkIntervalMinutes + ' minutos)');
    
    // Realizar verificação inicial com um pequeno delay para evitar colisões com outras inicializações
    console.log('[TaskScheduler] Programando verificação inicial para daqui a 3 segundos...');
    setTimeout(() => {
      if (this.isRunning) { // Verificar novamente se o serviço ainda está em execução
        console.log('[TaskScheduler] Executando verificação inicial...');
        this.verificarPontuacoesRodadas().subscribe({
          next: (result) => console.log(`[TaskScheduler] Verificação inicial concluída. Resultado: ${result}`),
          error: (error) => console.error('[TaskScheduler] Erro na verificação inicial:', error)
        });
      }
    }, 3000); // Aguardar 3 segundos antes da primeira verificação
    
    // Agendamento periódico (começa apenas após o intervalo configurado)
    console.log(`[TaskScheduler] Próxima verificação agendada ocorrerá em ${this.checkIntervalMinutes} minutos`);
    const subscription = interval(this.checkIntervalMinutes * 60 * 1000)
      .pipe(
        tap(count => console.log(`[TaskScheduler] Executando verificação agendada #${count+1} (a cada ${this.checkIntervalMinutes} minutos)...`)),
        switchMap(() => this.verificarPontuacoesRodadas())
      )
      .subscribe({
        next: (result) => console.log(`[TaskScheduler] Verificação agendada concluída. Resultado: ${result}`),
        error: (error) => console.error('[TaskScheduler] Erro na verificação agendada:', error)
      });
    
    this.subscriptions.push(subscription);
    
    return Promise.resolve(true);
  }

  /**
   * Para o agendador de tarefas
   */
  stopScheduler(): void {
    this.isRunning = false;
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
    console.log('Agendador de tarefas parado.');
  }

  /**
   * Verifica e calcula pontuações de rodadas finalizadas
   */
  private verificarPontuacoesRodadas(): Observable<boolean> {
    console.log('[TaskScheduler] Iniciando verificação de pontuações de rodadas...');
    
    // Para fins de depuração, exibir todas as chaves do localStorage
    console.log('[TaskScheduler] Chaves no localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
      console.log(`- ${localStorage.key(i)}`);
    }
    
    // Verificar valor da última rodada calculada
    const ultimaRodadaCalculada = this.storageService.get<number>(this.LAST_CALCULATED_KEY) || 0;
    console.log(`[TaskScheduler] Última rodada calculada (antes da verificação): ${ultimaRodadaCalculada}`);
    
    return this.pontuacaoService.getRodadaAtual().pipe(
      tap(rodadaAtual => {
        console.log(`[TaskScheduler] Recebeu informações da rodada atual:`, rodadaAtual);
      }),
      switchMap(rodadaAtual => {
        console.log(`[TaskScheduler] Verificando rodada atual: ${rodadaAtual.id} (${rodadaAtual.status})`);
        
        // Verificar todas as rodadas anteriores que ainda não foram calculadas
        if (rodadaAtual.id > ultimaRodadaCalculada + 1) {
          console.log(`[TaskScheduler] Existem rodadas anteriores não calculadas. Verificando...`);
          
          // Calcular todas as rodadas desde a última calculada até a atual
          const rodadasParaCalcular: number[] = [];
          for (let i = ultimaRodadaCalculada + 1; i < rodadaAtual.id; i++) {
            rodadasParaCalcular.push(i);
          }
          
          console.log(`[TaskScheduler] Rodadas pendentes para cálculo: ${rodadasParaCalcular.join(', ')}`);
          
          if (rodadasParaCalcular.length === 0) {
            console.log(`[TaskScheduler] Nenhuma rodada pendente para calcular.`);
            // Continuar com a verificação da rodada atual
          } else {
            // Verificar e calcular cada rodada pendente em sequência
            console.log(`[TaskScheduler] Iniciando cálculo de ${rodadasParaCalcular.length} rodadas pendentes...`);
            
            // Função recursiva para calcular rodadas pendentes em sequência
            const calcularRodadasPendentes = (rodadas: number[], index = 0): Observable<boolean> => {
              if (index >= rodadas.length) {
                console.log(`[TaskScheduler] Todas as rodadas pendentes foram calculadas.`);
                return of(true);
              }
              
              const rodadaId = rodadas[index];
              console.log(`[TaskScheduler] Verificando rodada pendente ${rodadaId}...`);
              
              return this.pontuacaoService.isRodadaFinalizada(rodadaId).pipe(
                switchMap(finalizada => {
                  if (finalizada) {
                    console.log(`[TaskScheduler] Rodada ${rodadaId} está finalizada. Iniciando cálculo...`);
                    return this.calcularPontuacoesParaTodosTimes(rodadaId).pipe(
                      tap(success => {
                        console.log(`[TaskScheduler] Cálculo da rodada ${rodadaId} finalizado. Sucesso: ${success}`);
                        if (success) {
                          this.storageService.set(this.LAST_CALCULATED_KEY, rodadaId);
                          console.log(`[TaskScheduler] Atualizado registro da última rodada calculada: ${rodadaId}`);
                          this.notificationService.success(
                            `Cálculo de pontuações da rodada ${rodadaId} finalizado com sucesso!`
                          );
                        }
                      }),
                      // Continuar com a próxima rodada, independentemente do resultado
                      switchMap(() => calcularRodadasPendentes(rodadas, index + 1))
                    );
                  } else {
                    console.log(`[TaskScheduler] Rodada ${rodadaId} ainda não está finalizada. Pulando.`);
                    // Pular para a próxima rodada
                    return calcularRodadasPendentes(rodadas, index + 1);
                  }
                })
              );
            };
            
            // Iniciar o cálculo recursivo das rodadas pendentes
            return calcularRodadasPendentes(rodadasParaCalcular);
          }
        }
        
        // Verificar rodada atual
        if (rodadaAtual.status !== 'finalizada') {
          console.log(`[TaskScheduler] Rodada ${rodadaAtual.id} ainda não foi finalizada. Status: ${rodadaAtual.status}`);
          return of(false);
        }
        
        // Verificar se já calculamos esta rodada
        if (rodadaAtual.id <= ultimaRodadaCalculada) {
          console.log(`[TaskScheduler] Rodada ${rodadaAtual.id} já foi calculada anteriormente.`);
          return of(false);
        }
        
        console.log(`[TaskScheduler] Rodada ${rodadaAtual.id} finalizada e ainda não calculada. Iniciando cálculo...`);
        
        // Forçar início do cálculo após delay para garantir que os logs apareçam em ordem
        return of(true).pipe(
          delay(100),
          switchMap(() => this.calcularPontuacoesParaTodosTimes(rodadaAtual.id)),
          tap(success => {
            console.log(`[TaskScheduler] Cálculo da rodada ${rodadaAtual.id} finalizado. Sucesso: ${success}`);
            if (success) {
              this.storageService.set(this.LAST_CALCULATED_KEY, rodadaAtual.id);
              console.log(`[TaskScheduler] Atualizado registro da última rodada calculada: ${rodadaAtual.id}`);
              this.notificationService.success(
                `Cálculo de pontuações da rodada ${rodadaAtual.id} finalizado com sucesso!`
              );
            } else {
              console.error(`[TaskScheduler] Falha no cálculo da rodada ${rodadaAtual.id}.`);
            }
          })
        );
      }),
      catchError(error => {
        console.error('[TaskScheduler] Erro na verificação de rodadas:', error);
        return of(false);
      })
    );
  }

  /**
   * Calcula e salva pontuações para todos os times em uma rodada
   */
  private calcularPontuacoesParaTodosTimes(rodadaId: number): Observable<boolean> {
    // Verificar se já está calculando esta rodada
    if (this.calculatingRodadas.has(rodadaId)) {
      console.log(`[TaskScheduler] Cálculo da rodada ${rodadaId} já está em andamento. Ignorando chamada duplicada.`);
      return of(false);
    }
    
    // Marcar a rodada como em cálculo
    this.calculatingRodadas.add(rodadaId);
    
    // Em uma implementação real, buscaríamos todos os times de uma liga
    // ou de todo o sistema. Para simplificar, vamos usar apenas o time atual.
    console.log(`[TaskScheduler] Iniciando cálculo de pontuações para a rodada ${rodadaId}...`);
    
    return this.myTeamService.getMyTeam().pipe(
      switchMap(myTeam => {
        if (!myTeam) {
          console.log('[TaskScheduler] Nenhum time encontrado para calcular pontuações.');
          this.calculatingRodadas.delete(rodadaId); // Liberar o semáforo
          return of(false);
        }
        
        console.log(`[TaskScheduler] Calculando pontuação do time "${myTeam.name}" (ID: ${myTeam.id}) para a rodada ${rodadaId}...`);
        
        // Verificar primeiro se já existe pontuação para este time/rodada
        return this.pontuacaoService.getPontuacaoTimeRodada(myTeam.id, rodadaId).pipe(
          switchMap(pontuacaoExistente => {
            if (pontuacaoExistente) {
              console.log(`[TaskScheduler] Pontuação para o time ${myTeam.id} na rodada ${rodadaId} já existe. Ignorando cálculo.`);
              // Atualizar a última rodada calculada no storage
              this.storageService.set(this.LAST_CALCULATED_KEY, rodadaId);
              this.calculatingRodadas.delete(rodadaId); // Liberar o semáforo
              return of(true);
            }
            
            // Primeiro, remover qualquer pontuação existente para esta rodada 
            // (isso é uma proteção extra, mesmo que a verificação acima já tenha ocorrido)
            console.log(`[TaskScheduler] Removendo pontuações existentes para o time na rodada ${rodadaId}...`);
            return this.pontuacaoService.removerPontuacaoTimeRodada(myTeam.id, rodadaId).pipe(
              switchMap(removido => {
                if (!removido) {
                  console.warn(`[TaskScheduler] Não foi possível remover as pontuações anteriores da rodada ${rodadaId}`);
                  // Continuamos mesmo assim
                } else {
                  console.log(`[TaskScheduler] Pontuações anteriores removidas com sucesso.`);
                }
                
                // Calcular e salvar a nova pontuação
                console.log(`[TaskScheduler] Calculando nova pontuação...`);
                return this.pontuacaoService.calcularPontuacaoTime(myTeam, rodadaId).pipe(
                  switchMap(pontuacao => {
                    // Salvar a pontuação calculada
                    console.log(`[TaskScheduler] Pontuação calculada: ${pontuacao.pontuacao_total} pontos com ${pontuacao.atletas_pontuados.length} atletas pontuados.`);
                    console.log(`[TaskScheduler] Salvando pontuação na planilha...`);
                    return this.pontuacaoService.salvarPontuacaoRodada(pontuacao).pipe(
                      switchMap(success => {
                        this.calculatingRodadas.delete(rodadaId); // Liberar o semáforo independente do resultado
                        if (success) {
                          console.log(`[TaskScheduler] Pontuação salva com sucesso. Atualizando pontuação da última rodada no time...`);
                          // Após salvar a pontuação, atualizar a última rodada no time
                          return this.atualizarPontuacaoUltimaRodada(myTeam.id, pontuacao.pontuacao_total);
                        }
                        console.log(`[TaskScheduler] Erro ao salvar pontuação.`);
                        return of(false);
                      })
                    );
                  }),
                  catchError(error => {
                    console.error(`[TaskScheduler] Erro ao calcular pontuação: ${error}`);
                    this.calculatingRodadas.delete(rodadaId); // Liberar o semáforo em caso de erro
                    return of(false);
                  })
                );
              }),
              catchError(error => {
                console.error(`[TaskScheduler] Erro ao remover pontuações anteriores: ${error}`);
                this.calculatingRodadas.delete(rodadaId); // Liberar o semáforo em caso de erro
                return of(false);
              })
            );
          }),
          catchError(error => {
            console.error(`[TaskScheduler] Erro ao verificar pontuação existente: ${error}`);
            this.calculatingRodadas.delete(rodadaId); // Liberar o semáforo em caso de erro
            return of(false);
          })
        );
      }),
      catchError(error => {
        console.error(`[TaskScheduler] Erro ao obter time: ${error}`);
        this.calculatingRodadas.delete(rodadaId); // Liberar o semáforo em caso de erro
        return of(false);
      }),
      finalize(() => {
        // Garantir que o semáforo é liberado em qualquer caso
        this.calculatingRodadas.delete(rodadaId);
      })
    );
  }

  /**
   * Atualiza a pontuação da última rodada no objeto do time
   */
  atualizarPontuacaoUltimaRodada(timeId: string, pontuacao: number): Observable<boolean> {
    // Atualizar a pontuação da última rodada no objeto do time usando o método do MyTeamService
    console.log(`[TaskScheduler] Atualizando pontuação da última rodada do time ${timeId} para ${pontuacao}`);
    return this.myTeamService.updateTeamLastRoundScore(timeId, pontuacao).pipe(
      tap(success => {
        if (success) {
          console.log(`[TaskScheduler] Pontuação da última rodada atualizada com sucesso.`);
        } else {
          console.log(`[TaskScheduler] Erro ao atualizar pontuação da última rodada.`);
        }
      })
    );
  }

  /**
   * Força o recálculo da pontuação de um time para uma rodada específica
   */
  recalcularPontuacaoRodada(rodadaId: number): Observable<boolean> {
    console.log(`[TaskScheduler] Iniciando recálculo manual da pontuação para a rodada ${rodadaId}...`);
    
    // Verificar se já está calculando esta rodada
    if (this.calculatingRodadas.has(rodadaId)) {
      console.log(`[TaskScheduler] Cálculo da rodada ${rodadaId} já está em andamento. Ignorando chamada duplicada.`);
      this.notificationService.warning(`Cálculo da rodada ${rodadaId} já está em andamento.`);
      return of(false);
    }
    
    // Marcar a rodada como em cálculo
    this.calculatingRodadas.add(rodadaId);
    
    // Verificar se a rodada está finalizada
    return this.pontuacaoService.isRodadaFinalizada(rodadaId).pipe(
      switchMap(finalizada => {
        if (!finalizada) {
          this.notificationService.error(`A rodada ${rodadaId} ainda não foi finalizada`);
          this.calculatingRodadas.delete(rodadaId);
          return of(false);
        }
        
        // Executar o cálculo das pontuações
        return this.myTeamService.getMyTeam().pipe(
          switchMap(myTeam => {
            if (!myTeam) {
              console.log('[TaskScheduler] Nenhum time encontrado para recalcular pontuações.');
              this.notificationService.error('Nenhum time encontrado para recalcular pontuações');
              this.calculatingRodadas.delete(rodadaId);
              return of(false);
            }
            
            console.log(`[TaskScheduler] Recalculando manualmente pontuação do time "${myTeam.name}" (ID: ${myTeam.id}) para a rodada ${rodadaId}...`);
            
            // Verificar se há pontuação existente e forçar a remoção
            return this.pontuacaoService.getPontuacaoTimeRodada(myTeam.id, rodadaId).pipe(
              switchMap(pontuacaoExistente => {
                if (pontuacaoExistente) {
                  console.log(`[TaskScheduler] Pontuação existente encontrada. Removendo antes de recalcular...`);
                  
                  return this.pontuacaoService.removerPontuacaoTimeRodada(myTeam.id, rodadaId).pipe(
                    tap(success => {
                      if (!success) {
                        console.warn(`[TaskScheduler] Não foi possível remover pontuação existente. Continuando mesmo assim.`);
                      }
                    })
                  );
                } else {
                  console.log(`[TaskScheduler] Nenhuma pontuação existente encontrada. Prosseguindo com o cálculo.`);
                  return of(true);
                }
              }),
              switchMap(() => {
                // Calcular a pontuação independentemente se conseguiu remover a anterior
                console.log(`[TaskScheduler] Calculando pontuação...`);
                return this.pontuacaoService.calcularPontuacaoTime(myTeam, rodadaId).pipe(
                  switchMap(pontuacao => {
                    console.log(`[TaskScheduler] Pontuação calculada: ${pontuacao.pontuacao_total} pontos.`);
                    console.log(`[TaskScheduler] Salvando nova pontuação...`);
                    
                    // Salvar a nova pontuação
                    return this.pontuacaoService.salvarPontuacaoRodada(pontuacao).pipe(
                      tap(success => {
                        if (success) {
                          console.log(`[TaskScheduler] Nova pontuação salva com sucesso.`);
                          
                          // Atualizar a última rodada calculada se for a mais recente
                          this.pontuacaoService.getRodadaAtual().pipe(
                            tap(rodadaAtual => {
                              if (rodadaId >= rodadaAtual.id) {
                                this.storageService.set(this.LAST_CALCULATED_KEY, rodadaId);
                                console.log(`[TaskScheduler] Atualizada a última rodada calculada para ${rodadaId}`);
                              }
                            })
                          ).subscribe();
                          
                          // Atualizar a pontuação da última rodada no time
                          this.atualizarPontuacaoUltimaRodada(myTeam.id, pontuacao.pontuacao_total).subscribe();
                          
                          this.notificationService.success(
                            `Recálculo de pontuações da rodada ${rodadaId} finalizado com sucesso!`
                          );
                        } else {
                          console.error(`[TaskScheduler] Erro ao salvar nova pontuação.`);
                          this.notificationService.error(
                            `Erro ao salvar pontuação recalculada da rodada ${rodadaId}`
                          );
                        }
                      })
                    );
                  })
                );
              })
            );
          }),
          catchError(error => {
            console.error(`[TaskScheduler] Erro no recálculo manual: ${error}`);
            this.notificationService.error(`Erro ao recalcular pontuação: ${error.message || 'Erro desconhecido'}`);
            return of(false);
          }),
          finalize(() => {
            // Garantir que o semáforo é liberado
            this.calculatingRodadas.delete(rodadaId);
          })
        );
      })
    );
  }

  /**
   * Cleanup when the service is destroyed
   */
  ngOnDestroy(): void {
    this.stopScheduler();
  }
}