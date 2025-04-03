import { Injectable, OnDestroy, inject } from '@angular/core';
import { Observable, Subscription, interval, switchMap, of, tap, catchError, map, forkJoin } from 'rxjs';
import { PontuacaoService } from './pontuacao.service';
import { MyTeamService } from './my-team.service';
import { TeamHistoryService } from './team-history.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StorageService } from '../../../core/services/storage.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { MyTeam } from '../models/my-team.model';
import { CartolaApiService } from '../../../core/services/cartola-api.service';

@Injectable({
  providedIn: 'root'
})
export class TaskSchedulerService implements OnDestroy {
  private pontuacaoService = inject(PontuacaoService);
  private myTeamService = inject(MyTeamService);
  private teamHistoryService = inject(TeamHistoryService);
  private notificationService = inject(NotificationService);
  private storageService = inject(StorageService);
  private googleAuthService = inject(GoogleAuthService);
  private cartolaApiService = inject(CartolaApiService);
  
  private readonly LAST_CALCULATED_KEY = 'ultima_rodada_calculada';
  private readonly LAST_HISTORY_SAVED_KEY = 'ultimo_historico_salvo';
  private checkIntervalMinutes = 60; // Verificar a cada 60 minutos (1 hora)
  
  private subscriptions: Subscription[] = [];
  private schedulerActive = false;
  // Adicionado semáforo para evitar cálculos concorrentes
  private calculatingRodadas = new Set<number>();
  // Semáforo para evitar salvamento concorrente de histórico
  private savingHistoriaRodadas = new Set<number>();
  // Subscription para acompanhar estado de autenticação
  private user$: Subscription;
  
  // Status do mercado (constantes)
  private readonly MARKET_STATUS = {
    CLOSED: 0,      // Mercado fechado (durante a rodada)
    OPEN: 1,        // Mercado aberto (antes da rodada)
    MAINTENANCE: 3, // Em manutenção
    EVALUATING: 4   // Avaliando (pós-rodada)
  };

  constructor() { 
    // Verificar estado de autenticação quando o serviço for carregado
    this.user$ = this.googleAuthService.user$.subscribe(user => {
      const isAuthenticated = user !== null;
      if (isAuthenticated) {
        console.log('[TaskScheduler] Usuário autenticado, verificando se o scheduler deve ser iniciado');
        if (this.schedulerActive) {
          console.log('[TaskScheduler] Scheduler já está em execução');
        } else {
          this.startScheduler();
        }
      } else {
        console.log('[TaskScheduler] Usuário não autenticado, aguardando login');
        // Se o scheduler estiver rodando e o usuário deslogar, parar o scheduler
        if (this.schedulerActive) {
          console.log('[TaskScheduler] Parando scheduler devido ao logout');
          this.stopScheduler();
        }
      }
    });
  }

