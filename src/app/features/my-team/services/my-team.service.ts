import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, tap, catchError } from 'rxjs';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CartolaApiService } from '../../../core/services/cartola-api.service';
import { MyTeam, MyTeamPlayer, LineupPlayer } from '../models/my-team.model';
import { Formation, FormationPosition, SheetFormation, createHeaderMap, mapRowToSheetFormation, parseFormationNumbers, DEFAULT_FORMATIONS } from '../../../core/models/formation.model';
import { Athlete } from '../../draft/models/draft.model';

@Injectable({
  providedIn: 'root'
})
export class MyTeamService {
  private http = inject(HttpClient);
  private authService = inject(GoogleAuthService);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private cartolaApiService = inject(CartolaApiService);
  
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly TEAMS_RANGE = 'Times!A:I'; // id_time, id_liga, id_usuario, nome, saldo, formacao_atual, pontuacao_total, pontuacao_ultima_rodada, colocacao
  private readonly ATHLETES_RANGE = 'Atletas!A:P'; // id_atleta, id_cartola, nome, apelido, foto_url, posicao, posicao_abreviacao, clube, clube_abreviacao, preco, media_pontos, jogos, status, ultima_atualizacao, data_criacao
  private readonly ELENCOS_TIMES_RANGE = 'ElencosTimes!A:G'; // id_registro, id_time, id_atleta, id_cartola, status_time, valor_compra, data_aquisicao
  private readonly LINEUP_RANGE = 'Escalacoes!A:E'; // id_escalacao, id_time, id_atleta, posicao, rodada_atual
  private readonly FORMACOES_RANGE = 'FormacoesPermitidas!A:D'; // id_formacao, nome, descricao, ativa
  
  private readonly TEAM_CACHE_KEY = 'my_team_data';
  private readonly FORMATIONS_CACHE_KEY = 'formations_data';

  constructor() { 
    // Force a delayed cache clear to ensure all services are initialized
    setTimeout(() => {
      console.log('[MyTeamService] Limpando cache ao inicializar o serviço');
      this.clearTeamCache();
    }, 500);
  }

  // Método para obter o time do usuário atual
  getMyTeam(forceRefresh: boolean = false): Observable<MyTeam | null> {
    // Verificar se temos o time em cache e se não estamos forçando refresh
    const cachedTeam = this.storageService.get<MyTeam>(this.TEAM_CACHE_KEY);
    if (cachedTeam && !forceRefresh) {
      console.log('[MyTeamService] Usando time em cache');
      return of(cachedTeam);
    }

    console.log('[MyTeamService] Buscando time do servidor' + (forceRefresh ? ' (refresh forçado)' : ''));
    // Buscar o time do usuário atual
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return of(null);
    }

