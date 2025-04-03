import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AuthModule } from './core/auth/auth.module';
import { SharedModule } from './shared/shared.module';
import { ThemeModule } from './core/theme/theme.module';
import { MarketMonitorService } from './core/services/market-monitor.service';

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
    MarketMonitorService
  ]
})
export class AppModule { } 