  /**
   * Inicia o agendador de tarefas
   */
  startScheduler(): Promise<boolean> {
    // Verificar se o usuário está autenticado antes de iniciar o scheduler
    if (!this.googleAuthService.isAuthenticated()) {
      console.log('[TaskScheduler] Tentativa de iniciar o scheduler sem autenticação, operação ignorada');
      return Promise.resolve(false);
    }
    
    if (this.schedulerActive) {
      console.log('[TaskScheduler] Agendador já está em execução, ignorando chamada.');
      return Promise.resolve(true);
    }
    
    this.schedulerActive = true;
    console.log('[TaskScheduler] Iniciando agendador de tarefas (intervalo: ' + this.checkIntervalMinutes + ' minutos)');
    
    // Realizar verificação inicial com um pequeno delay para evitar colisões com outras inicializações
    console.log('[TaskScheduler] Programando verificação inicial para daqui a 3 segundos...');
    setTimeout(() => {
      if (this.schedulerActive) { // Verificar novamente se o serviço ainda está em execução
        console.log('[TaskScheduler] Executando verificação inicial...');
        this.verificarTarefasPendentes().subscribe({
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
        switchMap(() => this.verificarTarefasPendentes())
      )
      .subscribe({
        next: (result) => console.log(`[TaskScheduler] Verificação agendada concluída. Resultado: ${result}`),
        error: (error) => console.error('[TaskScheduler] Erro na verificação agendada:', error)
      });
    
    this.subscriptions.push(subscription);
    
    return Promise.resolve(true);
  }

  /**
   * Encerra o agendador de tarefas
   */
  stopScheduler(): void {
    if (!this.schedulerActive) {
      return;
    }
    
    this.schedulerActive = false;
    console.log('[TaskScheduler] Encerrando agendador de tarefas');
    
    // Cancelar todas as assinaturas
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Verifica se o agendador está em execução
   */
  isRunning(): boolean {
    return this.schedulerActive;
  }

  ngOnDestroy(): void {
    this.stopScheduler();
    
    // Cancelar a inscrição de autenticação
    if (this.user$) {
      this.user$.unsubscribe();
    }
  }

  /**
   * Verifica e executa tarefas pendentes com base no status do mercado:
   * 1. Mercado Aberto: Verificar histórico e pontuações de rodadas anteriores
   * 2. Mercado Fechado: Verificar histórico, pontuações anteriores e calcular pontuações parciais
   */
  private verificarTarefasPendentes(): Observable<boolean> {
    console.log('[TaskScheduler] Iniciando verificação de tarefas pendentes...');
    
    // Verificar o status do mercado primeiro para decidir quais tarefas executar
    return this.cartolaApiService.getMarketStatus().pipe(
      switchMap(marketStatus => {
        if (!marketStatus) {
          console.warn('[TaskScheduler] Não foi possível obter o status do mercado. Executando verificações padrão.');
          // Executar verificações padrão se não conseguir obter o status do mercado
          return this.verificarPontuacoesEHistoricos();
        }
        
        const statusMercado = marketStatus.status_mercado;
        console.log(`[TaskScheduler] Status atual do mercado: ${statusMercado} (${this.getStatusMercadoDescricao(statusMercado)})`);
        
        // Verificar tarefas baseadas no status do mercado
        switch (statusMercado) {
          case this.MARKET_STATUS.OPEN: // Mercado aberto
            console.log('[TaskScheduler] Mercado aberto: verificando pontuações históricas e atualizando times');
            // Quando o mercado está aberto, devemos verificar pontuações históricas de rodadas anteriores
            return this.verificarPontuacoesHistoricas();
            
          case this.MARKET_STATUS.CLOSED: // Mercado fechado (rodada em andamento)
            console.log('[TaskScheduler] Mercado fechado: verificando pontuações e calculando parciais');
            
            // Com mercado fechado, verificar pontuações históricas e calcular pontuação parcial atual
            return this.verificarPontuacoesEHistoricos().pipe(
              switchMap(resultado => {
                // Calcular pontuações parciais para a rodada atual
                return this.calcularPontuacoesParciais().pipe(
                  map(resultadoParcial => resultado || resultadoParcial)
                );
              })
            );
            
          case this.MARKET_STATUS.EVALUATING: // Avaliando
            console.log('[TaskScheduler] Mercado em avaliação: calculando pontuações finais');
            
            // Quando o mercado está em avaliação, focar em calcular pontuações finais
            return this.verificarPontuacoesEHistoricos().pipe(
              map(resultado => {
                // Notificar sobre o status de avaliação
                this.notificationService.info('Mercado em avaliação, atualizando pontuações...');
                return resultado;
              })
            );
            
          case this.MARKET_STATUS.MAINTENANCE: // Manutenção
            console.log('[TaskScheduler] Mercado em manutenção: ignorando verificações');
            this.notificationService.info('Mercado em manutenção, algumas funcionalidades podem estar indisponíveis.');
            return of(false);
          
          default:
            console.log(`[TaskScheduler] Status de mercado desconhecido (${statusMercado}): executando verificações padrão`);
            return this.verificarPontuacoesEHistoricos();
        }
      }),
      catchError(error => {
        console.error('[TaskScheduler] Erro na verificação de tarefas pendentes:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Verifica apenas pontuações históricas (rodadas anteriores)
   * Usado quando o mercado está aberto, quando não queremos calcular pontuação da rodada atual
   */
  private verificarPontuacoesHistoricas(): Observable<boolean> {
    console.log('[TaskScheduler] Verificando apenas pontuações históricas...');
    
    // Obter a rodada atual primeiro
    return this.pontuacaoService.getRodadaAtual().pipe(
      switchMap(rodadaAtual => {
        if (!rodadaAtual) {
          console.warn('[TaskScheduler] Não foi possível obter a rodada atual.');
          return of(false);
        }
        
        const rodadaAtualId = rodadaAtual.id;
        console.log(`[TaskScheduler] Rodada atual: ${rodadaAtualId}. Verificando pontuações e históricos para rodadas anteriores.`);
        
        // Obter todos os times cadastrados
        return this.myTeamService.obterTodosTimes().pipe(
          switchMap(times => {
            if (!times || times.length === 0) {
              console.warn('[TaskScheduler] Nenhum time encontrado para calcular pontuações.');
              return of(false);
            }
            
            console.log(`[TaskScheduler] Encontrados ${times.length} times para verificar pontuações históricas.`);
            
            // Para cada time, verificar histórico e pontuações de rodadas anteriores
            const tarefas: Observable<boolean>[] = [];
            
            // Processar cada time para rodadas ANTERIORES à atual
            times.forEach((time: MyTeam) => {
              console.log(`[TaskScheduler] Verificando histórico e pontuações históricas para o time: ${time.name} (${time.id})`);
              
              // Verificar rodadas anteriores à atual
              for (let idRodada = 1; idRodada < rodadaAtualId; idRodada++) {
                // Primeiro verificar e salvar histórico se necessário
                tarefas.push(
                  this.teamHistoryService.getTimeHistoricoRodada(time.id, idRodada).pipe(
                    switchMap(historico => {
                      // Se o histórico não existir, tentar salvá-lo
                      if (!historico) {
                        console.log(`[TaskScheduler] Histórico do time ${time.id} não encontrado para rodada ${idRodada}. Tentando salvar...`);
                        return this.teamHistoryService.salvarHistoricoTimesRodada(idRodada);
                      }
                      return of(true);
                    }),
                    catchError(error => {
                      console.error(`[TaskScheduler] Erro ao verificar/salvar histórico do time ${time.id} para rodada ${idRodada}:`, error);
                      return of(false);
                    })
                  )
                );
                
                // Em seguida, verificar e calcular pontuação se necessário
                tarefas.push(
                  this.pontuacaoService.getPontuacaoTimeRodada(time.id, idRodada).pipe(
                    switchMap(pontuacaoExistente => {
                      if (pontuacaoExistente) {
                        console.log(`[TaskScheduler] Pontuação já existe para o time ${time.id} na rodada ${idRodada}.`);
                        return of(true);
                      }
                      
                      console.log(`[TaskScheduler] Pontuação não encontrada para o time ${time.id} na rodada ${idRodada}. Calculando...`);
                      
                      // Calcular pontuação usando histórico da rodada
                      return this.pontuacaoService.calcularPontuacaoTime(time, idRodada).pipe(
                        switchMap(pontuacao => {
                          console.log(`[TaskScheduler] Pontuação calculada para o time ${time.id} na rodada ${idRodada}: ${pontuacao.pontuacao_total}`);
                          
                          // Salvar a pontuação calculada
                          return this.pontuacaoService.salvarPontuacaoRodada(pontuacao);
                        })
                      );
                    }),
                    catchError(error => {
                      console.error(`[TaskScheduler] Erro ao calcular/salvar pontuação do time ${time.id} para rodada ${idRodada}:`, error);
                      return of(false);
                    })
                  )
                );
              }
            });
            
            if (tarefas.length === 0) {
              console.log('[TaskScheduler] Nenhuma tarefa pendente encontrada para pontuações históricas.');
              return of(true);
            }
            
            console.log(`[TaskScheduler] Executando ${tarefas.length} tarefas pendentes para pontuações históricas...`);
            
            // Executar todas as tarefas e retornar true se pelo menos uma for bem-sucedida
            return forkJoin(tarefas).pipe(
              map(resultados => resultados.some(resultado => resultado === true)),
              catchError(error => {
                console.error('[TaskScheduler] Erro ao executar tarefas pendentes de pontuações históricas:', error);
                return of(false);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('[TaskScheduler] Erro ao verificar pontuações históricas:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Função simplificada para verificar pontuações e históricos
   * Combina as verificações de pontuações e histórico de times em uma única chamada
   */
  private verificarPontuacoesEHistoricos(): Observable<boolean> {
    console.log('[TaskScheduler] Verificando pontuações e históricos...');
    
    // Obter a rodada atual primeiro
    return this.pontuacaoService.getRodadaAtual().pipe(
      switchMap(rodadaAtual => {
        if (!rodadaAtual) {
          console.warn('[TaskScheduler] Não foi possível obter a rodada atual.');
          return of(false);
        }
        
        console.log(`[TaskScheduler] Rodada atual: ${rodadaAtual.id}`);
        
        // Obter todos os times cadastrados
        return this.myTeamService.obterTodosTimes().pipe(
          switchMap(times => {
            if (!times || times.length === 0) {
              console.warn('[TaskScheduler] Nenhum time encontrado para calcular pontuações.');
              return of(false);
            }
            
            console.log(`[TaskScheduler] Encontrados ${times.length} times para verificar pontuações.`);
            
            // Para cada time, verificar histórico e pontuações de rodadas anteriores
            const tarefas: Observable<boolean>[] = [];
            
            // Processar cada time
            times.forEach((time: MyTeam) => {
              console.log(`[TaskScheduler] Verificando histórico e pontuações para o time: ${time.name} (${time.id})`);
              
              // Verificar histórico de rodadas anteriores (até a rodada atual - 1)
              for (let idRodada = 1; idRodada < rodadaAtual.id; idRodada++) {
                // Adicionar tarefa para verificar/salvar histórico do time para esta rodada
                tarefas.push(
                  this.teamHistoryService.getTimeHistoricoRodada(time.id, idRodada).pipe(
                    switchMap(historico => {
                      // Se o histórico não existir, tentar salvá-lo se possível
                      if (!historico) {
                        console.log(`[TaskScheduler] Histórico do time ${time.id} não encontrado para rodada ${idRodada}. Tentando salvar...`);
                        return this.teamHistoryService.salvarHistoricoTimesRodada(idRodada);
                      }
                      return of(true);
                    }),
                    catchError(error => {
                      console.error(`[TaskScheduler] Erro ao verificar/salvar histórico do time ${time.id} para rodada ${idRodada}:`, error);
                      return of(false);
                    })
                  )
                );
                
                // Verificar se a pontuação já foi calculada para este time nesta rodada
                tarefas.push(
                  this.pontuacaoService.getPontuacaoTimeRodada(time.id, idRodada).pipe(
                    switchMap(pontuacaoExistente => {
                      if (pontuacaoExistente) {
                        console.log(`[TaskScheduler] Pontuação já existe para o time ${time.id} na rodada ${idRodada}.`);
                        return of(true);
                      }
                      
                      console.log(`[TaskScheduler] Pontuação não encontrada para o time ${time.id} na rodada ${idRodada}. Calculando...`);
                      
                      // Calcular pontuação usando histórico da rodada
                      return this.pontuacaoService.calcularPontuacaoTime(time, idRodada).pipe(
                        switchMap(pontuacao => {
                          console.log(`[TaskScheduler] Pontuação calculada para o time ${time.id} na rodada ${idRodada}: ${pontuacao.pontuacao_total}`);
                          
                          // Salvar a pontuação calculada
                          return this.pontuacaoService.salvarPontuacaoRodada(pontuacao);
                        })
                      );
                    }),
                    catchError(error => {
                      console.error(`[TaskScheduler] Erro ao calcular/salvar pontuação do time ${time.id} para rodada ${idRodada}:`, error);
                      return of(false);
                    })
                  )
                );
              }
            });
            
            if (tarefas.length === 0) {
              console.log('[TaskScheduler] Nenhuma tarefa pendente encontrada.');
              return of(true);
            }
            
            console.log(`[TaskScheduler] Executando ${tarefas.length} tarefas pendentes...`);
            
            // Executar todas as tarefas e retornar true se pelo menos uma for bem-sucedida
            return forkJoin(tarefas).pipe(
              map(resultados => resultados.some(resultado => resultado === true)),
              catchError(error => {
                console.error('[TaskScheduler] Erro ao executar tarefas pendentes:', error);
                return of(false);
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('[TaskScheduler] Erro ao verificar pontuações e históricos:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Calcula pontuações parciais durante a rodada
   */
  private calcularPontuacoesParciais(): Observable<boolean> {
    console.log('[TaskScheduler] Calculando pontuações parciais...');
    
    // Obter a rodada atual
    return this.pontuacaoService.getRodadaAtual().pipe(
      switchMap(rodadaAtual => {
        if (!rodadaAtual) {
          console.warn('[TaskScheduler] Não foi possível obter a rodada atual.');
          return of(false);
        }
        
        const rodadaId = rodadaAtual.id;
        console.log(`[TaskScheduler] Calculando pontuações parciais para a rodada atual: ${rodadaId}`);
        
        // Obter todos os times cadastrados
        return this.myTeamService.obterTodosTimes().pipe(
          switchMap(times => {
            if (!times || times.length === 0) {
              console.warn('[TaskScheduler] Nenhum time encontrado para calcular pontuações parciais.');
              return of(false);
            }
            
            console.log(`[TaskScheduler] Encontrados ${times.length} times para calcular pontuações parciais.`);
            
            // Calcular pontuações parciais para cada time
            const tarefas: Observable<boolean>[] = times.map((time: MyTeam) => 
              this.pontuacaoService.calcularPontuacaoTime(time, rodadaId).pipe(
                switchMap(pontuacao => {
                  console.log(`[TaskScheduler] Pontuação parcial calculada para o time ${time.id} na rodada ${rodadaId}: ${pontuacao.pontuacao_total}`);
                  
                  // Primeiro remover pontuações existentes (para permitir recálculo parcial)
                  return this.pontuacaoService.removerPontuacaoTimeRodada(time.id, rodadaId).pipe(
                    switchMap(() => {
                      // Depois salvar a nova pontuação calculada
                      return this.pontuacaoService.salvarPontuacaoRodada(pontuacao);
                    })
                  );
                }),
                catchError(error => {
                  console.error(`[TaskScheduler] Erro ao calcular/salvar pontuação parcial do time ${time.id} para rodada ${rodadaId}:`, error);
                  return of(false);
                })
              )
            );
            
            if (tarefas.length === 0) {
              return of(true);
            }
            
            // Executar todas as tarefas e retornar true se pelo menos uma for bem-sucedida
            return forkJoin(tarefas).pipe(
              map(resultados => resultados.some(resultado => resultado === true))
            );
          })
        );
      }),
      catchError(error => {
        console.error('[TaskScheduler] Erro ao calcular pontuações parciais:', error);
        return of(false);
      })
    );
  }
  
  /**
   * Retorna a descrição do status do mercado
   */
  private getStatusMercadoDescricao(status: number): string {
    switch (status) {
      case this.MARKET_STATUS.CLOSED:
        return 'Fechado (rodada em andamento)';
      case this.MARKET_STATUS.OPEN:
        return 'Aberto';
      case this.MARKET_STATUS.MAINTENANCE:
        return 'Em manutenção';
      case this.MARKET_STATUS.EVALUATING:
        return 'Avaliando';
      default:
        return `Desconhecido (${status})`;
    }
  }
  
  /**
   * Força a execução de uma tarefa específica
   */
  executarTarefaManual(tarefa: 'atualizar-times' | 'calcular-pontuacoes' | 'calcular-parciais'): Observable<boolean> {
    console.log(`[TaskScheduler] Executando tarefa manualmente: ${tarefa}`);
    
    switch (tarefa) {
      case 'atualizar-times':
        this.notificationService.info('Atualizando times...');
        return of(true);
        
      case 'calcular-pontuacoes':
        this.notificationService.info('Calculando pontuações...');
        return of(true);
        
      case 'calcular-parciais':
        this.notificationService.info('Calculando pontuações parciais...');
        return this.calcularPontuacoesParciais();
        
      default:
        this.notificationService.error(`Tarefa desconhecida: ${tarefa}`);
        return of(false);
    }
  }

  /**
   * Força o recálculo da pontuação de um time para uma rodada específica
   */
  recalcularPontuacaoRodada(rodadaId: number): Observable<boolean> {
    console.log(`[TaskScheduler] Iniciando recálculo manual da pontuação para a rodada ${rodadaId}...`);
    this.notificationService.info(`Recalculando pontuações da rodada ${rodadaId}...`);
    
    // Obter todos os times
    return this.myTeamService.obterTodosTimes().pipe(
      switchMap(times => {
        if (!times || times.length === 0) {
          this.notificationService.error(`Nenhum time encontrado para recalcular na rodada ${rodadaId}`);
          return of(false);
        }
        
        console.log(`[TaskScheduler] Recalculando pontuações para ${times.length} times na rodada ${rodadaId}`);
        
        // Tarefas para recalcular cada time
        const tarefas: Observable<boolean>[] = times.map((time: MyTeam) => {
          // Primeiro remover pontuações existentes
          return this.pontuacaoService.removerPontuacaoTimeRodada(time.id, rodadaId).pipe(
            switchMap(() => {
              // Depois calcular novamente usando o histórico
              return this.pontuacaoService.calcularPontuacaoTime(time, rodadaId).pipe(
                switchMap(pontuacao => {
                  console.log(`[TaskScheduler] Pontuação recalculada para o time ${time.id} na rodada ${rodadaId}: ${pontuacao.pontuacao_total}`);
                  return this.pontuacaoService.salvarPontuacaoRodada(pontuacao);
                })
              );
            }),
            catchError(error => {
              console.error(`[TaskScheduler] Erro ao recalcular pontuação do time ${time.id} para rodada ${rodadaId}:`, error);
              return of(false);
            })
          );
        });
        
        // Executar todas as tarefas de recálculo
        return forkJoin(tarefas).pipe(
          map(resultados => {
            const sucessos = resultados.filter(r => r === true).length;
            const total = resultados.length;
            
            if (sucessos === total) {
              this.notificationService.success(`Todas as ${total} pontuações da rodada ${rodadaId} foram recalculadas com sucesso!`);
            } else {
              this.notificationService.warning(`${sucessos} de ${total} pontuações da rodada ${rodadaId} foram recalculadas com sucesso.`);
            }
            
            return sucessos > 0;
          }),
          catchError(error => {
            console.error(`[TaskScheduler] Erro geral no recálculo da rodada ${rodadaId}:`, error);
            this.notificationService.error(`Erro ao recalcular pontuações da rodada ${rodadaId}`);
            return of(false);
          })
        );
      })
    );
  }
}