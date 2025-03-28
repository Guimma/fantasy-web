import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, tap, catchError } from 'rxjs';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MyTeam, MyTeamPlayer, LineupPlayer, Formation, FORMATIONS } from '../models/my-team.model';
import { Athlete } from '../../draft/models/draft.model';

@Injectable({
  providedIn: 'root'
})
export class MyTeamService {
  private http = inject(HttpClient);
  private authService = inject(GoogleAuthService);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly TEAMS_RANGE = 'Times!A:I'; // id_time, id_liga, id_usuario, nome, saldo, formacao_atual, pontuacao_total, pontuacao_ultima_rodada, colocacao
  private readonly ATHLETES_RANGE = 'Atletas!A:P'; // id_atleta, id_cartola, nome, apelido, foto_url, posicao, posicao_abreviacao, clube, clube_abreviacao, preco, media_pontos, jogos, status, ultima_atualizacao, data_criacao
  private readonly ELENCOS_TIMES_RANGE = 'ElencosTimes!A:F'; // id_registro, id_time, id_atleta, status_time, valor_compra, data_aquisicao
  private readonly LINEUP_RANGE = 'Escalacoes!A:E'; // id_escalacao, id_time, id_atleta, posicao, rodada_atual
  private readonly FORMACOES_RANGE = 'FormacoesPermitidas!A:D'; // id_formacao, nome, descricao, ativa
  
  private readonly TEAM_CACHE_KEY = 'my_team_data';
  private readonly FORMATIONS_CACHE_KEY = 'formations_data';

  constructor() { }

  // Método para obter o time do usuário atual
  getMyTeam(): Observable<MyTeam | null> {
    // Verificar se temos o time em cache
    const cachedTeam = this.storageService.get<MyTeam>(this.TEAM_CACHE_KEY);
    if (cachedTeam) {
      return of(cachedTeam);
    }

    // Caso não tenha em cache, buscar o time do usuário atual
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
    // Buscar a relação de jogadores do time
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ELENCOS_TIMES_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          return of(team);
        }

        // Filtrar apenas os jogadores do time atual
        const teamPlayersRows = response.values.slice(1)
          .filter((row: any) => row[1] === team.id);
        
        if (teamPlayersRows.length === 0) {
          return of(team);
        }

        // Extrair os IDs dos jogadores
        const athleteIds = teamPlayersRows.map((row: any) => row[2]);

        // Buscar os detalhes dos jogadores
        return this.getAthletesDetails(athleteIds).pipe(
          switchMap(athletes => {
            // Converter para MyTeamPlayer e adicionar ao time
            team.players = athletes.map(athlete => ({
              ...athlete,
              inLineup: false,
              position: undefined
            }));

            // Buscar a escalação atual
            return this.getTeamLineup(team);
          })
        );
      })
    );
  }

  // Método para buscar os detalhes dos jogadores
  private getAthletesDetails(athleteIds: string[]): Observable<Athlete[]> {
    if (athleteIds.length === 0) {
      return of([]);
    }

    // Buscar todos os atletas
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.ATHLETES_RANGE}`
    ).pipe(
      map(response => {
        if (!response.values || response.values.length <= 1) {
          return [];
        }

        // Mapear os atletas
        const allAthletes = response.values.slice(1).map((row: any) => ({
          id: row[0],
          idCartola: row[1],
          nome: row[2],
          apelido: row[3],
          foto_url: row[4],
          posicao: row[5],
          posicaoAbreviacao: row[6],
          clube: row[7],
          clubeAbreviacao: row[8],
          preco: parseFloat(row[9] || '0'),
          mediaPontos: parseFloat(row[10] || '0'),
          jogos: parseInt(row[11] || '0', 10),
          status: row[12],
          ultimaAtualizacao: row[13],
          dataCriacao: row[14]
        }));

        // Filtrar apenas os atletas do time
        return allAthletes.filter((athlete: Athlete) => athleteIds.includes(athlete.id));
      })
    );
  }

  // Método para buscar a escalação atual do time
  private getTeamLineup(team: MyTeam): Observable<MyTeam> {
    // Buscar a escalação
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
  }

  // Método para obter as formações disponíveis
  getFormations(): Observable<Formation[]> {
    // Verificar se temos as formações em cache
    const cachedFormations = this.storageService.get<Formation[]>(this.FORMATIONS_CACHE_KEY);
    if (cachedFormations) {
      return of(cachedFormations);
    }

    // Caso não tenha em cache, usar as formações padrão pré-definidas
    // Em uma implementação real, buscaríamos da planilha
    this.storageService.set(this.FORMATIONS_CACHE_KEY, FORMATIONS);
    return of(FORMATIONS);
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
    // Buscar o time atual
    return this.getMyTeam().pipe(
      switchMap(team => {
        if (!team) {
          return of(false);
        }

        // Limpar a escalação atual
        return this.clearTeamLineup(teamId).pipe(
          switchMap(() => {
            // Se não há jogadores para adicionar, retornar sucesso
            if (lineup.length === 0) {
              return of(true);
            }

            // Preparar os dados para adicionar à planilha
            const values = lineup.map((item, index) => [
              `ESC${teamId}${index}`, // ID da escalação
              teamId,                 // ID do time
              item.athleteId,         // ID do atleta
              item.position,          // Posição no campo
              new Date().toISOString() // Data atual
            ]);

            // URL para adicionar as novas escalações
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.LINEUP_RANGE}:append?valueInputOption=RAW`;
            
            // Corpo da requisição
            const body = {
              values: values
            };
            
            // Fazer a requisição para adicionar as novas escalações
            return this.makeAuthorizedRequest<any>('post', url, body).pipe(
              map(() => {
                // Atualizar o cache
                if (team) {
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
                }
                
                this.notificationService.success('Escalação atualizada com sucesso!');
                return true;
              }),
              catchError(error => {
                this.notificationService.error('Erro ao atualizar a escalação: ' + error.message);
                return of(false);
              })
            );
          })
        );
      })
    );
  }

  // Método para limpar a escalação atual do time
  private clearTeamLineup(teamId: string): Observable<boolean> {
    // Buscar a escalação atual
    return this.makeAuthorizedRequest<any>('get',
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.LINEUP_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          return of(true); // Não há escalação para limpar
        }

        // Identificar as linhas que correspondem ao time
        const lineupRows = response.values.slice(1)
          .filter((row: any) => row[1] === teamId);
        
        if (lineupRows.length === 0) {
          return of(true); // Não há escalação para limpar
        }

        // TODO: Implementar a limpeza da escalação na planilha
        // Por enquanto, assumir que foi limpo com sucesso
        return of(true);
      })
    );
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
} 