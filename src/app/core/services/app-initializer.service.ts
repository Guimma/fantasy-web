import { Injectable } from '@angular/core';
import { MarketMonitorService } from './market-monitor.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  constructor(
    // Injetar o MarketMonitorService para inicializar automaticamente
    private marketMonitorService: MarketMonitorService
  ) {}

  initialize(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Inicialização silenciosa dos serviços
      resolve(true);
    });
  }
} 