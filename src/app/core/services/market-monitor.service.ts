import { Injectable, OnDestroy, inject } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CartolaApiService } from './cartola-api.service';

@Injectable({
  providedIn: 'root'
})
export class MarketMonitorService implements OnDestroy {
  private cartolaApiService = inject(CartolaApiService);
  private monitorSubscription: Subscription | null = null;
  private lastMarketStatus: number | null = null;
  private readonly POLL_INTERVAL = 5 * 60 * 1000; // 5 minutos em milissegundos

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
      }

      // Configurar o polling a cada 5 minutos
      this.monitorSubscription = interval(this.POLL_INTERVAL).pipe(
        switchMap(() => this.cartolaApiService.getMarketStatus()),
        tap(response => {
          if (!response) return;
          
          const currentStatus = response.status_mercado;
          if (this.lastMarketStatus !== null && currentStatus !== this.lastMarketStatus) {
            // Limpar o cache de atletas quando o status do mercado mudar
            this.cartolaApiService.invalidateCache();
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

  ngOnDestroy(): void {
    this.stopMonitoring();
  }
} 