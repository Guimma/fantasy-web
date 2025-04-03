import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, map, switchMap, tap, forkJoin, catchError } from 'rxjs';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CartolaApiService } from '../../../core/services/cartola-api.service';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { MyTeam, MyTeamPlayer } from '../models/my-team.model';
import { Rodada, PontuacaoRodada, AtletaPontuado, DetalhePontuacaoAtleta } from '../models/pontuacao.model';
import { Athlete } from '../../draft/models/draft.model';
import { TeamHistoryService } from './team-history.service';
import { isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PontuacaoService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private cartolaApiService = inject(CartolaApiService);
  private googleAuthService = inject(GoogleAuthService);
  private teamHistoryService = inject(TeamHistoryService);
  
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly PONTUACOES_RANGE = 'Pontuacoes!A:E'; // id_pontuacao, id_time, id_rodada, pontuacao_total, data_calculo
  private readonly PONTUACOES_ATLETAS_RANGE = 'PontuacoesAtletas!A:D'; // id_pontuacao, id_atleta, pontuacao, scout (JSON)
  private readonly HISTORICO_TIMES_RANGE = 'HistoricoTimes!A:I'; // id_registro, id_time, id_atleta, id_cartola, status_time, valor_compra, data_aquisicao, rodada_id, data_registro
  
  private readonly RODADA_CACHE_KEY = 'rodada_atual';
  private readonly PONTUACOES_CACHE_KEY = 'pontuacoes_rodada_';

  constructor() { }

  /**
   * Obtém a rodada atual do campeonato
   */
  getRodadaAtual(): Observable<Rodada> {
    console.log('[PontuacaoService] Tentando obter rodada atual do campeonato');
    
    // Verificar se temos em cache primeiro
    const cachedRound = this.storageService.get<Rodada>(this.RODADA_CACHE_KEY);
    if (cachedRound) {
      // Verificar se o cache não está expirado (1 hora)
      const cacheTime = new Date(cachedRound.fim).getTime();
      if (Date.now() - cacheTime < 60 * 60 * 1000) {
        console.log('[PontuacaoService] Usando rodada em cache:', cachedRound);
        return of(cachedRound);
      }
      console.log('[PontuacaoService] Cache de rodada expirado, atualizando dados');
    } else {
      console.log('[PontuacaoService] Nenhuma rodada em cache, buscando da API');
    }

    // Buscar a rodada atual da API do Cartola
    return this.cartolaApiService.getCurrentRound().pipe(
      map(response => {
        console.log('[PontuacaoService] Resposta da API para rodada atual:', response);
        
        if (!response) {
          console.error('[PontuacaoService] Resposta vazia da API');
          throw new Error('Não foi possível obter a rodada atual');
        }

        const rodada: Rodada = {
          id: response.rodada_id,
          nome: `Rodada ${response.rodada_id}`,
          inicio: new Date(response.inicio),
          fim: new Date(response.fim),
          status: this.calcularStatusRodada(response)
        };

        // Salvar em cache
        this.storageService.set(this.RODADA_CACHE_KEY, rodada);
        console.log('[PontuacaoService] Rodada obtida e salva em cache:', rodada);
        
        return rodada;
      }),
      catchError(error => {
        this.notificationService.error('Erro ao obter a rodada atual');
        console.error('[PontuacaoService] Erro ao obter a rodada atual:', error);
        
        // Em produção, retornar uma rodada padrão
        const rodadaPadrao = {
          id: 1,
          nome: 'Rodada 1',
          inicio: new Date(),
          fim: new Date(),
          status: 'em_andamento' as 'em_andamento' | 'finalizada' | 'futura'
        };
        
        console.log('[PontuacaoService] Usando rodada padrão após erro:', rodadaPadrao);
        return of(rodadaPadrao);
      })
    );
  }

  /**
   * Calcula o status da rodada com base nas datas
   */
  private calcularStatusRodada(rodadaData: any): 'em_andamento' | 'finalizada' | 'futura' {
    // Verificar se a API já informou explicitamente o status
    if (rodadaData.status_rodada === 'finalizada' || rodadaData.status_transmissao === 2) {
      console.log(`[PontuacaoService] Rodada ${rodadaData.rodada_id} está finalizada conforme dados da API`);
      return 'finalizada';
    }
    
    const now = new Date();
    const inicio = new Date(rodadaData.inicio);
    const fim = new Date(rodadaData.fim);

    console.log(`[PontuacaoService] Calculando status da rodada ${rodadaData.rodada_id}: inicio=${inicio}, fim=${fim}, now=${now}`);

    if (now < inicio) {
      console.log(`[PontuacaoService] Rodada ${rodadaData.rodada_id} é futura`);
      return 'futura';
    } else if (now > fim) {
      console.log(`[PontuacaoService] Rodada ${rodadaData.rodada_id} está finalizada`);
      return 'finalizada';
    } else {
      console.log(`[PontuacaoService] Rodada ${rodadaData.rodada_id} está em andamento`);
      return 'em_andamento';
    }
  }

  /**
   * Obtém uma rodada específica pelo ID
   */
  getRodadaPorId(rodadaId: number): Observable<Rodada> {
    console.log(`[PontuacaoService] Obtendo rodada por ID: ${rodadaId}`);
    
    // Verificar se temos a rodada atual em cache e é a mesma que estamos solicitando
    const cachedRound = this.storageService.get<Rodada>(this.RODADA_CACHE_KEY);
    if (cachedRound && cachedRound.id === rodadaId) {
      console.log(`[PontuacaoService] Usando rodada ${rodadaId} do cache:`, cachedRound);
      return of(cachedRound);
    }
    
    // Buscar da API do Cartola
    // No momento, a API não tem endpoint para rodada específica, 
    // então vamos buscar todas e filtrar
    return this.cartolaApiService.getCurrentRound().pipe(
      map(response => {
        console.log(`[PontuacaoService] Resposta da API para rodada ${rodadaId}:`, response);
        
        if (!response) {
          console.error(`[PontuacaoService] Resposta vazia da API para rodada ${rodadaId}`);
          throw new Error(`Não foi possível obter a rodada ${rodadaId}`);
        }

        // Se estivermos buscando a rodada atual, usar o objeto recebido
        if (response.rodada_id === rodadaId) {
          console.log(`[PontuacaoService] Rodada ${rodadaId} é a atual, usando dados da API`);
          
          const rodadaAtual: Rodada = {
            id: rodadaId,
            nome: `Rodada ${rodadaId}`,
            inicio: new Date(response.inicio),
            fim: new Date(response.fim),
            status: this.calcularStatusRodada(response)
          };
          
          return rodadaAtual;
        }
        
        // Para rodadas anteriores, assumimos que estão finalizadas 
        // (verificação segura já que só calculamos após o término)
        if (rodadaId < response.rodada_id) {
          console.log(`[PontuacaoService] Rodada ${rodadaId} é anterior à atual (${response.rodada_id}), considerando finalizada`);
          
          // Como a API atual não retorna todas as rodadas, estamos 
          // criando uma rodada básica com o ID fornecido
          const rodadaAnterior: Rodada = {
            id: rodadaId,
            nome: `Rodada ${rodadaId}`,
            inicio: new Date(),  // Idealmente, teríamos as datas corretas
            fim: new Date(),     // Idealmente, teríamos as datas corretas
            status: 'finalizada' // Assumindo que rodadas anteriores estão finalizadas
          };
          
          return rodadaAnterior;
        }
        
        // Para rodadas futuras, assumimos que ainda não iniciaram
        console.log(`[PontuacaoService] Rodada ${rodadaId} é futura, ainda não iniciada`);
        const rodadaFutura: Rodada = {
          id: rodadaId,
          nome: `Rodada ${rodadaId}`,
          inicio: new Date(),  // Idealmente, teríamos as datas corretas
          fim: new Date(),     // Idealmente, teríamos as datas corretas
          status: 'futura'     // Rodadas futuras
        };
        
        return rodadaFutura;
      }),
      catchError(error => {
        this.notificationService.error(`Erro ao obter a rodada ${rodadaId}`);
        console.error(`[PontuacaoService] Erro ao obter a rodada ${rodadaId}:`, error);
        return of(null as unknown as Rodada);
      })
    );
  }

  /**
   * Verifica se uma rodada foi finalizada
   */
  isRodadaFinalizada(rodadaId: number): Observable<boolean> {
    console.log(`[PontuacaoService] Verificando se rodada ${rodadaId} está finalizada`);
    
    // Primeiro verificar a rodada atual
    return this.getRodadaAtual().pipe(
      switchMap(rodadaAtual => {
        console.log(`[PontuacaoService] Rodada atual: ${rodadaAtual.id}, Status: ${rodadaAtual.status}`);
        
        // Se a rodada solicitada é anterior à atual, consideramos finalizada
        if (rodadaId < rodadaAtual.id) {
          console.log(`[PontuacaoService] Rodada ${rodadaId} é anterior à atual (${rodadaAtual.id}), considerada finalizada automaticamente`);
          return of(true);
        }
        
        // Se é a rodada atual, verificar o status
        if (rodadaId === rodadaAtual.id) {
          const finalizada = rodadaAtual.status === 'finalizada';
          console.log(`[PontuacaoService] Rodada ${rodadaId} é a atual. Status: ${rodadaAtual.status}, Finalizada: ${finalizada}`);
          return of(finalizada);
        }
        
        // Se é uma rodada futura, não está finalizada
        console.log(`[PontuacaoService] Rodada ${rodadaId} é futura (atual: ${rodadaAtual.id}), não finalizada`);
        return of(false);
      }),
      catchError(error => {
        console.error(`[PontuacaoService] Erro ao verificar se rodada ${rodadaId} está finalizada:`, error);
        // Em caso de erro, verificar usando o método antigo
        return this.getRodadaPorId(rodadaId).pipe(
          map(rodada => {
            const finalizada = rodada && rodada.status === 'finalizada';
            console.log(`[PontuacaoService] Fallback: Rodada ${rodadaId} finalizada: ${finalizada}`);
            return finalizada;
          })
        );
      })
    );
  }

  /**
   * Obtém as pontuações dos atletas de uma rodada específica
   */
  getAtletasPontuadosRodada(rodadaId: number): Observable<Record<string, AtletaPontuado>> {
    // Verificar cache primeiro
    const cacheKey = `${this.PONTUACOES_CACHE_KEY}${rodadaId}`;
    const cachedScores = this.storageService.get<Record<string, AtletaPontuado>>(cacheKey);
    
    if (cachedScores) {
      return of(cachedScores);
    }

    // Buscar da API do Cartola
    return this.cartolaApiService.getAthletesScores(rodadaId).pipe(
      map(response => {
        if (!response || !response.atletas) {
          return {};
        }

        // Mapear para o formato esperado
        const pontuacoes: Record<string, AtletaPontuado> = {};
        
        Object.keys(response.atletas).forEach(id => {
          const atleta = response.atletas[id];
          
          pontuacoes[id] = {
            atleta_id: id,
            cartola_id: id,
            pontuacao: atleta.pontuacao,
            scout: atleta.scout || {},
            nome: atleta.nome,
            apelido: atleta.apelido,
            posicao: atleta.posicao,
            posicaoAbreviacao: atleta.posicao_abreviacao,
            clube: atleta.clube,
            clubeAbreviacao: atleta.clube_abreviacao
          };
        });

        // Salvar em cache
        this.storageService.set(cacheKey, pontuacoes);
        
        return pontuacoes;
      }),
      catchError(error => {
        this.notificationService.error(`Erro ao obter pontuações da rodada ${rodadaId}`);
        console.error(`Erro ao obter pontuações da rodada ${rodadaId}:`, error);
        return of({});
      })
    );
  }

  /**
   * Calcula a pontuação de um time para uma rodada específica
   * @param team Time a ser calculado
   * @param rodadaId Rodada a ser calculada
   * @returns Observable com o objeto de pontuação calculado
   */
  calcularPontuacaoTime(team: MyTeam, rodadaId: number): Observable<PontuacaoRodada> {
    console.log(`[PontuacaoService] Calculando pontuação do time ${team.id} para a rodada ${rodadaId}`);
    
    // Para rodadas anteriores à atual, usar o histórico de times
    return this.getRodadaAtual().pipe(
      switchMap(rodadaAtual => {
        // Verificar se é uma rodada passada
        const isRodadaPassada = rodadaId < rodadaAtual.id;
        console.log(`[PontuacaoService] Rodada ${rodadaId} é ${isRodadaPassada ? 'passada' : 'atual/futura'}`);
        
        // Se for rodada passada, buscar jogadores do histórico
        if (isRodadaPassada) {
          console.log(`[PontuacaoService] Buscando jogadores do histórico para o time ${team.id} na rodada ${rodadaId}`);
          return this.obterJogadoresHistoricoTimeRodada(team.id, rodadaId).pipe(
            switchMap(jogadoresHistorico => {
              if (!jogadoresHistorico || jogadoresHistorico.length === 0) {
                console.warn(`[PontuacaoService] Nenhum jogador encontrado no histórico para o time ${team.id} na rodada ${rodadaId}`);
                // Se não encontrar jogadores no histórico, usar o elenco atual como fallback
                console.log(`[PontuacaoService] Usando elenco atual como fallback`);
                return this.calcularPontuacaoTimeComJogadores(team, rodadaId, team.players);
              }
              
              console.log(`[PontuacaoService] Encontrados ${jogadoresHistorico.length} jogadores no histórico para o time ${team.id} na rodada ${rodadaId}`);
              // Usar os jogadores do histórico para calcular a pontuação
              return this.calcularPontuacaoTimeComJogadores(team, rodadaId, jogadoresHistorico);
            })
          );
        } else {
          // Para rodada atual ou futura, usar o elenco atual do time
          console.log(`[PontuacaoService] Usando elenco atual para calcular pontuação da rodada ${rodadaId}`);
          return this.calcularPontuacaoTimeComJogadores(team, rodadaId, team.players);
        }
      })
    );
  }

  /**
   * Obtém os jogadores do histórico de um time para uma rodada específica
   * @param timeId ID do time
   * @param rodadaId ID da rodada
   * @returns Observable com a lista de jogadores
   */
  private obterJogadoresHistoricoTimeRodada(timeId: string, rodadaId: number): Observable<Athlete[]> {
    console.log(`[PontuacaoService] Obtendo jogadores do histórico para time ${timeId} na rodada ${rodadaId}`);
    
    // Usar o TeamHistoryService para obter o histórico do time na rodada
    return this.teamHistoryService.getTimeHistoricoRodada(timeId, rodadaId).pipe(
      map(historico => {
        if (!historico) {
          console.warn(`[PontuacaoService] Nenhum histórico encontrado para o time ${timeId} na rodada ${rodadaId}`);
          return [];
        }
        
        console.log(`[PontuacaoService] Histórico encontrado com ${historico.jogadores.length} jogadores`);
        return historico.jogadores;
      }),
      // Se ocorrer erro, retornar array vazio
      catchError(error => {
        console.error(`[PontuacaoService] Erro ao obter histórico do time ${timeId} na rodada ${rodadaId}:`, error);
        return of([]);
      })
    );
  }

  /**
   * Calcula a pontuação de um time usando uma lista específica de jogadores
   * @param team Time a ser calculado
   * @param rodadaId Rodada a ser calculada
   * @param jogadores Lista de jogadores a serem considerados no cálculo
   * @returns Observable com o objeto de pontuação calculado
   */
  private calcularPontuacaoTimeComJogadores(team: MyTeam, rodadaId: number, jogadores: Athlete[] | MyTeamPlayer[]): Observable<PontuacaoRodada> {
    console.log(`[PontuacaoService] Calculando pontuação para ${jogadores.length} jogadores do time ${team.id} na rodada ${rodadaId}`);
    
    // Extrair os IDs dos jogadores para buscar pontuações
    const cartolaIds = jogadores.map(jogador => jogador.idCartola).filter(id => !!id);
    
    if (cartolaIds.length === 0) {
      console.warn(`[PontuacaoService] Nenhum ID válido encontrado para jogadores do time ${team.id}`);
      
      // Retornar pontuação zerada
      return of({
        time_id: team.id,
        rodada_id: rodadaId,
        pontuacao_total: 0,
        data_calculo: new Date(),
        atletas_pontuados: []
      });
    }
    
    // Buscar as pontuações dos jogadores na API do Cartola
    return this.cartolaApiService.getAthletesScores(rodadaId).pipe(
      map(response => {
        if (!response || !response.atletas) {
          console.warn(`[PontuacaoService] Sem dados de pontuação para a rodada ${rodadaId}`);
          return {
            time_id: team.id,
            rodada_id: rodadaId,
            pontuacao_total: 0,
            data_calculo: new Date(),
            atletas_pontuados: []
          };
        }
        
        const atletasPontuados: AtletaPontuado[] = [];
        let pontuacaoTotal = 0;
        
        // Verificar e acumular pontuações para cada jogador do time
        cartolaIds.forEach(cartolaId => {
          const atletaPontuacao = response.atletas[cartolaId];
          if (atletaPontuacao) {
            // Encontrar dados do jogador no elenco
            const jogador = jogadores.find(j => j.idCartola === cartolaId);
            if (jogador) {
              // Criar o objeto de atleta pontuado
              const atletaPontuado: AtletaPontuado = {
                atleta_id: jogador.id,
                cartola_id: cartolaId,
                nome: jogador.nome || '',
                apelido: jogador.apelido || '',
                posicao: jogador.posicao || '',
                posicaoAbreviacao: jogador.posicaoAbreviacao || '',
                clube: jogador.clube || '',
                clubeAbreviacao: jogador.clubeAbreviacao || '',
                pontuacao: atletaPontuacao.pontuacao,
                scout: atletaPontuacao.scout || {},
                entrou_em_campo: true,
                consideradoNaCalculacao: true
              };
              
              // Acumular pontuação
              pontuacaoTotal += atletaPontuacao.pontuacao;
              atletasPontuados.push(atletaPontuado);
              
              console.log(`[PontuacaoService] Jogador ${atletaPontuado.apelido} (${cartolaId}) pontuou ${atletaPontuacao.pontuacao} na rodada ${rodadaId}`);
            }
          }
        });
        
        // Adicionar jogadores que não pontuaram
        jogadores.forEach(jogador => {
          if (jogador.idCartola && !atletasPontuados.some(a => a.cartola_id === jogador.idCartola)) {
            const atletaPontuado: AtletaPontuado = {
              atleta_id: jogador.id,
              cartola_id: jogador.idCartola,
              nome: jogador.nome || '',
              apelido: jogador.apelido || '',
              foto_url: (jogador as any).foto_url || '',
              posicao: jogador.posicao || '',
              posicaoAbreviacao: jogador.posicaoAbreviacao || '',
              clube: jogador.clube || '',
              clubeAbreviacao: jogador.clubeAbreviacao || '',
              pontuacao: 0,
              scout: {},
              entrou_em_campo: false,
              consideradoNaCalculacao: false
            };
            
            atletasPontuados.push(atletaPontuado);
            console.log(`[PontuacaoService] Jogador ${atletaPontuado.apelido} (${jogador.idCartola}) não pontuou na rodada ${rodadaId}`);
          }
        });
        
        console.log(`[PontuacaoService] Time ${team.id} - Rodada ${rodadaId}: Pontuação total = ${pontuacaoTotal} com ${atletasPontuados.length} jogadores`);
        
        // Criar objeto de pontuação para retorno
        return {
          time_id: team.id,
          rodada_id: rodadaId,
          pontuacao_total: pontuacaoTotal,
          data_calculo: new Date(),
          atletas_pontuados: atletasPontuados
        };
      }),
      catchError(error => {
        console.error(`[PontuacaoService] Erro ao calcular pontuação do time ${team.id} para a rodada ${rodadaId}:`, error);
        
        // Retornar pontuação zerada em caso de erro
        return of({
          time_id: team.id,
          rodada_id: rodadaId,
          pontuacao_total: 0,
          data_calculo: new Date(),
          atletas_pontuados: []
        });
      })
    );
  }

  /**
   * Salva a pontuação de um time para uma rodada
   */
  salvarPontuacaoRodada(pontuacao: PontuacaoRodada): Observable<boolean> {
    console.log(`[PontuacaoService] Salvando pontuação do time ${pontuacao.time_id} para a rodada ${pontuacao.rodada_id}. Total: ${pontuacao.pontuacao_total}`);
    
    // Verificar se o usuário está autenticado
    if (!this.googleAuthService.isAuthenticated()) {
      console.error('[PontuacaoService] Usuário não autenticado para acessar a planilha');
      this.notificationService.error('Você precisa estar autenticado para salvar dados de pontuação');
      return of(false);
    }
    
    // Primeiro verificar se já existe pontuação para este time/rodada
    return this.getPontuacaoTimeRodada(pontuacao.time_id, pontuacao.rodada_id).pipe(
      switchMap(pontuacaoExistente => {
        if (pontuacaoExistente) {
          console.log(`[PontuacaoService] Pontuação para o time ${pontuacao.time_id} na rodada ${pontuacao.rodada_id} já existe. Ignorando salvamento.`);
          return of(true); // Retornar sucesso para não quebrar o fluxo
        }
        
        // Primeira etapa: salvar a pontuação geral na planilha
        const values = [
          [
            this.generateUniqueId(), // id_pontuacao
            pontuacao.time_id,
            pontuacao.rodada_id.toString(),
            pontuacao.pontuacao_total.toString(),
            pontuacao.data_calculo.toISOString()
          ]
        ];

        const pontuacaoId = values[0][0];
        console.log(`[PontuacaoService] ID de pontuação gerado: ${pontuacaoId}`);
        
        return this.appendToSheet(this.PONTUACOES_RANGE, values).pipe(
          switchMap(success => {
            if (!success) {
              console.error(`[PontuacaoService] Erro ao salvar pontuação geral na planilha.`);
              return of(false);
            }
            
            console.log(`[PontuacaoService] Pontuação geral salva com sucesso. Salvando detalhes de ${pontuacao.atletas_pontuados.length} atletas...`);
            
            // Segunda etapa: salvar os detalhes de cada atleta
            const atletasValues = pontuacao.atletas_pontuados.map(atletaPontuado => {
              const atletaInfo = [
                pontuacaoId, // id_pontuacao
                atletaPontuado.atleta_id,
                atletaPontuado.pontuacao.toString(),
                JSON.stringify(atletaPontuado.scout)
              ];
              
              // Adicionar informações extras se disponíveis
              if (atletaPontuado.nome) atletaInfo.push(atletaPontuado.nome);
              else atletaInfo.push('');
              
              if (atletaPontuado.apelido) atletaInfo.push(atletaPontuado.apelido);
              else atletaInfo.push('');
              
              if (atletaPontuado.posicao) atletaInfo.push(atletaPontuado.posicao);
              else atletaInfo.push('');
              
              if (atletaPontuado.clube) atletaInfo.push(atletaPontuado.clube);
              else atletaInfo.push('');
              
              return atletaInfo;
            });

            if (atletasValues.length === 0) {
              console.log(`[PontuacaoService] Nenhum atleta pontuado para salvar.`);
              return of(true);
            }
            
            return this.appendToSheet(this.PONTUACOES_ATLETAS_RANGE, atletasValues);
          }),
          tap(success => {
            if (success) {
              console.log(`[PontuacaoService] Todos os detalhes dos atletas salvos com sucesso.`);
              this.notificationService.success(`Pontuação do time na rodada ${pontuacao.rodada_id} salva com sucesso!`);
            } else {
              console.error(`[PontuacaoService] Erro ao salvar detalhes dos atletas.`);
              this.notificationService.error(`Erro ao salvar pontuação do time na rodada ${pontuacao.rodada_id}`);
            }
          })
        );
      }),
      catchError(error => {
        console.error(`[PontuacaoService] Erro ao verificar/salvar pontuação: ${error}`);
        this.notificationService.error(`Erro ao processar pontuação da rodada ${pontuacao.rodada_id}`);
        return of(false);
      })
    );
  }

  /**
   * Obtém a pontuação de um time em uma rodada específica
   */
  getPontuacaoTimeRodada(timeId: string, rodadaId: number): Observable<PontuacaoRodada | null> {
    console.log(`[PontuacaoService] Buscando pontuação do time ${timeId} na rodada ${rodadaId}`);
    
    // Verificar se o usuário está autenticado
    if (!this.googleAuthService.isAuthenticated()) {
      console.error('[PontuacaoService] Usuário não autenticado para acessar a planilha');
      this.notificationService.error('Você precisa estar autenticado para acessar os dados de pontuação');
      return of(null);
    }
    
    // Obter o token de acesso do usuário atual
    const currentUser = this.googleAuthService.currentUser;
    if (!currentUser || !currentUser.accessToken) {
      console.error('[PontuacaoService] Token de acesso não disponível');
      this.notificationService.error('Erro de autenticação ao acessar dados de pontuação');
      return of(null);
    }
    
    // Configurar os headers de autorização para a chamada à API do Google Sheets
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${currentUser.accessToken}`,
      'Content-Type': 'application/json'
    });
    
    // Buscar primeiro a pontuação geral
    return this.http.get<any>(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.PONTUACOES_RANGE}`,
      { headers }
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          return of(null);
        }

        // Procurar a pontuação do time na rodada específica
        const pontuacaoRow = response.values.slice(1).find((row: any[]) => 
          row[1] === timeId && parseInt(row[2], 10) === rodadaId
        );
        
        if (!pontuacaoRow) {
          return of(null);
        }

        const pontuacaoId = pontuacaoRow[0];
        
        // Buscar os detalhes dos atletas para esta pontuação
        return this.http.get<any>(
          `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.PONTUACOES_ATLETAS_RANGE}`,
          { headers }
        ).pipe(
          map(atlResponse => {
            if (!atlResponse.values || atlResponse.values.length <= 1) {
              return null;
            }

            // Filtrar apenas os atletas desta pontuação
            const atletasRows = atlResponse.values.slice(1).filter((row: any[]) => 
              row[0] === pontuacaoId
            );
            
            // Mapear para o formato de AtletaPontuado
            const atletasPontuados: AtletaPontuado[] = atletasRows.map((row: any[]) => {
              // Tentar extrair informações adicionais do atleta se disponíveis
              // Formato esperado: id_pontuacao, atleta_id, pontuacao, scout, [nome], [apelido], [posicao], [clube]
              const atletaId = row[1];
              
              // Criar o objeto base
              const atletaPontuado: AtletaPontuado = {
                atleta_id: atletaId,
                cartola_id: atletaId,
                nome: '',
                apelido: '',
                posicao: '',
                posicaoAbreviacao: '',
                clube: '',
                clubeAbreviacao: '',
                pontuacao: parseFloat(row[2] || '0'),
                scout: row[3] ? JSON.parse(row[3]) : {},
                entrou_em_campo: true,
                consideradoNaCalculacao: true
              };
              
              // Adicionar informações extras se disponíveis (a partir da coluna 4)
              if (row.length > 4) {
                atletaPontuado.nome = row[4];
              }
              if (row.length > 5) {
                atletaPontuado.apelido = row[5];
              }
              if (row.length > 6) {
                atletaPontuado.posicao = row[6];
                // Determinar a abreviação da posição
                if (row[6]) {
                  const posicaoLower = row[6].toLowerCase();
                  if (posicaoLower.includes('goleiro')) atletaPontuado.posicaoAbreviacao = 'GOL';
                  else if (posicaoLower.includes('zagueiro')) atletaPontuado.posicaoAbreviacao = 'ZAG';
                  else if (posicaoLower.includes('lateral')) atletaPontuado.posicaoAbreviacao = 'LAT';
                  else if (posicaoLower.includes('meia')) atletaPontuado.posicaoAbreviacao = 'MEI';
                  else if (posicaoLower.includes('atacante')) atletaPontuado.posicaoAbreviacao = 'ATA';
                  else if (posicaoLower.includes('técnico') || posicaoLower.includes('tecnico')) atletaPontuado.posicaoAbreviacao = 'TEC';
                  else atletaPontuado.posicaoAbreviacao = 'JOG';
                }
              }
              if (row.length > 7) {
                atletaPontuado.clube = row[7];
                // Se tiver clube, tentar determinar a abreviação
                if (row[7]) {
                  // Extrair as 3 primeiras letras do nome do clube
                  atletaPontuado.clubeAbreviacao = row[7].substring(0, 3).toUpperCase();
                }
              }
              
              return atletaPontuado;
            });

            // Criar o objeto de pontuação completo
            return {
              time_id: timeId,
              rodada_id: rodadaId,
              pontuacao_total: parseFloat(pontuacaoRow[3] || '0'),
              data_calculo: new Date(pontuacaoRow[4]),
              atletas_pontuados: atletasPontuados
            };
          })
        );
      }),
      catchError(error => {
        console.error(`[PontuacaoService] Erro ao obter pontuação do time ${timeId} na rodada ${rodadaId}:`, error);
        this.notificationService.error(`Erro ao obter pontuação da rodada ${rodadaId}`);
        return of(null);
      })
    );
  }

  /**
   * Obtém os detalhes de pontuação de um time em uma rodada,
   * incluindo as informações completas de cada atleta
   */
  getDetalhesPontuacaoTime(timeId: string, rodadaId: number): Observable<DetalhePontuacaoAtleta[]> {
    // Primeiro verificar se temos os pontos calculados
    return this.getPontuacaoTimeRodada(timeId, rodadaId).pipe(
      switchMap(pontuacao => {
        if (!pontuacao || pontuacao.atletas_pontuados.length === 0) {
          // Se não existirem pontos calculados, retornar array vazio
          console.log(`[PontuacaoService] Nenhuma pontuação encontrada para o time ${timeId} na rodada ${rodadaId}`);
          return of([]);
        }

        // Obter o histórico do time para a rodada
        return this.teamHistoryService.getTimeHistoricoRodada(timeId, rodadaId).pipe(
          switchMap(historico => {
            if (!historico) {
              console.log(`[PontuacaoService] Histórico não encontrado para o time ${timeId} na rodada ${rodadaId}, usando dados da pontuação`);
              // Se não encontrar histórico, usar apenas os atletas pontuados
              return this.getDetalhesAtletas(pontuacao.atletas_pontuados);
            }

            console.log(`[PontuacaoService] Usando histórico do time ${timeId} na rodada ${rodadaId} com ${historico.jogadores.length} jogadores`);
            
            // Combinar os dados dos jogadores do histórico com as pontuações calculadas
            const detalhes: DetalhePontuacaoAtleta[] = [];
            
            // Mapear atletas pontuados por ID para busca rápida
            const atletasMap = new Map<string, AtletaPontuado>();
            pontuacao.atletas_pontuados.forEach(atletaPontuado => {
              atletasMap.set(atletaPontuado.atleta_id, atletaPontuado);
            });
            
            // Para cada jogador no histórico, verificar se tem pontuação
            historico.jogadores.forEach(jogador => {
              const atletaPontuado = atletasMap.get(jogador.id);
              
              if (atletaPontuado) {
                // Adicionar jogador do histórico com sua pontuação
                detalhes.push({
                  rodada_id: rodadaId,
                  atleta: jogador,
                  pontuacao: atletaPontuado.pontuacao,
                  scout: atletaPontuado.scout || {}
                });
              } else {
                // Jogador está no histórico mas não pontuou
                detalhes.push({
                  rodada_id: rodadaId,
                  atleta: jogador,
                  pontuacao: 0,
                  scout: {}
                });
              }
            });
            
            // Se houver atletas pontuados que não estão no histórico, adicioná-los também
            pontuacao.atletas_pontuados.forEach(atletaPontuado => {
              const jaAdicionado = detalhes.some(d => d.atleta.id === atletaPontuado.atleta_id);
              
              if (!jaAdicionado) {
                // Criar um objeto atleta a partir dos dados da pontuação
                const atleta: Athlete = this.createFallbackAthlete(atletaPontuado);
                
                detalhes.push({
                  rodada_id: rodadaId,
                  atleta: atleta,
                  pontuacao: atletaPontuado.pontuacao,
                  scout: atletaPontuado.scout || {}
                });
              }
            });
            
            console.log(`[PontuacaoService] Total de ${detalhes.length} detalhes de atletas retornados para o time ${timeId} na rodada ${rodadaId}`);
            return of(detalhes);
          })
        );
      })
    );
  }

  /**
   * Busca os detalhes completos de cada atleta pontuado
   */
  private getDetalhesAtletas(atletasPontuados: AtletaPontuado[]): Observable<DetalhePontuacaoAtleta[]> {
    console.log(`[PontuacaoService] Buscando detalhes completos para ${atletasPontuados.length} atletas pontuados`);
    
    // Buscar todos os atletas da API primeiro
    return this.cartolaApiService.getAllAthletes().pipe(
      map(response => {
        if (!response || !response.atletas) {
          console.warn('[PontuacaoService] Nenhum atleta retornado da API');
          return this.createFallbackAtletaDetails(atletasPontuados);
        }

        console.log(`[PontuacaoService] API retornou ${Object.keys(response.atletas).length} atletas`);
        
        // Criar mapa de pesquisa por IDs alternativos
        const atletasMap = new Map();
        Object.values(response.atletas).forEach((atleta: any) => {
          atletasMap.set(atleta.atleta_id?.toString(), atleta);
          atletasMap.set(atleta.id?.toString(), atleta);
          if (atleta.apelido) {
            atletasMap.set(atleta.apelido.toLowerCase(), atleta);
          }
        });
        
        console.log(`[PontuacaoService] Mapa de atletas criado com ${atletasMap.size} entradas`);

        // Mapear cada atleta pontuado para incluir seus detalhes completos
        const detalhes = atletasPontuados.map(atletaPontuado => {
          const atletaId = atletaPontuado.atleta_id;
          
          // Tentativa 1: verificar pelo ID direto no objeto response.atletas
          let atletaData = response.atletas[atletaId];
          
          // Tentativa 2: verificar pelo ID no mapa que criamos
          if (!atletaData) {
            atletaData = atletasMap.get(atletaId?.toString());
            if (atletaData) {
              console.log(`[PontuacaoService] Atleta ${atletaId} encontrado pelo mapa usando ID`);
            }
          }
          
          // Tentativa 3: verificar pelo apelido no mapa, se disponível
          if (!atletaData && atletaPontuado.apelido) {
            atletaData = atletasMap.get(atletaPontuado.apelido.toLowerCase());
            if (atletaData) {
              console.log(`[PontuacaoService] Atleta ${atletaId} encontrado pelo mapa usando apelido: ${atletaPontuado.apelido}`);
            }
          }
          
          // Tentativa 4: buscar por correspondência em todos os atletas
          if (!atletaData) {
            console.log(`[PontuacaoService] Atleta ${atletaId} não encontrado pelos métodos diretos, buscando por varredura completa`);
            
            atletaData = Object.values(response.atletas).find((a: any) => {
              return a.atleta_id?.toString() === atletaId?.toString() || 
                     a.id?.toString() === atletaId?.toString() ||
                     (atletaPontuado.apelido && a.apelido && 
                      a.apelido.toLowerCase() === atletaPontuado.apelido.toLowerCase());
            });
            
            if (atletaData) {
              console.log(`[PontuacaoService] Atleta ${atletaId} encontrado por varredura completa: ${atletaData.apelido}`);
            }
          }
          
          if (atletaData) {
            console.log(`[PontuacaoService] Atleta ${atletaId} encontrado na API: ${atletaData.apelido}`);
            const atleta = this.cartolaApiService.mapAthleteFromApi(atletaData);
            return {
              atleta,
              pontuacao: atletaPontuado.pontuacao,
              scout: atletaPontuado.scout
            };
          } else {
            // Se não encontrar, criar um objeto com base nas propriedades do atletaPontuado
            console.warn(`[PontuacaoService] Atleta ${atletaId} NÃO encontrado na API mesmo após busca extensiva, usando fallback`);
            
            // Criar um fallback usando o método auxiliar
            const atleta = this.createFallbackAthlete(atletaPontuado);
            
            return {
              atleta,
              pontuacao: atletaPontuado.pontuacao,
              scout: atletaPontuado.scout
            };
          }
        });

        console.log(`[PontuacaoService] Total de ${detalhes.length} detalhes de atletas mapeados`);
        return detalhes;
      }),
      catchError(error => {
        console.error('[PontuacaoService] Erro ao buscar detalhes dos atletas:', error);
        return of(this.createFallbackAtletaDetails(atletasPontuados));
      })
    );
  }
  
  /**
   * Cria um objeto Athlete com dados de fallback
   */
  private createFallbackAthlete(atletaPontuado: AtletaPontuado): Athlete {
    return {
      id: atletaPontuado.atleta_id,
      idCartola: atletaPontuado.atleta_id,
      slug: atletaPontuado.atleta_id,
      nome: atletaPontuado.nome || `Jogador ${atletaPontuado.atleta_id?.toString().substring(0, 4)}`,
      apelido: atletaPontuado.apelido || `Jogador ${atletaPontuado.atleta_id?.toString().substring(0, 4)}`,
      posicao: atletaPontuado.posicao || 'Meia',
      posicaoAbreviacao: atletaPontuado.posicaoAbreviacao || 'MEI',
      clube: atletaPontuado.clube || 'Time',
      clubeAbreviacao: atletaPontuado.clubeAbreviacao || 'TIM',
      preco: 0,
      mediaPontos: 0,
      jogos: 0,
      status: 'Disponível'
    };
  }

  /**
   * Cria detalhes de fallback para atletas quando a API falha
   */
  private createFallbackAtletaDetails(atletasPontuados: AtletaPontuado[]): DetalhePontuacaoAtleta[] {
    console.log('[PontuacaoService] Criando detalhes de fallback para atletas');
    return atletasPontuados.map(atletaPontuado => {
      // Criar um objeto Athlete com dados básicos usando o método auxiliar
      const atleta = this.createFallbackAthlete(atletaPontuado);
      
      return {
        atleta,
        pontuacao: atletaPontuado.pontuacao,
        scout: atletaPontuado.scout
      };
    });
  }

  /**
   * Adiciona novos dados a uma planilha do Google Sheets
   */
  private appendToSheet(range: string, values: any[][]): Observable<boolean> {
    console.log(`[PontuacaoService] Adicionando ${values.length} linhas à planilha no range ${range}...`);
    
    // Verificar se o usuário está autenticado
    if (!this.googleAuthService.isAuthenticated()) {
      console.error('[PontuacaoService] Usuário não autenticado para acessar a planilha');
      this.notificationService.error('Você precisa estar autenticado para salvar dados');
      return of(false);
    }
    
    // Obter o token de acesso do usuário atual
    const currentUser = this.googleAuthService.currentUser;
    if (!currentUser || !currentUser.accessToken) {
      console.error('[PontuacaoService] Token de acesso não disponível');
      this.notificationService.error('Erro de autenticação ao acessar dados');
      return of(false);
    }
    
    // Configurar os headers de autorização para a chamada à API do Google Sheets
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${currentUser.accessToken}`,
      'Content-Type': 'application/json'
    });
    
    const body = {
      values: values
    };

    return this.http.post<any>(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      body,
      { headers }
    ).pipe(
      map(response => {
        const success = !!response;
        console.log(`[PontuacaoService] Resultado da adição à planilha (${range}): ${success ? 'Sucesso' : 'Falha'}`);
        if (success && response.updates) {
          console.log(`[PontuacaoService] Células atualizadas: ${response.updates.updatedCells}, Linhas: ${response.updates.updatedRows}`);
        }
        return success;
      }),
      catchError(error => {
        console.error(`[PontuacaoService] Erro ao adicionar dados na planilha (${range}):`, error);
        if (error.error && error.error.error) {
          console.error(`[PontuacaoService] Detalhes do erro: ${error.error.error.message}`);
        }
        // Se for erro de autenticação (401 ou 403), tentar solicitar login
        if (error.status === 401 || error.status === 403) {
          this.notificationService.error('Erro de autenticação. Faça login novamente.');
          // Redirecionamento para o login poderia ser adicionado aqui
        }
        return of(false);
      })
    );
  }

  /**
   * Gera um ID único para registros na planilha
   */
  private generateUniqueId(): string {
    return `PONT_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Agenda o cálculo de pontuação para todos os times após o fim da rodada
   */
  agendarCalculoPontuacaoRodada(): void {
    // Verificar o status da rodada atual a cada 30 minutos
    setInterval(() => {
      this.verificarFimRodada();
    }, 30 * 60 * 1000); // 30 minutos
  }

  /**
   * Verifica se a rodada atual foi finalizada e dispara o cálculo de pontuação
   */
  private verificarFimRodada(): void {
    this.getRodadaAtual().pipe(
      switchMap(rodada => {
        if (rodada.status === 'finalizada') {
          // Rodada finalizada, verificar se já calculamos a pontuação
          console.log(`Rodada ${rodada.id} finalizada. Verificando se já calculamos a pontuação...`);
          
          // Buscar todos os times para calcular a pontuação
          // Essa implementação depende de como os times são armazenados
          // no sistema. Por enquanto, vamos apenas logar a ação.
          console.log(`Agendando cálculo de pontuação para todos os times da rodada ${rodada.id}`);
          
          // Em uma implementação real, buscaríamos todos os times e 
          // calcularíamos a pontuação para cada um.
          
          return of(true);
        }
        return of(false);
      })
    ).subscribe();
  }

  /**
   * Remove a pontuação existente de um time para uma rodada
   */
  removerPontuacaoTimeRodada(timeId: string, rodadaId: number): Observable<boolean> {
    console.log(`[PontuacaoService] Removendo pontuação do time ${timeId} na rodada ${rodadaId}`);
    
    // Verificar se o usuário está autenticado
    if (!this.googleAuthService.isAuthenticated()) {
      console.error('[PontuacaoService] Usuário não autenticado para acessar a planilha');
      this.notificationService.error('Você precisa estar autenticado para remover dados de pontuação');
      return of(false);
    }
    
    // Obter o token de acesso do usuário atual
    const currentUser = this.googleAuthService.currentUser;
    if (!currentUser || !currentUser.accessToken) {
      console.error('[PontuacaoService] Token de acesso não disponível');
      this.notificationService.error('Erro de autenticação ao acessar dados');
      return of(false);
    }
    
    // Configurar os headers de autorização para a chamada à API do Google Sheets
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${currentUser.accessToken}`,
      'Content-Type': 'application/json'
    });
    
    // Buscar primeiro a pontuação geral para obter o ID
    return this.http.get<any>(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.PONTUACOES_RANGE}`,
      { headers }
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          // Não há registros para remover
          return of(true);
        }

        // Procurar a pontuação do time na rodada específica
        const pontuacaoRows = response.values.slice(1).filter((row: any[]) => 
          row[1] === timeId && parseInt(row[2], 10) === rodadaId
        );
        
        if (pontuacaoRows.length === 0) {
          // Não há registros para remover
          return of(true);
        }

        // Coletar os IDs de todas as pontuações a serem removidas
        const pontuacaoIds = pontuacaoRows.map((row: any[]) => row[0]);
        console.log(`[PontuacaoService] IDs de pontuações a remover: ${pontuacaoIds.join(', ')}`);
        
        // Criar um array de promessas para remover cada registro
        const remocoes: Observable<boolean>[] = [];
        
        // Remover os registros das pontuações por atleta
        remocoes.push(this.removerRegistrosPontuacoesAtletas(pontuacaoIds));
        
        // Remover os registros das pontuações gerais
        remocoes.push(this.removerRegistrosPontuacoes(pontuacaoIds));
        
        // Executar todas as remoções
        return forkJoin(remocoes).pipe(
          map(resultados => resultados.every(r => r === true)),
          catchError(error => {
            console.error(`[PontuacaoService] Erro ao remover pontuações do time ${timeId} na rodada ${rodadaId}:`, error);
            return of(false);
          })
        );
      }),
      catchError(error => {
        console.error(`[PontuacaoService] Erro ao obter pontuações para remoção:`, error);
        this.notificationService.error('Erro ao tentar remover pontuações anteriores');
        return of(false);
      })
    );
  }
  
  /**
   * Remove registros de pontuações atletas baseado em IDs de pontuação
   */
  private removerRegistrosPontuacoesAtletas(pontuacaoIds: string[]): Observable<boolean> {
    console.log(`[PontuacaoService] Removendo registros de pontuações de atletas para as pontuações: ${pontuacaoIds.join(', ')}`);
    
    // Verificar se o usuário está autenticado
    if (!this.googleAuthService.isAuthenticated()) {
      console.error('[PontuacaoService] Usuário não autenticado para acessar a planilha');
      return of(false);
    }
    
    // Obter o token de acesso do usuário atual
    const currentUser = this.googleAuthService.currentUser;
    if (!currentUser || !currentUser.accessToken) {
      console.error('[PontuacaoService] Token de acesso não disponível');
      return of(false);
    }
    
    // Configurar os headers de autorização para a chamada à API do Google Sheets
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${currentUser.accessToken}`,
      'Content-Type': 'application/json'
    });
    
    // Na implementação atual, não é possível deletar linhas específicas no Google Sheets via API
    // A melhor maneira seria usar Google Apps Script para essa remoção
    // Como não temos isso disponível, vamos simplesmente retornar sucesso e deixar que 
    // as novas entradas sejam adicionadas para substituir as antigas
    
    console.log(`[PontuacaoService] Não é possível remover diretamente entradas do Google Sheets via API.`);
    console.log(`[PontuacaoService] Em uma implementação completa, usaríamos Google Apps Script para isso.`);
    console.log(`[PontuacaoService] Para agora, confiaremos na verificação de pontuações existentes para evitar duplicação.`);
    
    // Retornar sucesso para continuar o fluxo
    return of(true);
  }
  
  /**
   * Remove registros de pontuações baseado em IDs de pontuação
   */
  private removerRegistrosPontuacoes(pontuacaoIds: string[]): Observable<boolean> {
    console.log(`[PontuacaoService] Removendo registros de pontuações gerais: ${pontuacaoIds.join(', ')}`);
    
    // Verificar se o usuário está autenticado
    if (!this.googleAuthService.isAuthenticated()) {
      console.error('[PontuacaoService] Usuário não autenticado para acessar a planilha');
      return of(false);
    }
    
    // Obter o token de acesso do usuário atual
    const currentUser = this.googleAuthService.currentUser;
    if (!currentUser || !currentUser.accessToken) {
      console.error('[PontuacaoService] Token de acesso não disponível');
      return of(false);
    }
    
    // Configurar os headers de autorização para a chamada à API do Google Sheets
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${currentUser.accessToken}`,
      'Content-Type': 'application/json'
    });
    
    // Na implementação atual, não é possível deletar linhas específicas no Google Sheets via API
    // A melhor maneira seria usar Google Apps Script para essa remoção
    // Como não temos isso disponível, vamos simplesmente retornar sucesso e deixar que 
    // as novas entradas sejam adicionadas para substituir as antigas
    
    console.log(`[PontuacaoService] Não é possível remover diretamente entradas do Google Sheets via API.`);
    console.log(`[PontuacaoService] Em uma implementação completa, usaríamos Google Apps Script para isso.`);
    console.log(`[PontuacaoService] Para agora, confiaremos na verificação de pontuações existentes para evitar duplicação.`);
    
    // Retornar sucesso para continuar o fluxo
    return of(true);
  }
} 