import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './core/auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { ThemeModule } from './core/theme/theme.module';
import { MarketMonitorService } from './core/services/market-monitor.service';
import { TaskSchedulerService } from './features/my-team/services/task-scheduler.service';

// Função para inicializar o TaskSchedulerService
export function initializeTaskScheduler(taskScheduler: TaskSchedulerService) {
  return () => {
    console.log('[APP_INITIALIZER] Iniciando o TaskSchedulerService...');
    return taskScheduler.startScheduler();
  };
}

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    AuthModule,
    SharedModule,
    ThemeModule
  ],
  providers: [
    // Adicionar o serviço de monitoramento do mercado para iniciar automaticamente
    MarketMonitorService,
    // Adicionar o TaskSchedulerService
    TaskSchedulerService,
    // Usar APP_INITIALIZER para iniciar o serviço
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTaskScheduler,
      deps: [TaskSchedulerService],
      multi: true
    }
  ]
})
export class AppModule { } 