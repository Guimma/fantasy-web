import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, map, tap, catchError, forkJoin } from 'rxjs';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { StorageService } from '../../../core/services/storage.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CartolaApiService } from '../../../core/services/cartola-api.service';
import { MyTeamService } from './my-team.service';
import { TeamPlayerHistory, TeamRoundHistory } from '../models/team-history.model';
import { MyTeam } from '../models/my-team.model';
import { Athlete } from '../../draft/models/draft.model';

@Injectable({
  providedIn: 'root'
})
export class TeamHistoryService {
  private http = inject(HttpClient);
  private authService = inject(GoogleAuthService);
  private storageService = inject(StorageService);
  private notificationService = inject(NotificationService);
  private cartolaApiService = inject(CartolaApiService);
  private myTeamService = inject(MyTeamService);
  
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly HISTORICO_TIMES_RANGE = 'HistoricoTimes!A:I'; // id_registro, id_time, id_atleta, id_cartola, status_time, valor_compra, data_aquisicao, rodada_id, data_registro
  private readonly HISTORICO_TIMES_CACHE_KEY = 'historico_times_rodada_';

  constructor() {
    // Garantir que a aba HistoricoTimes existe na planilha
    setTimeout(() => {
      this.ensureHistoricoTimesSheet();
    }, 1000);
  }

