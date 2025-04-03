import { Injectable, OnDestroy, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CartolaApiService } from './cartola-api.service';
import { TeamHistoryService } from '../../features/my-team/services/team-history.service';
import { PontuacaoService } from '../../features/my-team/services/pontuacao.service';

@Injectable({
  providedIn: 'root'
})
export class MarketMonitorService implements OnDestroy {
  private cartolaApiService = inject(CartolaApiService);
  private teamHistoryService = inject(TeamHistoryService);
  private pontuacaoService = inject(PontuacaoService);
  private monitorSubscription: Subscription | null = null;
  private lastMarketStatus: number | null = null;
  private readonly POLL_INTERVAL = 5 * 60 * 1000; // 5 minutos em milissegundos
  
  // Status do mercado no Cartola
  private readonly MARKET_STATUS = {
    CLOSED: 1,      // Mercado fechado (rodada em andamento)
    OPEN: 2,        // Mercado aberto (antes da rodada)
    MAINTENANCE: 3, // Em manutenção
    EVALUATING: 4   // Avaliando (pós-rodada)
  };

  constructor() {
    this.startMonitoring();
  }

  /**
   * Inicia o monitoramento do mercado do Cartola
   */
  startMonitoring(): void {
    if (this.monitorSubscription) {
      this.monitorSubscription.unsubscribe();
    }

    // Obter o status inicial
    this.cartolaApiService.getMarketStatus().subscribe(statusResponse => {
      if (statusResponse && statusResponse.status_mercado !== undefined) {
        this.lastMarketStatus = statusResponse.status_mercado;
        console.log(`[MarketMonitor] Status inicial do mercado: ${this.getMarketStatusDescription(statusResponse.status_mercado)}`);
      }

      // Configurar o polling a cada 5 minutos
      this.monitorSubscription = interval(this.POLL_INTERVAL).pipe(
        switchMap(() => this.cartolaApiService.getMarketStatus()),
        tap(response => {
          if (!response) return;
          
          const currentStatus = response.status_mercado;
          console.log(`[MarketMonitor] Status atual do mercado: ${this.getMarketStatusDescription(currentStatus)}`);
          
          if (this.lastMarketStatus !== null && currentStatus !== this.lastMarketStatus) {
            console.log(`[MarketMonitor] Mudança de status do mercado: de ${this.getMarketStatusDescription(this.lastMarketStatus)} para ${this.getMarketStatusDescription(currentStatus)}`);
            
            // Limpar o cache de atletas quando o status do mercado mudar
            this.cartolaApiService.invalidateCache();
            
            // Se o mercado fechou, salvar o histórico dos times
            if (currentStatus === this.MARKET_STATUS.CLOSED && this.lastMarketStatus === this.MARKET_STATUS.OPEN) {
              console.log('[MarketMonitor] Mercado acabou de fechar. Salvando histórico dos times para a rodada...');
              this.salvarHistoricoTimesAoFecharMercado();
            }
          }
          this.lastMarketStatus = currentStatus;
        })
      ).subscribe();
    });
  }

  /**
   * Para o monitoramento do mercado
   */
  stopMonitoring(): void {
    if (this.monitorSubscription) {
      this.monitorSubscription.unsubscribe();
      this.monitorSubscription = null;
    }
  }

  /**
   * Salva o histórico dos times para a rodada atual quando o mercado fecha
   */
  private salvarHistoricoTimesAoFecharMercado(): void {
    // Obter a rodada atual
    this.pontuacaoService.getRodadaAtual().subscribe(rodada => {
      if (!rodada) {
        console.error('[MarketMonitor] Erro ao obter rodada atual para salvar histórico');
        return;
      }
      
      console.log(`[MarketMonitor] Salvando histórico de times para a rodada ${rodada.id}`);
      this.teamHistoryService.salvarHistoricoTimesRodada(rodada.id).subscribe(
        success => console.log(`[MarketMonitor] Histórico de times salvo com ${success ? 'sucesso' : 'falha'} para a rodada ${rodada.id}`)
      );
    });
  }

  /**
   * Retorna uma descrição textual do status do mercado
   */
  private getMarketStatusDescription(status: number): string {
    switch (status) {
      case this.MARKET_STATUS.CLOSED:
        return 'Fechado (rodada em andamento)';
      case this.MARKET_STATUS.OPEN:
        return 'Aberto (escalação permitida)';
      case this.MARKET_STATUS.MAINTENANCE:
        return 'Em manutenção';
      case this.MARKET_STATUS.EVALUATING:
        return 'Avaliando (pós-rodada)';
      default:
        return `Desconhecido (${status})`;
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
} 