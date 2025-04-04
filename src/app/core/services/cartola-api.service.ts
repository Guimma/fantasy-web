import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError, shareReplay, throwError } from 'rxjs';
import { Athlete } from '../../features/draft/models/draft.model';
import { CorsProxyService } from './cors-proxy.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CartolaApiService {
  private http = inject(HttpClient);
  private corsProxy = inject(CorsProxyService);
  private readonly BASE_URL = 'https://api.cartola.globo.com';
  private athletesCache: { data: any; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

  constructor() {}

  /**
   * Helper method to handle API requests with or without proxy based on environment
   * Uses direct call in development, proxy in production
   */
  private apiGet<T>(endpoint: string): Observable<T> {
    const url = `${this.BASE_URL}${endpoint}`;
    
    // For production or GitHub Pages deployment, always use proxy
    // Only use direct API calls in local development
    const isGitHubPages = window.location.hostname.includes('github.io');
    const forceProxy = environment.production || isGitHubPages;
    
    if (!forceProxy) {
      console.log(`[CartolaAPI] Chamada direta em ambiente de desenvolvimento: ${url}`);
      return this.http.get<T>(url).pipe(
        catchError(error => {
          console.error(`[CartolaAPI] Erro na chamada direta: ${error.message}`);
          // If CORS error in development, try using proxy as fallback
          if (error.status === 0) {
            console.log(`[CartolaAPI] Tentando via proxy mesmo em desenvolvimento...`);
            return this.corsProxy.get<T>(url);
          }
          return throwError(() => error);
        })
      );
    } else {
      console.log(`[CartolaAPI] Chamada via proxy em ambiente de produção ou GitHub Pages: ${url}`);
      return this.corsProxy.get<T>(url).pipe(
        catchError(proxyError => {
          console.error(`[CartolaAPI] Erro na chamada via proxy: ${proxyError.message}`);
          // If the proxy fails, try rotating to the next one
          this.corsProxy.rotateProxy();
          console.log(`[CartolaAPI] Tentando com outro proxy...`);
          return this.corsProxy.get<T>(url);
        })
      );
    }
  }

  // Obter o status atual do mercado
  getMarketStatus(): Observable<any> {
    console.log('[CartolaAPI] Obtendo status do mercado');
    return this.apiGet<any>('/mercado/status').pipe(
      map(response => {
        console.log('[CartolaAPI] Status do mercado obtido:', response);
        return response;
      }),
      catchError(error => {
        console.error('[CartolaAPI] Erro ao obter status do mercado:', error);
        return of(null);
      })
    );
  }

  // Obter a rodada atual
  getCurrentRound(): Observable<any> {
    console.log('[CartolaAPI] Obtendo rodada atual');
    
    return this.apiGet<any>('/rodadas').pipe(
      map(rounds => {
        console.log('[CartolaAPI] Rodadas obtidas:', rounds);
        if (Array.isArray(rounds)) {
          // Encontrar a rodada atual baseada na data atual
          const now = new Date();
          console.log('[CartolaAPI] Data atual:', now);
          
          const currentRound = rounds.find(round => {
            const inicio = new Date(round.inicio);
            const fim = new Date(round.fim);
            console.log(`[CartolaAPI] Verificando rodada ${round.rodada_id}: inicio=${inicio}, fim=${fim}`);
            return now >= inicio && now <= fim;
          });
          
          // Se não encontrar rodada em andamento, retornar a próxima
          if (!currentRound) {
            console.log('[CartolaAPI] Nenhuma rodada em andamento encontrada, buscando a próxima...');
            
            // Ordenar por data de início e encontrar a próxima
            const sortedRounds = [...rounds].sort((a, b) => 
              new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
            );
            
            const nextRound = sortedRounds.find(round => {
              const inicio = new Date(round.inicio);
              console.log(`[CartolaAPI] Verificando se rodada ${round.rodada_id} é a próxima: inicio=${inicio} > now=${now}`);
              return inicio > now;
            });
            
            // Se não houver próxima, retornar a última finalizada
            if (!nextRound) {
              console.log('[CartolaAPI] Nenhuma rodada futura encontrada, buscando a última finalizada...');
              
              // Ordenar por data de fim (decrescente) e pegar a primeira (mais recente)
              const lastRound = [...rounds].sort((a, b) => 
                new Date(b.fim).getTime() - new Date(a.fim).getTime()
              )[0];
              
              console.log('[CartolaAPI] Última rodada finalizada identificada:', lastRound);
              return lastRound;
            }
            
            const result = nextRound || { rodada_id: 1 };
            console.log('[CartolaAPI] Próxima rodada identificada:', result);
            return result;
          }
          
          console.log('[CartolaAPI] Rodada atual identificada:', currentRound);
          return currentRound;
        }
        console.log('[CartolaAPI] Formato de rodadas não reconhecido, usando rodada 1');
        return { rodada_id: 1 };
      }),
      catchError(error => {
        console.error('[CartolaAPI] Erro ao obter rodada atual:', error);
        // Retornar rodada padrão em caso de erro
        return of({ rodada_id: 1 });
      })
    );
  }

  // Obter todos os atletas com dados de mercado
  getAllAthletes(): Observable<any> {
    // Verificar se temos cache válido
    if (this.athletesCache && 
        (Date.now() - this.athletesCache.timestamp) < this.CACHE_DURATION) {
      console.log('[CartolaAPI] Usando cache de atletas (idade do cache:', 
                  Math.round((Date.now() - this.athletesCache.timestamp)/1000), 'segundos)');
      return of(this.athletesCache.data);
    }

    console.log('[CartolaAPI] Obtendo atletas do mercado');
    return this.apiGet<any>('/atletas/mercado').pipe(
      map(response => {
        // Armazenar no cache
        this.athletesCache = {
          data: response,
          timestamp: Date.now()
        };
        if (response && response.atletas) {
          console.log(`[CartolaAPI] ${Object.keys(response.atletas).length} atletas obtidos da API`);
          
          // Depurar o formato dos dados para entender a estrutura
          if (Object.keys(response.atletas).length > 0) {
            const sampleAthleteKey = Object.keys(response.atletas)[0];
            const sampleAthlete = response.atletas[sampleAthleteKey];
            console.log('[CartolaAPI] Exemplo de estrutura de atleta:', JSON.stringify(sampleAthlete));
          }
        } else {
          console.log('[CartolaAPI] Retorno vazio ou formato não reconhecido');
        }
        return response;
      }),
      catchError(error => {
        console.error('[CartolaAPI] Erro ao obter atletas:', error);
        return of(null);
      }),
      shareReplay(1)
    );
  }

  // Obter atletas pontuados em uma rodada específica
  getAthletesScores(roundId: number): Observable<any> {
    console.log(`[CartolaAPI] Obtendo pontuações da rodada ${roundId}`);
    return this.apiGet<any>(`/atletas/pontuados/${roundId}`).pipe(
      map(response => {
        if (response && response.atletas) {
          console.log(`[CartolaAPI] ${Object.keys(response.atletas).length} atletas pontuados na rodada ${roundId}`);
        } else {
          console.log(`[CartolaAPI] Sem pontuações ou formato não reconhecido para rodada ${roundId}`);
        }
        return response;
      }),
      catchError(error => {
        console.error(`[CartolaAPI] Erro ao obter pontuações da rodada ${roundId}:`, error);
        return of(null);
      })
    );
  }

  // Converter dados da API para o formato usado na aplicação
  mapAthleteFromApi(athlete: any): Athlete {
    // Verificar se o objeto tem a estrutura esperada
    if (!athlete) {
      console.warn('[CartolaAPI] Atleta inválido recebido da API:', athlete);
      return {
        id: '',
        idCartola: '',
        slug: '',
        nome: 'Desconhecido',
        apelido: 'Desconhecido',
        posicao: 'Desconhecido',
        posicaoAbreviacao: 'DESC',
        clube: 'Clube Desconhecido',
        clubeAbreviacao: 'DESC',
        preco: 0,
        mediaPontos: 0,
        jogos: 0,
        status: 'Desconhecido'
      };
    }

    // Log do status_id para depuração
    console.log(`[CartolaAPI] Mapeando atleta ${athlete.apelido} (ID: ${athlete.atleta_id}), status_id: ${athlete.status_id}`);
    
    // Obter o ID numérico do Cartola - PRINCIPAL identificador
    const numericId = athlete.atleta_id.toString();
    
    const status = this.mapStatusFromId(athlete.status_id);
    
    // Log do status mapeado
    console.log(`[CartolaAPI] Atleta ${athlete.apelido}: status_id ${athlete.status_id} mapeado para "${status}"`);
    
    return {
      idCartola: numericId,      // ID numérico do Cartola (PRINCIPAL)
      id: numericId,             // Usar o ID numérico diretamente
      slug: numericId,           // Usar o ID numérico diretamente
      nome: athlete.nome || '',
      apelido: athlete.apelido || '',
      foto_url: athlete.foto || '',
      posicao: this.mapPositionFromId(athlete.posicao_id),
      posicaoAbreviacao: this.mapPositionAbrevFromId(athlete.posicao_id),
      clube: this.getClubNameById(athlete.clube_id),
      clubeAbreviacao: this.getClubAbbrevById(athlete.clube_id),
      preco: athlete.preco_num || 0,
      mediaPontos: athlete.media_num || 0,
      jogos: athlete.jogos_num || 0,
      status: status,
      ultimaAtualizacao: new Date().toISOString(),
      dataCriacao: ''
    };
  }

  // Mapear ID de posição para nome da posição
  private mapPositionFromId(positionId: number): string {
    const positions: { [key: number]: string } = {
      1: 'Goleiro',
      2: 'Lateral',
      3: 'Zagueiro',
      4: 'Meia',
      5: 'Atacante',
      6: 'Técnico'
    };
    return positions[positionId] || 'Desconhecido';
  }

  // Mapear ID de posição para abreviação da posição
  private mapPositionAbrevFromId(positionId: number): string {
    const abrevs: { [key: number]: string } = {
      1: 'GOL',
      2: 'LAT',
      3: 'ZAG',
      4: 'MEI',
      5: 'ATA',
      6: 'TEC'
    };
    return abrevs[positionId] || 'DESC';
  }

  // Mapear ID de status para descrição do status
  private mapStatusFromId(statusId: number): string {
    const status: { [key: number]: string } = {
      2: 'Dúvida',
      3: 'Suspenso',
      5: 'Contundido',
      6: 'Nulo',
      7: 'Provável'
    };
    
    // Log so we can debug status mapping issues
    if (!status[statusId]) {
      console.log(`[CartolaAPI] Status ID ${statusId} não mapeado, usando 'Disponível' como padrão`);
    }
    
    return status[statusId] || 'Disponível';
  }

  // Obter nome do clube pelo ID
  private getClubNameById(clubeId: number): string {
    // Esta seria idealmente uma tabela completa de clubes
    // Aqui é apenas um exemplo, o ideal seria carregar isso da API
    const clubes: { [key: number]: string } = {
      262: 'Flamengo',
      263: 'Botafogo',
      264: 'Corinthians',
      265: 'Bahia',
      266: 'Fluminense',
      267: 'Vasco',
      275: 'Palmeiras',
      276: 'São Paulo',
      277: 'Santos',
      282: 'Atlético-MG',
      283: 'Cruzeiro',
      284: 'Grêmio',
      285: 'Internacional',
      287: 'Vitória',
      290: 'Athletico-PR',
      292: 'Sport',
      293: 'Cuiabá',
      356: 'Fortaleza',
      354: 'Ceará',
      2305: 'Mirassol',
      280: 'Bragantino',
      286: 'Juventude'
    };
    return clubes[clubeId] || 'Clube Desconhecido';
  }

  // Obter abreviação do clube pelo ID
  private getClubAbbrevById(clubeId: number): string {
    // Similar ao anterior, idealmente seria carregado da API
    const abrevs: { [key: number]: string } = {
      262: 'FLA',
      263: 'BOT',
      264: 'COR',
      265: 'BAH',
      266: 'FLU',
      267: 'VAS',
      275: 'PAL',
      276: 'SAO',
      277: 'SAN',
      282: 'CAM',
      283: 'CRU',
      284: 'GRE',
      285: 'INT',
      287: 'VIT',
      290: 'CAP',
      292: 'SPT',
      293: 'CUI',
      280: 'RBB',
      286: 'JUV',
      356: 'FOR',
      354: 'CEA',
      2305: 'MIR'
    };
    
    return abrevs[clubeId] || 'DESC';
  }

  // Invalidar o cache quando o mercado mudar de status
  invalidateCache(): void {
    this.athletesCache = null;
  }
} 