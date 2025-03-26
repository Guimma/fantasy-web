import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, throwError, switchMap, catchError } from 'rxjs';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { DraftStatus, DraftTeam, DraftOrderData, DraftConfig, Athlete, PlayerAssignment } from '../models/draft.model';

@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private http = inject(HttpClient);
  private authService = inject(GoogleAuthService);
  private storageService = inject(StorageService);
  
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly TEAMS_RANGE = 'Times!A:I'; // id_time, id_liga, id_usuario, nome, saldo, formacao_atual, pontuacao_total, pontuacao_ultima_rodada, colocacao
  private readonly ATHLETES_RANGE = 'Atletas!A:P'; // id_atleta, id_cartola, nome, apelido, foto_url, posicao, posicao_abreviacao, clube, clube_abreviacao, preco, media_pontos, jogos, status, ultima_atualizacao, data_criacao
  private readonly CONFIG_DRAFT_RANGE = 'ConfigDraft!A:E'; // id_liga, data_hora, duracao_escolha, status, ordem_atual
  private readonly ORDEM_DRAFT_RANGE = 'OrdemDraft!A:D'; // id_liga, rodada, ordem, id_time
  private readonly ESCOLHAS_DRAFT_RANGE = 'EscolhasDraft!A:G'; // id_escolha, id_liga, rodada, ordem, id_time, id_atleta, timestamp
  private readonly ELENCOS_TIMES_RANGE = 'ElencosTimes!A:F'; // id_registro, id_time, id_atleta, status_time, valor_compra, data_aquisicao
  
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
      'EscolhasDraft!A1:G1',
      ['id_escolha', 'id_liga', 'rodada', 'ordem', 'id_time', 'id_atleta', 'timestamp']
    );
  }

  private ensureSheetWithHeaders(sheetName: string, range: string, headers: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const accessToken = this.authService.currentUser?.accessToken;
      if (!accessToken) {
        reject('Usuário não autenticado');
        return;
      }

      // Verificar se a planilha já tem cabeçalho
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}`;
      const headers_ = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      this.http.get(url, { headers: headers_ }).subscribe({
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
      const accessToken = this.authService.currentUser?.accessToken;
      if (!accessToken) {
        reject('Usuário não autenticado');
        return;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`;
      const headers_ = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      const body = {
        values: [headers]
      };

      this.http.put(url, body, { headers: headers_ }).subscribe({
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
    // Verificar primeiro se temos o status em cache
    const cachedStatus = this.storageService.get<DraftStatus>(this.DRAFT_STATUS_KEY);
    if (cachedStatus) {
      return of(cachedStatus);
    }

    // Se não temos em cache, buscar da planilha
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        // Se não houver dados ou apenas o cabeçalho, o draft não começou
        if (!response.values || response.values.length <= 1) {
          const status: DraftStatus = 'not_started';
          this.storageService.set(this.DRAFT_STATUS_KEY, status);
          return status;
        }

        // Verificar a configuração mais recente (última linha)
        const configs = response.values.slice(1);
        const latestConfig = configs[configs.length - 1];
        
        // O status está na posição 3 (índice 3)
        const status = this.mapStatusFromSheet(latestConfig[3] || 'Agendado');
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

    // Se não temos em cache, buscar da planilha
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // Buscar primeiro todos os times
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
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
        return this.getTeamsPlayers(teams, accessToken);
      })
    );
  }

  private getTeamsPlayers(teams: DraftTeam[], accessToken: string): Observable<DraftTeam[]> {
    // Buscar todos os jogadores dos times
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ELENCOS_TIMES_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          this.storageService.set(this.DRAFT_TEAMS_KEY, teams);
          return of(teams);
        }

        // Mapear id_time -> id_atleta
        const teamPlayerMap = new Map<string, string[]>();
        
        response.values.slice(1).forEach((row: any) => {
          const teamId = row[1];
          const athleteId = row[2];
          
          if (!teamPlayerMap.has(teamId)) {
            teamPlayerMap.set(teamId, []);
          }
          
          teamPlayerMap.get(teamId)?.push(athleteId);
        });

        // Agora buscar detalhes de todos os atletas
        return this.getAllAthletes().pipe(
          map(athletes => {
            // Associar cada atleta ao seu time
            teams.forEach(team => {
              const athleteIds = teamPlayerMap.get(team.id) || [];
              team.players = athletes.filter(athlete => athleteIds.includes(athlete.id));
            });

            this.storageService.set(this.DRAFT_TEAMS_KEY, teams);
            return teams;
          })
        );
      })
    );
  }

  // Obter todos os atletas
  getAllAthletes(): Observable<Athlete[]> {
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ATHLETES_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
      map(response => {
        if (!response.values || response.values.length <= 1) {
          console.warn('Nenhum atleta encontrado na planilha');
          return [];
        }

        // Log dos cabeçalhos da tabela de atletas
        console.log('Cabeçalhos da tabela de atletas:', response.values[0]);

        // Mapeamento dos cabeçalhos conhecidos
        // Ordem esperada: id_atleta, id_cartola, nome, apelido, foto_url, posicao, posicao_abreviacao, 
        // clube, clube_abreviacao, preco, media_pontos, jogos, status, ultima_atualizacao, data_criacao
        const headerMapping: {[key: string]: number} = {};
        response.values[0].forEach((header: string, index: number) => {
          // Garantir que o cabeçalho está em minúsculas para uma comparação normalizada
          const normalizedHeader = header.toString().toLowerCase().trim();
          headerMapping[normalizedHeader] = index;
          
          // Adicionar mapeamentos alternativos para campos com variações
          if (normalizedHeader === 'clube') headerMapping['clube'] = index;
          if (normalizedHeader === 'clube_abreviacao') headerMapping['clube_abreviacao'] = index;
          if (normalizedHeader === 'preco') headerMapping['preco'] = index;
        });
        
        console.log('Mapeamento dos cabeçalhos:', headerMapping);
        
        // Depuração extra para campos problemáticos
        console.log('Índice da coluna "clube":', headerMapping['clube']);
        console.log('Índice da coluna "preco":', headerMapping['preco']);

        const athletes = response.values.slice(1).map((row: any, index: number) => {
          try {
            // Não rejeitamos atletas se alguns dados faltarem - usamos valores default
            // e apenas logamos um aviso
            if (!row[headerMapping['id_atleta']] || !row[headerMapping['nome']]) {
              console.warn(`Atleta na linha ${index + 2} com ID ou nome faltando:`, row);
              return null;
            }

            // Depurar primeiro atleta com valores brutos
            if (index === 0) {
              console.log('Valores brutos do primeiro atleta:');
              console.log('id_atleta:', row[headerMapping['id_atleta']]);
              console.log('nome:', row[headerMapping['nome']]);
              console.log('clube (índice ' + headerMapping['clube'] + '):', row[headerMapping['clube']]);
              console.log('preco (índice ' + headerMapping['preco'] + '):', row[headerMapping['preco']]);
            }

            // Verificar se os campos críticos estão presentes
            const clubeIndex = headerMapping['clube'];
            const precoIndex = headerMapping['preco'];
            
            const clube = clubeIndex !== undefined && row[clubeIndex] ? row[clubeIndex] : 'Sem Clube';
            const preco = precoIndex !== undefined && row[precoIndex] ? parseFloat(row[precoIndex]) : 0;

            const athlete = {
              id: row[headerMapping['id_atleta']] || `temp-${index}`,
              idCartola: row[headerMapping['id_cartola']] || '',
              nome: row[headerMapping['nome']] || 'Nome Desconhecido',
              apelido: row[headerMapping['apelido']] || row[headerMapping['nome']] || 'Sem Apelido',
              posicao: row[headerMapping['posicao']] || 'SEM',
              posicaoAbreviacao: row[headerMapping['posicao_abreviacao']] || row[headerMapping['posicao']] || 'SEM',
              clube: clube,
              clubeAbreviacao: row[headerMapping['clube_abreviacao']] || '',
              preco: preco,
              mediaPontos: parseFloat(row[headerMapping['media_pontos']] || '0'),
              jogos: parseInt(row[headerMapping['jogos']] || '0', 10),
              status: row[headerMapping['status']] || 'Disponível',
              foto_url: row[headerMapping['foto_url']] || '',
              ultimaAtualizacao: row[headerMapping['ultima_atualizacao']] || '',
              dataCriacao: row[headerMapping['data_criacao']] || ''
            } as Athlete;

            return athlete;
          } catch (e) {
            console.error(`Erro ao processar atleta na linha ${index + 2}:`, e, row);
            return null;
          }
        }).filter((athlete: Athlete | null): athlete is Athlete => athlete !== null);

        // Log detalhado do primeiro atleta
        if (athletes.length > 0) {
          console.log('Detalhes completos do primeiro atleta:', JSON.stringify(athletes[0]));
        }

        console.log(`Total de atletas carregados: ${athletes.length}`);
        return athletes;
      }),
      catchError(error => {
        console.error('Erro ao carregar atletas:', error);
        return throwError(() => new Error('Erro ao carregar atletas da planilha'));
      })
    );
  }

  // Obter ordem do Draft
  getDraftOrder(): Observable<DraftOrderData> {
    // Verificar cache primeiro
    const cachedOrder = this.storageService.get<DraftOrderData>(this.DRAFT_ORDER_KEY);
    if (cachedOrder) {
      return of(cachedOrder);
    }

    // Se não temos em cache, buscar da planilha
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // Primeiro buscar a configuração do draft para saber o round atual
    const configUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(configUrl, { headers }).pipe(
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
        const orderUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ORDEM_DRAFT_RANGE}`;
        
        return this.http.get<any>(orderUrl, { headers }).pipe(
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

    // Se não temos em cache, buscar da planilha
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
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
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // Obter todos os times para o sorteio
    return this.getTeams().pipe(
      switchMap(teams => {
        if (teams.length < 2) {
          return throwError(() => new Error('É necessário pelo menos 2 times para iniciar o draft'));
        }

        // Criar a configuração do draft
        return this.createDraftConfig(teams, accessToken);
      })
    );
  }

  private createDraftConfig(teams: DraftTeam[], accessToken: string): Observable<boolean> {
    const now = new Date().toISOString();
    const ligaId = teams.length > 0 ? teams[0].ligaId : '1';
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

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

    return this.http.post<any>(url, body, { headers }).pipe(
      switchMap(() => {
        // Atualizar status local
        this.storageService.set(this.DRAFT_STATUS_KEY, 'in_progress' as DraftStatus);
        
        // Agora criar a ordem do draft
        return this.createDraftOrder(teams, ligaId, accessToken);
      })
    );
  }

  private createDraftOrder(teams: DraftTeam[], ligaId: string, accessToken: string): Observable<boolean> {
    // Sortear a ordem inicial
    const teamIds = teams.map(team => team.id);
    this.shuffleArray(teamIds);

    // Criar ordem no formato snake (ida e volta)
    const draftOrderEntries = [];
    const totalRounds = 14; // Total de rodadas para ter, no mínimo, o número de jogadores por time

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
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const body = {
      values: draftOrderEntries
    };

    return this.http.post<any>(url, body, { headers }).pipe(
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
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ESCOLHAS_DRAFT_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
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
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // Gerar ID único para a escolha
    const choiceId = this.generateUniqueId();
    const now = new Date().toISOString();
    const ligaId = '1'; // Default liga

    // Primeiro adicionar a escolha na planilha EscolhasDraft
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ESCOLHAS_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const body = {
      values: [
        [
          choiceId,              // id_escolha
          ligaId,                // id_liga
          round.toString(),      // rodada
          orderIndex.toString(), // ordem
          teamId,                // id_time
          athleteId,             // id_atleta
          now                    // timestamp
        ]
      ]
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      switchMap(() => {
        // Agora adicionar o atleta ao elenco do time na planilha ElencosTimes
        return this.addAthleteToTeamRoster(teamId, athleteId, accessToken);
      })
    );
  }

  private addAthleteToTeamRoster(teamId: string, athleteId: string, accessToken: string): Observable<boolean> {
    const registroId = this.generateUniqueId();
    const now = new Date().toISOString();

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ELENCOS_TIMES_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const body = {
      values: [
        [
          registroId,     // id_registro
          teamId,         // id_time
          athleteId,      // id_atleta
          'Ativo',        // status_time
          '0',            // valor_compra (0 durante o draft)
          now             // data_aquisicao
        ]
      ]
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      map(() => {
        // Limpar cache dos times
        this.storageService.remove(this.DRAFT_TEAMS_KEY);
        return true;
      })
    );
  }

  // Avançar para próxima escolha
  advanceDraft(): Observable<DraftOrderData> {
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // Buscar a configuração atual
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
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

        return this.http.put(updateUrl, updateBody, { headers }).pipe(
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
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // Buscar a configuração atual
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(url, { headers }).pipe(
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

        return this.http.post(updateUrl, updateBody, { headers }).pipe(
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
    const accessToken = this.authService.currentUser?.accessToken;
    if (!accessToken) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // 1. Limpar a tabela de escolhas do draft
    return this.clearSheetData(this.ESCOLHAS_DRAFT_RANGE, accessToken).pipe(
      // 2. Limpar os elencos dos times
      switchMap(() => this.clearSheetData(this.ELENCOS_TIMES_RANGE, accessToken)),
      // 3. Definir o status do draft como "Não iniciado"
      switchMap(() => {
        const ligaId = '1'; // Default liga id
        const now = new Date().toISOString();
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.CONFIG_DRAFT_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
        const headers = {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        };

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

        return this.http.post<any>(url, body, { headers });
      }),
      // 4. Limpar a ordem do draft
      switchMap(() => this.clearSheetData(this.ORDEM_DRAFT_RANGE, accessToken)),
      // 5. Limpar os caches
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
  private clearSheetData(range: string, accessToken: string): Observable<any> {
    // Extrair o nome da planilha do intervalo
    const sheetName = range.split('!')[0];
    
    // Primeiro obtemos os dados para ver o cabeçalho
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    return this.http.get<any>(getUrl, { headers }).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          // Não há dados ou apenas o cabeçalho, então nada para limpar
          return of(true);
        }

        // Extrair o cabeçalho (primeira linha)
        const header = response.values[0];
        
        // Limpar todas as células exceto o cabeçalho
        // Nós usamos o mesmo intervalo, mas na implementação da Google Sheets API,
        // ela só atualizará as linhas que fornecemos, mantendo as demais
        const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}:clear`;
        
        return this.http.post<any>(clearUrl, {}, { headers }).pipe(
          // Reescrever o cabeçalho - CORREÇÃO DA URL
          switchMap(() => {
            const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${sheetName}!A1:Z1?valueInputOption=USER_ENTERED`;
            const headerBody = {
              values: [header]
            };
            
            return this.http.put<any>(headerUrl, headerBody, { headers });
          })
        );
      })
    );
  }

  // Auxiliar para gerar ID único
  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
} 