  /**
   * Garante que a aba HistoricoTimes existe na planilha
   */
  private ensureHistoricoTimesSheet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authService.currentUser?.accessToken) {
        reject('Usuário não autenticado');
        return;
      }

      const headers = [
        'id_registro',
        'id_time',
        'id_atleta',
        'id_cartola',
        'status_time',
        'valor_compra',
        'data_aquisicao',
        'rodada_id',
        'data_registro'
      ];

      // Verificar se a planilha já tem cabeçalho
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.HISTORICO_TIMES_RANGE}`;
      
      this.makeAuthorizedRequest<any>('get', url).subscribe({
        next: (response: any) => {
          // Se não houver valores ou a primeira linha não tiver os cabeçalhos esperados
          if (!response.values || response.values.length === 0) {
            // Adicionar cabeçalhos
            this.addHeadersToSheet(headers)
              .then(() => resolve())
              .catch(error => reject(error));
          } else {
            // Cabeçalhos já existem
            resolve();
          }
        },
        error: (error) => {
          console.error(`Erro ao verificar cabeçalhos em HistoricoTimes:`, error);
          // Tentar adicionar cabeçalhos mesmo assim
          this.addHeadersToSheet(headers)
            .then(() => resolve())
            .catch(error => reject(error));
        }
      });
    });
  }

  /**
   * Adiciona cabeçalhos à aba HistoricoTimes
   */
  private addHeadersToSheet(headers: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.authService.currentUser?.accessToken) {
        reject('Usuário não autenticado');
        return;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.HISTORICO_TIMES_RANGE}?valueInputOption=USER_ENTERED`;
      
      const body = {
        values: [headers]
      };

      this.makeAuthorizedRequest<any>('put', url, body).subscribe({
        next: () => {
          console.log(`Cabeçalhos de HistoricoTimes adicionados com sucesso`);
          resolve();
        },
        error: (error) => {
          console.error(`Erro ao adicionar cabeçalhos em HistoricoTimes:`, error);
          reject(error);
        }
      });
    });
  }

  /**
   * Salva o histórico de todos os times para uma rodada específica
   * @param rodadaId ID da rodada
   * @returns Observable<boolean> Indica se o salvamento foi bem-sucedido
   */
  salvarHistoricoTimesRodada(rodadaId: number): Observable<boolean> {
    console.log(`[TeamHistoryService] Iniciando salvamento do histórico de times para a rodada ${rodadaId}`);
    
    // Para simplificar, vamos usar apenas o time do usuário atual por enquanto
    // Em uma implementação mais completa, deveríamos buscar todos os times da liga
    return this.myTeamService.getMyTeam(true).pipe(
      switchMap(myTeam => {
        if (!myTeam) {
          console.log('[TeamHistoryService] Nenhum time encontrado para salvar histórico');
          return of(false);
        }
        
        console.log(`[TeamHistoryService] Salvando histórico do time "${myTeam.name}" (ID: ${myTeam.id}) para a rodada ${rodadaId}`);
        return this.salvarHistoricoTimeRodada(myTeam, rodadaId);
      })
    );
  }

  /**
   * Salva o histórico de um time específico para uma rodada
   * @param team Time a ser salvo
   * @param rodadaId ID da rodada
   * @returns Observable<boolean> Indica se o salvamento foi bem-sucedido
   */
  private salvarHistoricoTimeRodada(team: MyTeam, rodadaId: number): Observable<boolean> {
    // Verificar se já existe histórico para este time/rodada
    return this.getTimeHistoricoRodada(team.id, rodadaId).pipe(
      switchMap(historicoExistente => {
        if (historicoExistente && historicoExistente.jogadores.length > 0) {
          console.log(`[TeamHistoryService] Histórico já existe para o time ${team.id} na rodada ${rodadaId}`);
          return of(true);
        }
        
        // Salvar todos os jogadores do time para esta rodada
        console.log(`[TeamHistoryService] Salvando ${team.players.length} jogadores do time ${team.id} para a rodada ${rodadaId}`);
        
        // Criar registros para todos os jogadores do time
        const dataRegistro = new Date().toISOString();
        const registros: TeamPlayerHistory[] = team.players.map(player => {
          // Gerar ID único para o registro
          const registroId = `HR${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          
          return {
            registroId,
            timeId: team.id,
            atletaId: player.id,
            cartolaId: player.idCartola,
            statusTime: 'Ativo', // Por padrão, todos os jogadores estão ativos
            valorCompra: player.preco || 0,
            dataAquisicao: player.dataCriacao || dataRegistro,
            rodadaId,
            dataRegistro
          };
        });
        
        // Salvar todos os registros na planilha
        return this.salvarRegistrosHistorico(registros);
      })
    );
  }

  /**
   * Salva os registros de histórico na planilha
   * @param registros Registros a serem salvos
   * @returns Observable<boolean> Indica se o salvamento foi bem-sucedido
   */
  private salvarRegistrosHistorico(registros: TeamPlayerHistory[]): Observable<boolean> {
    if (registros.length === 0) {
      return of(true);
    }
    
    // Preparar os valores para a planilha
    const values = registros.map(registro => [
      registro.registroId,
      registro.timeId,
      registro.atletaId,
      registro.cartolaId,
      registro.statusTime,
      registro.valorCompra.toString(),
      registro.dataAquisicao,
      registro.rodadaId.toString(),
      registro.dataRegistro
    ]);
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.HISTORICO_TIMES_RANGE}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    
    const body = { values };
    
    return this.makeAuthorizedRequest<any>('post', url, body).pipe(
      map(() => {
        console.log(`[TeamHistoryService] ${registros.length} registros de histórico salvos com sucesso`);
        this.notificationService.success(`Histórico do time salvo para a rodada ${registros[0].rodadaId}`);
        return true;
      }),
      catchError(error => {
        console.error('[TeamHistoryService] Erro ao salvar registros de histórico:', error);
        this.notificationService.error('Erro ao salvar histórico do time');
        return of(false);
      })
    );
  }

  /**
   * Obtém o histórico de um time para uma rodada específica
   * @param timeId ID do time
   * @param rodadaId ID da rodada
   * @returns Observable<TeamRoundHistory | null> Histórico do time ou null se não existir
   */
  getTimeHistoricoRodada(timeId: string, rodadaId: number): Observable<TeamRoundHistory | null> {
    // Verificar cache
    const cacheKey = `${this.HISTORICO_TIMES_CACHE_KEY}${timeId}_${rodadaId}`;
    const cachedData = this.storageService.get<TeamRoundHistory>(cacheKey);
    if (cachedData) {
      console.log(`[TeamHistoryService] Usando cache para histórico do time ${timeId} na rodada ${rodadaId}`);
      return of(cachedData);
    }
    
    console.log(`[TeamHistoryService] Buscando histórico do time ${timeId} para a rodada ${rodadaId}`);
    
    // Buscar registros da planilha
    return this.makeAuthorizedRequest<any>('get', 
      `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.HISTORICO_TIMES_RANGE}`
    ).pipe(
      switchMap(response => {
        if (!response.values || response.values.length <= 1) {
          console.log('[TeamHistoryService] Nenhum registro de histórico encontrado');
          return of(null);
        }
        
        // Filtrar registros do time para a rodada específica
        const registros = response.values.slice(1)
          .filter((row: any[]) => row[1] === timeId && row[7] === rodadaId.toString())
          .map((row: any[]): TeamPlayerHistory => ({
            registroId: row[0],
            timeId: row[1],
            atletaId: row[2],
            cartolaId: row[3],
            statusTime: row[4],
            valorCompra: parseFloat(row[5] || '0'),
            dataAquisicao: row[6],
            rodadaId: parseInt(row[7], 10),
            dataRegistro: row[8]
          }));
        
        if (registros.length === 0) {
          console.log(`[TeamHistoryService] Nenhum registro encontrado para o time ${timeId} na rodada ${rodadaId}`);
          return of(null);
        }
        
        // Obter detalhes dos atletas
        const cartolaIds = registros.map((r: TeamPlayerHistory) => r.cartolaId);
        
        return this.cartolaApiService.getAllAthletes().pipe(
          map(response => {
            if (!response || !response.atletas) {
              console.log('[TeamHistoryService] Sem dados de atletas da API do Cartola');
              return null;
            }
            
            // Filtrar apenas os atletas do histórico
            const atletas = Object.values(response.atletas)
              .filter((a: any) => cartolaIds.includes(a.atleta_id.toString()))
              .map((a: any) => this.cartolaApiService.mapAthleteFromApi(a));
            
            // Criar o objeto de histórico
            const historico: TeamRoundHistory = {
              timeId,
              rodadaId,
              dataRegistro: registros[0].dataRegistro,
              jogadores: atletas
            };
            
            // Salvar em cache
            this.storageService.set(cacheKey, historico);
            
            return historico;
          })
        );
      }),
      catchError(error => {
        console.error('[TeamHistoryService] Erro ao obter histórico do time:', error);
        return of(null);
      })
    );
  }

  /**
   * Faz uma requisição HTTP com autorização
   * @param method Método HTTP
   * @param url URL da requisição
   * @param body Corpo da requisição (opcional)
   * @returns Observable com o resultado da requisição
   */
  private makeAuthorizedRequest<T>(method: string, url: string, body?: any): Observable<T> {
    if (!this.authService.currentUser?.accessToken) {
      console.error('[TeamHistoryService] Usuário não autenticado');
      return of(null as unknown as T);
    }
    
    const headers = {
      'Authorization': `Bearer ${this.authService.currentUser.accessToken}`,
      'Content-Type': 'application/json'
    };
    
    switch (method.toLowerCase()) {
      case 'get':
        return this.http.get<T>(url, { headers });
      case 'post':
        return this.http.post<T>(url, body, { headers });
      case 'put':
        return this.http.put<T>(url, body, { headers });
      case 'delete':
        return this.http.delete<T>(url, { headers });
      default:
        console.error(`[TeamHistoryService] Método HTTP não suportado: ${method}`);
        return of(null as unknown as T);
    }
  }
} 