    // Obter todos os times para encontrar o do usuário atual
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          return of(null);
        }

        // Procurar o time do usuário atual
        const teams = response.values.slice(1);
        const userTeamRow = teams.find((row: any) => row[2] === currentUser.id);
        
        if (!userTeamRow) {
          return of(null);
        }

        // Criar o objeto base do time
        const myTeam: MyTeam = {
          id: userTeamRow[0],
          ligaId: userTeamRow[1],
          userId: userTeamRow[2],
          name: userTeamRow[3],
          saldo: parseFloat(userTeamRow[4] || '0'),
          formation: userTeamRow[5] || 'F001',
          pontuacaoTotal: parseFloat(userTeamRow[6] || '0'),
          pontuacaoUltimaRodada: parseFloat(userTeamRow[7] || '0'),
          colocacao: parseInt(userTeamRow[8] || '0', 10),
          players: [],
          lineup: []
        };

        // Buscar os jogadores do time
        return this.getTeamPlayers(myTeam);
      }),
      tap(team => {
        if (team) {
          this.storageService.set(this.TEAM_CACHE_KEY, team);
        }
      })
    );
  }

  // Método para buscar os jogadores de um time
  private getTeamPlayers(team: MyTeam): Observable<MyTeam> {
    console.log(`[MyTeamService] Buscando jogadores para o time: ${team.id}`);
    
    // Buscar a relação de jogadores do time
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ELENCOS_TIMES_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          console.log('[MyTeamService] Sem dados na aba ElencosTimes');
          return of(team);
        }

        // Mostrar os primeiros registros da planilha para debug
        const headers = response.values[0];
        console.log('[MyTeamService] Cabeçalhos da aba ElencosTimes:', headers);
        if (response.values.length > 1) {
          console.log('[MyTeamService] Exemplo de registro 1:', response.values[1]);
        }
        if (response.values.length > 2) {
          console.log('[MyTeamService] Exemplo de registro 2:', response.values[2]);
        }

        console.log('[MyTeamService] Dados da aba ElencosTimes recebidos:', response.values.length - 1, 'registros');

        // Filtrar apenas os jogadores do time atual - usar o ID exato
        const teamPlayersRows = response.values.slice(1)
          .filter((row: any) => row[1] === team.id);
        
        console.log(`[MyTeamService] ${teamPlayersRows.length} jogadores encontrados para o time ${team.id}`);
        
        // Mostrar os jogadores encontrados para debug
        if (teamPlayersRows.length > 0) {
          teamPlayersRows.forEach((row: any, index: number) => {
            console.log(`[MyTeamService] Jogador ${index + 1} do time ${team.id}:`, {
              id_registro: row[0],
              id_time: row[1],
              id_atleta: row[2],
              id_cartola: row[3],
              status: row[4]
            });
          });
        }
        
        if (teamPlayersRows.length === 0) {
          console.log(`[MyTeamService] ATENÇÃO: Nenhum jogador encontrado para o time ${team.id}!`);
          return of(team);
        }

        // Extrair apenas os IDs do Cartola (coluna id_cartola) e garantir que são strings
        const cartolaIds = teamPlayersRows
          .map((row: any) => row[3] ? row[3].toString() : null) // id_cartola está na posição 3
          .filter((id: string | null) => id !== null && id !== ''); // Remover IDs vazios ou null
        
        console.log(`[MyTeamService] ${cartolaIds.length} IDs Cartola válidos extraídos:`, cartolaIds);

        // Mapear os IDs para um objeto com status
        interface PlayerStatus {
          status: string;
        }
        
        const playerStatuses: { [key: string]: PlayerStatus } = {};
        teamPlayersRows.forEach((row: any) => {
          if (row[3]) {
            const id = row[3].toString(); // id_cartola
            playerStatuses[id] = {
              status: row[4] || 'Ativo' // status_time está na posição 4
            };
          }
        });

        // Se não temos IDs, retornar time sem jogadores
        if (cartolaIds.length === 0) {
          console.log('[MyTeamService] Nenhum ID Cartola válido encontrado, retornando time sem jogadores');
          team.players = [];
          return of(team);
        }

        // Buscar todos os atletas do Cartola API
        return this.cartolaApiService.getAllAthletes().pipe(
          map(response => {
            if (!response || !response.atletas) {
              console.log('[MyTeamService] Nenhum atleta retornado da API do Cartola');
              return [];
            }
            
            console.log(`[MyTeamService] API retornou ${Object.keys(response.atletas).length} atletas, filtrando para o time...`);
            
            // Lista de IDs para verificar após filtragem
            const foundIds: string[] = [];
            
            // Filtrar os atletas pelos IDs Cartola
            const athletesData = Object.values(response.atletas)
              .filter((athlete: any) => {
                const idCartola = athlete.atleta_id.toString();
                const isIncluded = cartolaIds.includes(idCartola);
                
                // Para debug, mostrar os que estão sendo incluídos
                if (isIncluded) {
                  foundIds.push(idCartola);
                  console.log(`[MyTeamService] Incluindo atleta: id=${idCartola}, nome=${athlete.apelido}`);
                }
                
                return isIncluded;
              })
              .map((athlete: any) => {
                const mappedAthlete = this.cartolaApiService.mapAthleteFromApi(athlete);
                
                // Aplicar o status do time, se disponível
                const idCartola = athlete.atleta_id.toString();
                if (playerStatuses[idCartola]) {
                  // Map ElencosTimes status to Cartola status format
                  const statusMap: Record<string, string> = {
                    'Ativo': 'Disponível',
                    'Contundido': 'Contundido',
                    'Dúvida': 'Dúvida',
                    'Suspenso': 'Suspenso',
                    'Provável': 'Provável',
                    'Nulo': 'Nulo'
                  };

                  // Use the mapped status or the original one if no mapping exists
                  const rawStatus = playerStatuses[idCartola].status;
                  mappedAthlete.status = statusMap[rawStatus] || rawStatus;
                  console.log(`[MyTeamService] Aplicando status para ${mappedAthlete.apelido}: ${rawStatus} -> ${mappedAthlete.status}`);
                }
                
                return mappedAthlete;
              });
            
            // Verificar IDs não encontrados
            const notFoundIds = cartolaIds.filter((id: string) => !foundIds.includes(id));
            if (notFoundIds.length > 0) {
              console.log(`[MyTeamService] ATENÇÃO: ${notFoundIds.length} IDs Cartola não encontrados na API:`, notFoundIds);
            }
            
            console.log(`[MyTeamService] ${athletesData.length} atletas encontrados para o time ${team.id}:`, 
              athletesData.map((a: any) => `${a.apelido} (ID Cartola: ${a.idCartola})`));
            
            return athletesData;
          }),
          switchMap(athletes => {
            // Converter para MyTeamPlayer e adicionar ao time
            team.players = athletes.map(athlete => ({
              ...athlete,
              inLineup: false,
              position: undefined
            }));

            // Buscar a escalação atual
            return this.getTeamLineup(team);
          }),
          catchError(error => {
            console.error('[MyTeamService] Erro ao obter detalhes dos atletas:', error);
            return of(team);
          })
        );
      })
    );
  }

  // Método para buscar os detalhes dos jogadores
  private getAthletesDetails(cartolaIds: string[]): Observable<Athlete[]> {
    if (cartolaIds.length === 0) {
      return of([]);
    }

    // Buscar diretamente da API do Cartola
    return this.cartolaApiService.getAllAthletes().pipe(
      map(response => {
        if (!response || !response.atletas) {
          return [];
        }
        
        // Filtrar os atletas APENAS pelo ID do Cartola
        const athletesData = Object.values(response.atletas)
          .filter((athlete: any) => {
            const atleta_id_str = athlete.atleta_id.toString();
            return cartolaIds.includes(atleta_id_str);
          })
          .map((athlete: any) => this.cartolaApiService.mapAthleteFromApi(athlete));
        
        console.log('Dados dos atletas:', athletesData);
        return athletesData;
      }),
      catchError(error => {
        this.notificationService.error('Não foi possível carregar os dados dos atletas');
        return of([]);
      })
    );
  }

  // Método para buscar a escalação atual do time
  private getTeamLineup(team: MyTeam): Observable<MyTeam> {
    // Como a aba Escalacoes parece não existir, simplesmente retornamos o time com uma lineup vazia
    // para evitar o erro HTTP 400
    team.lineup = [];
    
    // Em uma implementação futura, quando a aba Escalacoes estiver disponível,
    // o código abaixo pode ser descomentado e adaptado

    /*
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.LINEUP_RANGE}`
    ).pipe(
      map(response => {
        if (!response.values || response.values.length <= 1) {
          // Se não tem escalação, usar a formação padrão para posicionar
          team.lineup = [];
          return team;
        }

        // Filtrar apenas a escalação do time atual
        const lineupRows = response.values.slice(1)
          .filter((row: any) => row[1] === team.id);
        
        if (lineupRows.length === 0) {
          team.lineup = [];
          return team;
        }

        // Extrair as posições e adicionar ao time
        team.lineup = lineupRows.map((row: any) => {
          // Buscar coordenadas da posição na formação atual
          const formation = FORMATIONS.find(f => f.id === team.formation) || FORMATIONS[0];
          const positionData = formation.positions.find(p => p.id === row[3]) || { x: 50, y: 50 };

          return {
            athleteId: row[2],
            position: row[3],
            x: positionData.x,
            y: positionData.y
          };
        });

        // Marcar os jogadores que estão na escalação
        team.players.forEach(player => {
          player.inLineup = team.lineup.some(item => item.athleteId === player.id);
          
          // Definir a posição no campo
          const lineupItem = team.lineup.find(item => item.athleteId === player.id);
          if (lineupItem) {
            player.position = lineupItem.position;
          }
        });

        return team;
      })
    );
    */

    // Como não temos a escalação, todos os jogadores estarão inicialmente fora do lineup
    team.players.forEach(player => {
      player.inLineup = false;
      player.position = undefined;
    });
    
    return of(team);
  }

  // Método para obter as formações disponíveis
  getFormations(): Observable<Formation[]> {
    // Buscar as formações permitidas da planilha
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.FORMACOES_RANGE}`;
    
    console.log('Buscando formações da planilha...');
    return this.makeAuthorizedRequest<any>('get', url).pipe(
      map(response => {
        console.log('Resposta da planilha (FormacoesPermitidas):', response);
        if (!response || !response.values || response.values.length === 0) {
          throw new Error('Não foi possível obter as formações da planilha');
        }
        
        // Extrair os cabeçalhos e criar o mapa de cabeçalhos
        const headers = response.values[0];
        const headerMap = createHeaderMap(headers);
        console.log('Mapeamento de cabeçalhos:', headerMap);
        
        // Verificar se os cabeçalhos necessários foram encontrados
        if (headerMap['id_formacao'] === undefined || headerMap['nome'] === undefined) {
          throw new Error('Estrutura da planilha de formações não corresponde ao esperado');
        }
        
        // Mapear as linhas para objetos SheetFormation
        const sheetFormations: SheetFormation[] = response.values
          .slice(1) // Pular o cabeçalho
          .map((row: any[]) => mapRowToSheetFormation(row, headerMap));
        
        console.log('Formações da planilha:', sheetFormations);
        
        // Converter SheetFormation para o modelo Formation usado pela aplicação
        const formations: Formation[] = sheetFormations.map((sheetFormation: SheetFormation) => {
          console.log(`Processando formação: ID=${sheetFormation.id}, Nome=${sheetFormation.nome}`);
          
          // Obter o nome da formação
          let formationName = sheetFormation.nome;
          
          // Extrair os números de jogadores diretamente do nome da formação
          // O nome deve estar no formato x-y-z (ex: "3-4-3")
          const formationPattern = /(\d+)-(\d+)-(\d+)/;
          const formationMatch = formationName.match(formationPattern);
          
          let defenders: number = 4; // valores padrão
          let midfielders: number = 3;
          let forwards: number = 3;
          
          if (formationMatch && formationMatch.length >= 4) {
            // Usar os valores do nome da formação (3-4-3 significa 3 defensores, 4 meias, 3 atacantes)
            defenders = parseInt(formationMatch[1], 10);
            midfielders = parseInt(formationMatch[2], 10);
            forwards = parseInt(formationMatch[3], 10);
            
            console.log(`Formação extraída do nome: ${defenders}-${midfielders}-${forwards}`);
          }
          
          // Verificar se é a formação 3-4-3 e garantir os valores corretos
          if (formationName === '3-4-3' || (defenders === 3 && midfielders === 4 && forwards === 3)) {
            console.log('Formação 3-4-3 detectada: corrigindo para 4 meias e 3 atacantes');
            midfielders = 4;
            forwards = 3;
          }
          
          // Buscar a formação predefinida correspondente pelo nome exato ou pela distribuição numérica
          let predefinedFormation = DEFAULT_FORMATIONS.find((f: Formation) => 
            f.name === formationName || 
            (f.defenders === defenders && f.midfielders === midfielders && f.forwards === forwards)
          );
          
          // Se não encontrar, usar a formação padrão correspondente a 3-4-3 se for o caso
          if (!predefinedFormation && defenders === 3 && midfielders === 4 && forwards === 3) {
            predefinedFormation = DEFAULT_FORMATIONS.find((f: Formation) => f.name === '3-4-3');
            console.log('Usando formação predefinida 3-4-3');
          }
          
          // Se ainda não encontrou, usar a primeira formação como fallback
          const matchingFormation = predefinedFormation || DEFAULT_FORMATIONS[0];
          
          console.log(`Formação encontrada: ${matchingFormation.name} (${matchingFormation.defenders}-${matchingFormation.midfielders}-${matchingFormation.forwards})`);
          
          // Criar um nome de formação padronizado se não estiver no formato correto
          if (!formationName.match(formationPattern)) {
            formationName = `${defenders}-${midfielders}-${forwards}`;
          }
          
          // Criar uma descrição baseada nas quantidades de jogadores
          const description = `Formação com ${defenders} defensores, ${midfielders} meias e ${forwards} atacantes`;
          
          // Criar objeto Formation com todos os campos requeridos e as posições da formação predefinida
          const formation: Formation = {
            id: sheetFormation.id,
            name: formationName,
            description: description,
            active: true,
            defenders: defenders,
            midfielders: midfielders,
            forwards: forwards,
            positions: matchingFormation.positions
          };
          
          return formation;
        });
        
        console.log('Formações processadas para o formato da aplicação:', formations);
        
        return formations;
      }),
      catchError(error => {
        console.error('Erro ao buscar formações da planilha:', error);
        this.notificationService.error('Não foi possível carregar as formações. Por favor, tente novamente mais tarde.');
        throw error;
      })
    );
  }

  // Método para atualizar o nome do time
  updateTeamName(teamId: string, newName: string): Observable<boolean> {
    // Buscar o time atual para verificar se há mudanças
    return this.getMyTeam().pipe(
      switchMap(team => {
        if (!team) {
          return of(false);
        }

        // Se o nome não mudou, retornar sucesso imediatamente
        if (team.name === newName) {
          return of(true);
        }

        // URL para buscar os times na planilha
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`;
        
        // Fazer a requisição para obter os dados atuais
        return this.makeAuthorizedRequest<any>('get', url).pipe(
          switchMap(response => {
            if (!response.values || response.values.length <= 1) {
              return of(false);
            }
            
            // Encontrar o índice do time a ser atualizado
            const teams = response.values;
            const teamIndex = teams.findIndex((row: any) => row[0] === teamId);
            
            if (teamIndex === -1) {
              return of(false);
            }
            
            // Calcular a célula para atualizar (nome está na coluna D)
            const rowNumber = teamIndex + 1; // +1 porque a planilha começa em 1, não em 0
            const range = `Times!D${rowNumber}`;
            
            // URL para atualizar a célula específica
            const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}?valueInputOption=RAW`;
            
            // Corpo da requisição
            const body = {
              values: [[newName]]
            };
            
            // Fazer a requisição para atualizar o nome
            return this.makeAuthorizedRequest<any>('put', updateUrl, body).pipe(
              map(() => {
                // Atualizar o cache
                if (team) {
                  team.name = newName;
                  this.storageService.set(this.TEAM_CACHE_KEY, team);
                }
                
                this.notificationService.success('Nome do time atualizado com sucesso!');
                return true;
              }),
              catchError(error => {
                this.notificationService.error('Erro ao atualizar o nome do time: ' + error.message);
                return of(false);
              })
            );
          })
        );
      })
    );
  }

  // Método para atualizar a formação do time
  updateTeamFormation(teamId: string, formationId: string): Observable<boolean> {
    // Buscar o time atual para verificar se há mudanças
    return this.getMyTeam().pipe(
      switchMap(team => {
        if (!team) {
          return of(false);
        }

        // Se a formação não mudou, retornar sucesso imediatamente
        if (team.formation === formationId) {
          return of(true);
        }

        // URL para buscar os times na planilha
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`;
        
        // Fazer a requisição para obter os dados atuais
        return this.makeAuthorizedRequest<any>('get', url).pipe(
          switchMap(response => {
            if (!response.values || response.values.length <= 1) {
              return of(false);
            }
            
            // Encontrar o índice do time a ser atualizado
            const teams = response.values;
            const teamIndex = teams.findIndex((row: any) => row[0] === teamId);
            
            if (teamIndex === -1) {
              return of(false);
            }
            
            // Calcular a célula para atualizar (formação está na coluna F)
            const rowNumber = teamIndex + 1; // +1 porque a planilha começa em 1, não em 0
            const range = `Times!F${rowNumber}`;
            
            // URL para atualizar a célula específica
            const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}?valueInputOption=RAW`;
            
            // Corpo da requisição
            const body = {
              values: [[formationId]]
            };
            
            // Fazer a requisição para atualizar a formação
            return this.makeAuthorizedRequest<any>('put', updateUrl, body).pipe(
              map(() => {
                // Atualizar o cache
                if (team) {
                  team.formation = formationId;
                  this.storageService.set(this.TEAM_CACHE_KEY, team);
                }
                
                this.notificationService.success('Formação do time atualizada com sucesso!');
                return true;
              }),
              catchError(error => {
                this.notificationService.error('Erro ao atualizar a formação do time: ' + error.message);
                return of(false);
              })
            );
          })
        );
      })
    );
  }

  // Método para atualizar a escalação do time
  updateTeamLineup(teamId: string, lineup: LineupPlayer[]): Observable<boolean> {
    // Como não temos a aba Escalacoes, vamos apenas atualizar o estado local do time
    // em vez de tentar salvar na planilha
    
    // Buscar o time atual
    return this.getMyTeam().pipe(
      map(team => {
        if (!team) {
          return false;
        }
        
        // Atualizar o cache
        team.lineup = lineup;
        // Atualizar os jogadores
        team.players.forEach(player => {
          player.inLineup = lineup.some(item => item.athleteId === player.id);
          
          // Definir a posição no campo
          const lineupItem = lineup.find(item => item.athleteId === player.id);
          if (lineupItem) {
            player.position = lineupItem.position;
          } else {
            player.position = undefined;
          }
        });
        
        this.storageService.set(this.TEAM_CACHE_KEY, team);
        this.notificationService.success('Escalação salva com sucesso! (Apenas localmente)');
        return true;
      }),
      catchError(error => {
        this.notificationService.error('Erro ao salvar a escalação: ' + error.message);
        return of(false);
      })
    );
  }

  // Método para limpar o cache do time
  clearTeamCache(): void {
    console.log('[MyTeamService] Limpando cache do time');
    this.storageService.remove(this.TEAM_CACHE_KEY);
    // Também invalidar o cache de atletas da API do Cartola
    this.cartolaApiService.invalidateCache();
  }

  // Método para fazer requisições autorizadas com o token
  private makeAuthorizedRequest<T>(
    method: 'get' | 'post' | 'put', 
    url: string, 
    body?: any
  ): Observable<T> {
    const currentUser = this.authService.currentUser;
    if (!currentUser || !currentUser.accessToken) {
      return of(null as unknown as T);
    }

    const headers = {
      'Authorization': `Bearer ${currentUser.accessToken}`,
      'Content-Type': 'application/json'
    };

    if (method === 'get') {
      return this.http.get<T>(url, { headers });
    } else if (method === 'post') {
      return this.http.post<T>(url, body, { headers });
    } else if (method === 'put') {
      return this.http.put<T>(url, body, { headers });
    }

    return of(null as unknown as T);
  }

  // Método para atualizar a pontuação da última rodada de um time
  updateTeamLastRoundScore(teamId: string, score: number): Observable<boolean> {
    // Identificar o time na planilha
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.TEAMS_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          this.notificationService.error('Não foi possível encontrar o time para atualizar a pontuação');
          return of(false);
        }

        // Obter o cabeçalho para identificar os índices das colunas
        const header = response.values[0];
        const colIndexPontuacaoUltimaRodada = header.findIndex((col: string) => 
          col.toLowerCase().includes('pontuacao_ultima_rodada') || 
          col.toLowerCase().includes('pontuação_última_rodada')
        );

        // Se não encontramos a coluna, não podemos continuar
        if (colIndexPontuacaoUltimaRodada === -1) {
          this.notificationService.error('Estrutura da planilha não tem coluna para pontuação da última rodada');
          return of(false);
        }

        // Procurar o time do usuário atual
        const teams = response.values.slice(1);
        const teamRowIndex = teams.findIndex((row: any) => row[0] === teamId);
        
        if (teamRowIndex === -1) {
          this.notificationService.error('Time não encontrado na planilha');
          return of(false);
        }

        // Ajustar para o índice real na planilha (inclui o cabeçalho)
        const rowIndex = teamRowIndex + 2; // +1 pelo slice e +1 pelo cabeçalho

        // Construir a notação A1 para a célula que queremos atualizar
        const columnLetter = this.columnToLetter(colIndexPontuacaoUltimaRodada + 1); // +1 porque as colunas no Google Sheets começam em 1
        const range = `Times!${columnLetter}${rowIndex}`;

        // Atualizar o valor na planilha
        return this.makeAuthorizedRequest<any>('put',
          `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED`,
          {
            values: [[score.toString()]]
          }
        ).pipe(
          map(response => {
            if (response && response.updatedCells > 0) {
              this.notificationService.success('Pontuação da última rodada atualizada com sucesso');
              
              // Atualizar a versão em cache se existir
              const cachedTeam = this.storageService.get<MyTeam>(this.TEAM_CACHE_KEY);
              if (cachedTeam && cachedTeam.id === teamId) {
                cachedTeam.pontuacaoUltimaRodada = score;
                this.storageService.set(this.TEAM_CACHE_KEY, cachedTeam);
              }
              
              return true;
            } else {
              this.notificationService.error('Erro ao atualizar pontuação da última rodada');
              return false;
            }
          }),
          catchError(error => {
            console.error('Erro ao atualizar pontuação da última rodada:', error);
            this.notificationService.error('Erro ao atualizar pontuação da última rodada');
            return of(false);
          })
        );
      })
    );
  }

  // Método auxiliar para converter número de coluna para letra (1 = A, 2 = B, etc.)
  private columnToLetter(column: number): string {
    let temp, letter = '';
    while (column > 0) {
      temp = (column - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      column = (column - temp - 1) / 26;
    }
    return letter;
  }
} 