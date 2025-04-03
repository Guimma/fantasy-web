import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, throwError, switchMap, catchError } from 'rxjs';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { CartolaApiService } from '../../../core/services/cartola-api.service';
import { DraftStatus, DraftTeam, DraftOrderData, DraftConfig, Athlete, PlayerAssignment } from '../models/draft.model';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private http = inject(HttpClient);
  private authService = inject(GoogleAuthService);
  private storageService = inject(StorageService);
  private cartolaApiService = inject(CartolaApiService);
  
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly TEAMS_RANGE = 'Times!A:I'; // id_time, id_liga, id_usuario, nome, saldo, formacao_atual, pontuacao_total, pontuacao_ultima_rodada, colocacao
  private readonly ATHLETES_RANGE = 'Atletas!A:P'; // id_atleta, id_cartola, nome, apelido, foto_url, posicao, posicao_abreviacao, clube, clube_abreviacao, preco, media_pontos, jogos, status, ultima_atualizacao, data_criacao
  private readonly CONFIG_DRAFT_RANGE = 'ConfigDraft!A:E'; // id_liga, data_hora, duracao_escolha, status, ordem_atual
  private readonly ORDEM_DRAFT_RANGE = 'OrdemDraft!A:D'; // id_liga, rodada, ordem, id_time
  private readonly ESCOLHAS_DRAFT_RANGE = 'EscolhasDraft!A:H'; // id_escolha, id_liga, rodada, ordem, id_time, id_atleta, id_cartola, timestamp
  private readonly ELENCOS_TIMES_RANGE = 'ElencosTimes!A:G'; // id_registro, id_time, id_atleta, id_cartola, status_time, valor_compra, data_aquisicao
  
  private readonly DRAFT_STATUS_KEY = 'draft_status';
  private readonly DRAFT_TEAMS_KEY = 'draft_teams';
  private readonly DRAFT_ORDER_KEY = 'draft_order';
  private readonly DRAFT_CONFIG_KEY = 'draft_config';

  constructor() {
    // Inicializar o serviço
    this.ensureSheetExists();
  }

  // Garantir que todas as abas necessárias existam
  private ensureSheetExists(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authService.currentUser?.accessToken) {
        reject('Usuário não autenticado');
        return;
      }

      // Verificar se todas as abas existem
      this.ensureConfigDraftSheet()
        .then(() => this.ensureOrdemDraftSheet())
        .then(() => this.ensureEscolhasDraftSheet())
        .then(() => resolve())
        .catch(error => reject(error));
    });
  }

  private ensureConfigDraftSheet(): Promise<void> {
    return this.ensureSheetWithHeaders(
      'ConfigDraft',
      'ConfigDraft!A1:E1',
      ['id_liga', 'data_hora', 'duracao_escolha', 'status', 'ordem_atual']
    );
  }

  private ensureOrdemDraftSheet(): Promise<void> {
    return this.ensureSheetWithHeaders(
      'OrdemDraft',
      'OrdemDraft!A1:D1',
      ['id_liga', 'rodada', 'ordem', 'id_time']
    );
  }

  private ensureEscolhasDraftSheet(): Promise<void> {
    return this.ensureSheetWithHeaders(
      'EscolhasDraft',
      'EscolhasDraft!A1:H1',
      ['id_escolha', 'id_liga', 'rodada', 'ordem', 'id_time', 'id_atleta', 'id_cartola', 'timestamp']
    );
  }

  private ensureSheetWithHeaders(sheetName: string, range: string, headers: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authService.currentUser?.accessToken) {
        reject('Usuário não autenticado');
        return;
      }

      // Verificar se a planilha já tem cabeçalho
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}`;
      
      this.makeAuthorizedRequest<any>('get', url).subscribe({
        next: (response: any) => {
          // Se não houver valores ou a primeira linha não tiver os cabeçalhos esperados
          if (!response.values || response.values.length === 0) {
            // Adicionar cabeçalhos
            this.addHeadersToSheet(sheetName, range, headers)
              .then(() => resolve())
              .catch(error => reject(error));
          } else {
            // Cabeçalhos já existem
            resolve();
          }
        },
        error: (error) => {
          console.error(`Erro ao verificar cabeçalhos em ${sheetName}:`, error);
          // Tentar adicionar cabeçalhos mesmo assim
          this.addHeadersToSheet(sheetName, range, headers)
            .then(() => resolve())
            .catch(error => reject(error));
        }
      });
    });
  }

  private addHeadersToSheet(sheetName: string, range: string, headers: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authService.currentUser?.accessToken) {
        reject('Usuário não autenticado');
        return;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
      
      const body = {
        values: [headers]
      };

      this.makeAuthorizedRequest<any>('put', url, body).subscribe({
        next: () => {
          console.log(`Cabeçalhos de ${sheetName} adicionados com sucesso`);
          resolve();
        },
        error: (error) => {
          console.error(`Erro ao adicionar cabeçalhos em ${sheetName}:`, error);
          reject(error);
        }
      });
    });
  }

  // Métodos públicos para interação com o Draft

  // Obter o status atual do Draft
  getDraftStatus(): Observable<DraftStatus> {
    // Remover o cache para garantir que sempre obtemos o status mais recente do servidor
    this.storageService.remove(this.DRAFT_STATUS_KEY);

    // Buscar da planilha usando o sistema de renovação de token
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`
    ).pipe(
      map(response => {
        // Se não houver dados ou apenas o cabeçalho, o draft não começou
        if (!response.values || response.values.length <= 1) {
          const status: DraftStatus = 'not_started';
          this.storageService.set(this.DRAFT_STATUS_KEY, status);
          console.log('Draft não iniciado (sem dados)', status);
          return status;
        }

        // Verificar a configuração mais recente (última linha)
        const configs = response.values.slice(1);
        const latestConfig = configs[configs.length - 1];
        
        // O status está na posição 3 (índice 3)
        const sheetStatus = latestConfig[3] || 'Agendado';
        const status = this.mapStatusFromSheet(sheetStatus);
        
        console.log('Status bruto recebido da planilha:', sheetStatus);
        console.log('Status mapeado:', status);
        
        this.storageService.set(this.DRAFT_STATUS_KEY, status);
        return status;
      })
    );
  }

  private mapStatusFromSheet(sheetStatus: string): DraftStatus {
    switch (sheetStatus) {
      case 'Em Andamento':
        return 'in_progress';
      case 'Finalizado':
        return 'finished';
      default:
        return 'not_started';
    }
  }

  private mapStatusToSheet(status: DraftStatus): string {
    switch (status) {
      case 'in_progress':
        return 'Em Andamento';
      case 'finished':
        return 'Finalizado';
      default:
        return 'Agendado';
    }
  }

  // Obter times para o Draft
  getTeams(): Observable<DraftTeam[]> {
    // Verificar cache primeiro
    const cachedTeams = this.storageService.get<DraftTeam[]>(this.DRAFT_TEAMS_KEY);
    if (cachedTeams) {
      return of(cachedTeams);
    }

    // Se não temos em cache, buscar da planilha usando o sistema de renovação de token
    return this.makeAuthorizedRequest<any>('get', 
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          return of([]);
        }

        const teams = response.values.slice(1).map((row: any) => {
          return {
            id: row[0],
            ligaId: row[1],
            userId: row[2],
            name: row[3],
            saldo: parseFloat(row[4] || '0'),
            formacao: row[5],
            pontuacaoTotal: parseFloat(row[6] || '0'),
            pontuacaoUltimaRodada: parseFloat(row[7] || '0'),
            colocacao: parseInt(row[8] || '0', 10),
            players: [] // Inicialmente vazio, vamos preencher depois
          } as DraftTeam;
        });

        // Agora buscar os jogadores de cada time
        return this.getTeamsPlayers(teams);
      })
    );
  }

  private getTeamsPlayers(teams: DraftTeam[]): Observable<DraftTeam[]> {
    console.log('[DraftService] Iniciando carregamento de jogadores para times');
    
    // Buscar primeiro as escolhas do draft da aba EscolhasDraft
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ESCOLHAS_DRAFT_RANGE}`
    ).pipe(
      switchMap(escolhasResponse => {
        // Criar um mapa times -> ids_cartola a partir das escolhas
        const draftTeamCartolaIdMap = new Map<string, string[]>();
        
        // Processar as escolhas do draft (PRIORIDADE)
        if (escolhasResponse.values && escolhasResponse.values.length > 1) {
          console.log('[DraftService] Encontradas escolhas de draft:', escolhasResponse.values.length - 1);
          
          escolhasResponse.values.slice(1).forEach((row: any) => {
            const teamId = row[4]; // id_time está na posição 4
            const cartolaId = row[6]; // id_cartola está na posição 6
            
            if (teamId && cartolaId) {
              // Guardar id_cartola
              if (!draftTeamCartolaIdMap.has(teamId)) {
                draftTeamCartolaIdMap.set(teamId, []);
              }
              
              if (!draftTeamCartolaIdMap.get(teamId)?.includes(cartolaId)) {
                draftTeamCartolaIdMap.get(teamId)?.push(cartolaId);
              }
            }
          });
        }
        
        // Em seguida, buscar as relações na aba ElencosTimes como backup
        return this.makeAuthorizedRequest<any>('get',
          `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ELENCOS_TIMES_RANGE}`
        ).pipe(
          switchMap(elencosResponse => {
            // Processar jogadores do elenco como backup
            if (elencosResponse.values && elencosResponse.values.length > 1) {
              console.log('[DraftService] Encontrados registros de elencos:', elencosResponse.values.length - 1);
              
              elencosResponse.values.slice(1).forEach((row: any) => {
                const teamId = row[1]; // id_time está na posição 1
                const cartolaId = row[3]; // id_cartola está na posição 3
                
                if (teamId && cartolaId) {
                  // Guardar id_cartola
                  if (!draftTeamCartolaIdMap.has(teamId)) {
                    draftTeamCartolaIdMap.set(teamId, []);
                  }
                  
                  if (!draftTeamCartolaIdMap.get(teamId)?.includes(cartolaId)) {
                    draftTeamCartolaIdMap.get(teamId)?.push(cartolaId);
                  }
                }
              });
            }
            
            // Se nenhum jogador foi encontrado, retornar times vazios
            if (draftTeamCartolaIdMap.size === 0) {
              console.log('[DraftService] Nenhum jogador encontrado para os times');
              this.storageService.set(this.DRAFT_TEAMS_KEY, teams);
              return of(teams);
            }
            
            // Buscar detalhes dos atletas da API do Cartola
            return this.getAllAthletes().pipe(
              map(athletes => {
                console.log(`[DraftService] ${athletes.length} atletas carregados da API do Cartola`);
                
                // Associar cada atleta ao seu time
                teams.forEach((team: DraftTeam) => {
                  const cartolaIds = draftTeamCartolaIdMap.get(team.id) || [];
                  
                  // Limpar array de jogadores para o time
                  team.players = [];
                  
                  // Buscar cada atleta APENAS pelo ID numérico do Cartola
                  cartolaIds.forEach(cartolaId => {
                    const matchedAthlete = athletes.find(a => a.idCartola === cartolaId);
                    if (matchedAthlete && !team.players.some(p => p.id === matchedAthlete.id)) {
                      team.players.push(matchedAthlete);
                    }
                  });
                  
                  console.log(`[DraftService] Time ${team.name}: ${team.players.length} jogadores carregados`);
                });

                // Salvar em cache para futuras consultas
                this.storageService.set(this.DRAFT_TEAMS_KEY, teams);
                return teams;
              })
            );
          })
        );
      })
    );
  }

  // Obter todos os atletas com renovação automática do token
  getAllAthletes(): Observable<Athlete[]> {
    // Obter diretamente da API do Cartola
    return this.cartolaApiService.getAllAthletes().pipe(
      map(response => {
        if (!response || !response.atletas) {
          return [];
        }
        
        // Converter o objeto de atletas para um array
        const athletes = Object.values(response.atletas).map((athlete: any) => {
          return this.cartolaApiService.mapAthleteFromApi(athlete);
        });

        return athletes;
      }),
      catchError(error => {
        return throwError(() => new Error(`Erro ao carregar atletas da API do Cartola: ${error.message || error.statusText}`));
      })
    );
  }

  // Helper para fazer requisições HTTP com renovação automática de token
  // Este método agora é apenas um wrapper sobre o HttpClient, já que a renovação
  // do token é feita pelo interceptor global GoogleAuthInterceptor
  private makeAuthorizedRequest<T>(
    method: 'get' | 'post' | 'put', 
    url: string, 
    body?: any, 
    params?: any
  ): Observable<T> {
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
    
    const options = { headers, params };
    
    switch (method) {
      case 'get':
        return this.http.get<T>(url, options);
      case 'post':
        return this.http.post<T>(url, body, options);
      case 'put':
        return this.http.put<T>(url, body, options);
      default:
        return throwError(() => new Error(`Método HTTP não suportado: ${method}`));
    }
  }

  // Obter ordem do Draft
  getDraftOrder(): Observable<DraftOrderData> {
    // Verificar cache primeiro
    const cachedOrder = this.storageService.get<DraftOrderData>(this.DRAFT_ORDER_KEY);
    if (cachedOrder) {
      return of(cachedOrder);
    }

    // Se não temos em cache, buscar da planilha usando o sistema de renovação de token
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`
    ).pipe(
      switchMap(configResponse => {
        let currentRound = 1;
        let currentIndex = 0;
        
        if (configResponse.values && configResponse.values.length > 1) {
          const configs = configResponse.values.slice(1);
          const latestConfig = configs[configs.length - 1];
          // ordem_atual está na posição 4 (índice 4)
          currentIndex = parseInt(latestConfig[4] || '0', 10);
        }

        // Agora buscar a ordem do draft
        return this.makeAuthorizedRequest<any>('get',
          `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ORDEM_DRAFT_RANGE}`
        ).pipe(
          map(orderResponse => {
            if (!orderResponse.values || orderResponse.values.length <= 1) {
              return { order: [], currentRound, currentIndex };
            }

            const orderEntries = orderResponse.values.slice(1).map((row: any) => {
              return {
                teamId: row[3], // id_time
                round: parseInt(row[1], 10), // rodada
                order: parseInt(row[2], 10) // ordem
              };
            });

            // Determinar o round atual com base no índice atual
            if (orderEntries.length > 0 && currentIndex < orderEntries.length) {
              currentRound = orderEntries[currentIndex].round;
            }

            const result = { 
              order: orderEntries,
              currentRound,
              currentIndex
            };

            this.storageService.set(this.DRAFT_ORDER_KEY, result);
            return result;
          })
        );
      })
    );
  }

  // Obter configuração do Draft
  getDraftConfig(): Observable<DraftConfig> {
    // Verificar cache primeiro
    const cachedConfig = this.storageService.get<DraftConfig>(this.DRAFT_CONFIG_KEY);
    if (cachedConfig) {
      return of(cachedConfig);
    }

    // Se não temos em cache, buscar da planilha usando o sistema de renovação de token
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`
    ).pipe(
      map(response => {
        if (!response.values || response.values.length <= 1) {
          // Configuração padrão
          const defaultConfig: DraftConfig = {
            draftId: '1',
            pickTime: 60,
            requiredPositions: {
              totalPlayers: 18,
              starters: 11,
              reserves: 6,
              requiredCoach: 1
            }
          };
          this.storageService.set(this.DRAFT_CONFIG_KEY, defaultConfig);
          return defaultConfig;
        }

        const configs = response.values.slice(1);
        const latestConfig = configs[configs.length - 1];
        
        const config: DraftConfig = {
          draftId: latestConfig[0] || '1', // id_liga
          pickTime: parseInt(latestConfig[2] || '60', 10), // duracao_escolha
          requiredPositions: {
            totalPlayers: 18,
            starters: 11,
            reserves: 6,
            requiredCoach: 1
          }
        };

        this.storageService.set(this.DRAFT_CONFIG_KEY, config);
        return config;
      })
    );
  }

  // Iniciar o Draft
  startDraft(): Observable<boolean> {
    // Obter todos os times para o sorteio
    return this.getTeams().pipe(
      switchMap(teams => {
        if (teams.length < 2) {
          return throwError(() => new Error('É necessário pelo menos 2 times para iniciar o draft'));
        }

        // Criar a configuração do draft
        return this.createDraftConfig(teams);
      })
    );
  }

  private createDraftConfig(teams: DraftTeam[]): Observable<boolean> {
    const now = new Date().toISOString();
    const ligaId = teams.length > 0 ? teams[0].ligaId : '1';
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    const body = {
      values: [
        [
          ligaId,           // id_liga
          now,              // data_hora
          '60',             // duracao_escolha
          'Em Andamento',   // status
          '0'               // ordem_atual
        ]
      ]
    };

    return this.makeAuthorizedRequest<any>('post', url, body).pipe(
      switchMap(() => {
        // Atualizar status local
        this.storageService.set(this.DRAFT_STATUS_KEY, 'in_progress' as DraftStatus);
        
        // Agora criar a ordem do draft
        return this.createDraftOrder(teams, ligaId);
      })
    );
  }

  private createDraftOrder(teams: DraftTeam[], ligaId: string): Observable<boolean> {
    // Sortear a ordem inicial
    const teamIds = teams.map(team => team.id);
    this.shuffleArray(teamIds);

    // Criar ordem no formato snake (ida e volta)
    const draftOrderEntries = [];
    const totalRounds = 18; // Total de rodadas para ter, no mínimo, o número de jogadores por time

    for (let round = 1; round <= totalRounds; round++) {
      const isEvenRound = round % 2 === 0;
      
      for (let i = 0; i < teamIds.length; i++) {
        const orderIndex = isEvenRound ? teamIds.length - 1 - i : i;
        const teamId = teamIds[orderIndex];
        
        draftOrderEntries.push([
          ligaId,                 // id_liga
          round.toString(),       // rodada
          i.toString(),           // ordem
          teamId                  // id_time
        ]);
      }
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ORDEM_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    const body = {
      values: draftOrderEntries
    };

    return this.makeAuthorizedRequest<any>('post', url, body).pipe(
      map(() => {
        // Limpar o cache da ordem do draft
        this.storageService.remove(this.DRAFT_ORDER_KEY);
        return true;
      })
    );
  }

  // Auxiliar para embaralhar array
  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Obter jogadores disponíveis para seleção
  getAvailablePlayers(): Observable<Athlete[]> {
    return this.getAllAthletes().pipe(
      switchMap(allAthletes => {
        // Verificar quais atletas já foram selecionados
        return this.getAssignedPlayerIds().pipe(
          map(assignedIds => {
            // Filtrar apenas os jogadores não selecionados
            return allAthletes.filter(athlete => !assignedIds.includes(athlete.id));
          })
        );
      })
    );
  }

  private getAssignedPlayerIds(): Observable<string[]> {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ESCOLHAS_DRAFT_RANGE}`;
    
    return this.makeAuthorizedRequest<any>('get', url).pipe(
      map(response => {
        if (!response.values || response.values.length <= 1) {
          return [];
        }

        // Extrair os IDs dos atletas (posição 5, índice 5)
        return response.values.slice(1)
          .map((row: any) => row[5])
          .filter((id: string) => !!id);
      })
    );
  }

  // Atribuir jogador a um time
  assignPlayerToTeam(teamId: string, athleteId: string, round: number, orderIndex: number): Observable<boolean> {
    // Gerar ID único para a escolha
    const choiceId = this.generateUniqueId();
    const now = new Date().toISOString();
    const ligaId = '1'; // Default liga

    console.log(`[DraftService] Atribuindo jogador com ID ${athleteId} ao time ${teamId}`);

    // O athleteId recebido já deve ser o ID do Cartola (numérico)
    const cartolaId: string = athleteId;

    // Primeiro adicionar a escolha na planilha EscolhasDraft
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ESCOLHAS_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    const body = {
      values: [
        [
          choiceId,              // id_escolha
          ligaId,                // id_liga
          round.toString(),      // rodada
          orderIndex.toString(), // ordem
          teamId,                // id_time
          athleteId,             // id_atleta (mantido por compatibilidade, mesmo valor do cartolaId)
          cartolaId,             // id_cartola (ID numérico do Cartola - principal)
          now                    // timestamp
        ]
      ]
    };

    return this.makeAuthorizedRequest<any>('post', url, body).pipe(
      switchMap(() => {
        // Agora adicionar o atleta ao elenco do time na planilha ElencosTimes
        return this.addAthleteToTeamRoster(teamId, cartolaId);
      })
    );
  }

  private addAthleteToTeamRoster(teamId: string, cartolaId: string): Observable<boolean> {
    const registroId = this.generateUniqueId();
    const now = new Date().toISOString();

    console.log(`[DraftService] Adicionando jogador com ID do Cartola ${cartolaId} ao elenco do time ${teamId}`);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ELENCOS_TIMES_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    const body = {
      values: [
        [
          registroId,     // id_registro
          teamId,         // id_time
          cartolaId,      // id_atleta (mantido por compatibilidade, mesmo valor do id_cartola)
          cartolaId,      // id_cartola (ID numérico do Cartola - principal)
          'Ativo',        // status_time
          '0',            // valor_compra (0 durante o draft)
          now             // data_aquisicao
        ]
      ]
    };

    return this.makeAuthorizedRequest<any>('post', url, body).pipe(
      map(() => {
        // Limpar cache dos times
        this.storageService.remove(this.DRAFT_TEAMS_KEY);
        return true;
      })
    );
  }

  // Método para encontrar um atleta pelo ID do Cartola (numérico)
  private findAthleteByCartolaId(athletes: Athlete[], cartolaId: string): Athlete | undefined {
    if (!cartolaId) return undefined;
    
    // Buscar diretamente pelo ID numérico do Cartola
    return athletes.find(a => a.idCartola === cartolaId);
  }

  // Avançar para próxima escolha
  advanceDraft(): Observable<DraftOrderData> {
    // Buscar a configuração atual
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          return throwError(() => new Error('Configuração do draft não encontrada'));
        }

        const configs = response.values.slice(1);
        const latestConfig = configs[configs.length - 1];
        const ligaId = latestConfig[0];
        const status = latestConfig[3];
        let currentIndex = parseInt(latestConfig[4] || '0', 10);
        
        // Avançar para o próximo índice
        currentIndex++;
        
        // Atualizar o índice atual na configuração - CORREÇÃO DA URL
        const rowIndex = configs.length + 1;
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/ConfigDraft!A${rowIndex}:E${rowIndex}?valueInputOption=USER_ENTERED`;
        
        const updateBody = {
          values: [
            [
              ligaId,
              latestConfig[1],   // data_hora (manter)
              latestConfig[2],   // duracao_escolha (manter)
              status,            // status (manter)
              currentIndex.toString() // ordem_atual (atualizar)
            ]
          ]
        };

        return this.makeAuthorizedRequest<any>('put', updateUrl, updateBody).pipe(
          switchMap(() => {
            // Limpar cache
            this.storageService.remove(this.DRAFT_ORDER_KEY);
            
            // Carregar e retornar a nova ordem
            return this.getDraftOrder();
          })
        );
      })
    );
  }

  // Finalizar o Draft
  finishDraft(): Observable<boolean> {
    // Buscar a configuração atual
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          return throwError(() => new Error('Configuração do draft não encontrada'));
        }

        const configs = response.values.slice(1);
        const latestConfig = configs[configs.length - 1];
        const ligaId = latestConfig[0];
        
        // Criar nova configuração com status finalizado
        const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
        
        const now = new Date().toISOString();
        const updateBody = {
          values: [
            [
              ligaId,
              now,
              latestConfig[2],   // duracao_escolha (manter)
              'Finalizado',      // status (finalizado)
              latestConfig[4]    // ordem_atual (manter)
            ]
          ]
        };

        return this.makeAuthorizedRequest<any>('post', updateUrl, updateBody).pipe(
          map(() => {
            // Atualizar status local
            this.storageService.set(this.DRAFT_STATUS_KEY, 'finished' as DraftStatus);
            
            // Limpar caches
            this.storageService.remove(this.DRAFT_ORDER_KEY);
            this.storageService.remove(this.DRAFT_CONFIG_KEY);
            this.storageService.remove(this.DRAFT_TEAMS_KEY);
            
            return true;
          })
        );
      })
    );
  }

  // Reiniciar o Draft (resetar para o estado inicial)
  resetDraft(): Observable<boolean> {
    // 1. Limpar apenas os elencos dos times
    return this.clearSheetData(this.ELENCOS_TIMES_RANGE).pipe(
      // 2. Definir o status do draft como "Não iniciado"
      switchMap(() => {
        const ligaId = '1'; // Default liga id
        const now = new Date().toISOString();
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
        
        const body = {
          values: [
            [
              ligaId,
              now,
              '60',           // duracao_escolha (padrão: 60 segundos)
              'Agendado',     // status (não iniciado)
              '0'             // ordem_atual
            ]
          ]
        };

        return this.makeAuthorizedRequest<any>('post', url, body);
      }),
      // 3. Limpar a ordem do draft
      switchMap(() => this.clearSheetData(this.ORDEM_DRAFT_RANGE)),
      // 4. Limpar os caches
      map(() => {
        this.storageService.set(this.DRAFT_STATUS_KEY, 'not_started' as DraftStatus);
        this.storageService.remove(this.DRAFT_TEAMS_KEY);
        this.storageService.remove(this.DRAFT_ORDER_KEY);
        this.storageService.remove(this.DRAFT_CONFIG_KEY);
        return true;
      })
    );
  }

  // Método auxiliar para limpar dados de uma planilha (mantendo cabeçalho)
  private clearSheetData(range: string): Observable<any> {
    // Extrair o nome da planilha do intervalo
    const sheetName = range.split('!')[0];
    
    // Primeiro obtemos os dados para ver o cabeçalho
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}`;
    
    return this.makeAuthorizedRequest<any>('get', getUrl).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          // Não há dados ou apenas o cabeçalho, então nada para limpar
          return of(true);
        }

        // Extrair o cabeçalho (primeira linha)
        const header = response.values[0];
        
        // Limpar todas as células exceto o cabeçalho
        const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}:clear`;
        
        return this.makeAuthorizedRequest<any>('post', clearUrl).pipe(
          // Reescrever o cabeçalho
          switchMap(() => {
            const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${sheetName}!A1:Z1?valueInputOption=USER_ENTERED`;
            const headerBody = {
              values: [header]
            };
            
            return this.makeAuthorizedRequest<any>('put', headerUrl, headerBody);
          })
        );
      })
    );
  }

  // Auxiliar para gerar ID único
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Obter times para o Draft finalizado usando a aba EscolhasDraft como histórico
  getDraftTeamHistory(draftId: string): Observable<DraftTeam[]> {
    console.log(`[DraftService] Obtendo histórico de times para o draft ID: ${draftId}`);
    
    // Primeiro obtemos as informações básicas dos times
    return this.makeAuthorizedRequest<any>('get', 
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          console.log('[DraftService] Nenhum time encontrado na planilha');
          return of([]);
        }

        const teams = response.values.slice(1).map((row: any) => {
          return {
            id: row[0],
            ligaId: row[1],
            userId: row[2],
            name: row[3],
            saldo: parseFloat(row[4] || '0'),
            formacao: row[5],
            pontuacaoTotal: parseFloat(row[6] || '0'),
            pontuacaoUltimaRodada: parseFloat(row[7] || '0'),
            colocacao: parseInt(row[8] || '0', 10),
            players: [] // Inicialmente vazio, vamos preencher depois
          } as DraftTeam;
        });

        console.log(`[DraftService] ${teams.length} times carregados da planilha`);

        // Buscar as escolhas do draft registradas na aba EscolhasDraft
        return this.makeAuthorizedRequest<any>('get',
          `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ESCOLHAS_DRAFT_RANGE}`
        ).pipe(
          switchMap(draftChoices => {
            // Mapear id_time -> id_cartola das escolhas do draft
            const teamCartolaIdMap = new Map<string, string[]>();
            
            // Filtrar escolhas pela liga especificada (draftId)
            if (draftChoices.values && draftChoices.values.length > 1) {
              const choices = draftChoices.values.slice(1)
                .filter((row: any) => row[1] === draftId || !draftId);
              
              console.log(`[DraftService] ${choices.length} escolhas de draft encontradas para a liga ${draftId || 'todas'}`);
              
              choices.forEach((row: any) => {
                const teamId = row[4]; // id_time está na posição 4
                const cartolaId = row[6]; // id_cartola está na posição 6
                
                if (teamId && cartolaId) {
                  if (!teamCartolaIdMap.has(teamId)) {
                    teamCartolaIdMap.set(teamId, []);
                  }
                  
                  if (!teamCartolaIdMap.get(teamId)?.includes(cartolaId)) {
                    teamCartolaIdMap.get(teamId)?.push(cartolaId);
                  }
                }
              });
            }

            // Agora buscar detalhes dos atletas escolhidos da API do Cartola
            return this.getAllAthletes().pipe(
              map(athletes => {
                console.log(`[DraftService] ${athletes.length} atletas carregados da API do Cartola`);
                
                // Associar cada atleta ao seu time conforme as escolhas do draft
                teams.forEach((team: DraftTeam) => {
                  const cartolaIds = teamCartolaIdMap.get(team.id) || [];
                  
                  // Limpar array de jogadores para o time
                  team.players = [];
                  
                  // Buscar jogadores APENAS pelo ID do Cartola
                  cartolaIds.forEach(cartolaId => {
                    if (cartolaId) {
                      const matchedAthlete = this.findAthleteByCartolaId(athletes, cartolaId);
                      if (matchedAthlete && !team.players.some(p => p.id === matchedAthlete.id)) {
                        team.players.push(matchedAthlete);
                      }
                    }
                  });
                  
                  console.log(`[DraftService] Time ${team.name}: ${team.players.length} jogadores carregados`);
                });
                
                return teams;
              })
            );
          })
        );
      })
    );
  }
} 