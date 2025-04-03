import { Injectable } from '@angular/core';
import { MarketMonitorService } from './market-monitor.service';
import { TaskSchedulerService } from '../../features/my-team/services/task-scheduler.service';
import { StorageService } from './storage.service';
import { PontuacaoService } from '../../features/my-team/services/pontuacao.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppInitializerService {
  constructor(
    // Injetar o MarketMonitorService para inicializar automaticamente
    private marketMonitorService: MarketMonitorService,
    // Injetar o TaskSchedulerService para inicializar automaticamente
    private taskSchedulerService: TaskSchedulerService,
    // Injetar o StorageService para limpar cache
    private storageService: StorageService,
    // Injetar o PontuacaoService para obter rodada atual
    private pontuacaoService: PontuacaoService
  ) {}

  initialize(): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      try {
        console.log('[AppInitializer] Iniciando inicialização da aplicação...');
        
        // Não limpar cache ou forçar verificações para evitar duplicação de cálculos
        // O TaskSchedulerService já possui lógica para verificar rodadas não calculadas
        
        // Iniciar o TaskSchedulerService
        console.log('[AppInitializer] Iniciando serviços...');
        
        // Iniciar o TaskSchedulerService 
        await this.taskSchedulerService.startScheduler();
        console.log('[AppInitializer] TaskSchedulerService iniciado com sucesso');
        
        // Inicialização concluída
        resolve(true);
      } catch (error) {
        console.error('[AppInitializer] Erro na inicialização:', error);
        // Mesmo com erro, continuar a aplicação
        resolve(true);
      }
    });
  }
} 