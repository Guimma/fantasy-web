import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { TaskSchedulerService } from '../../services/task-scheduler.service';
import { CartolaApiService } from '../../../../core/services/cartola-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-team-tasks',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="tasks-card">
      <mat-card-header>
        <mat-card-title>Gerenciador de Tarefas</mat-card-title>
        <mat-card-subtitle>
          Gerencie as atualizações e cálculos do sistema
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <!-- Status do Mercado -->
        <div class="market-status-section">
          <h3>Status do Mercado</h3>
          
          <div class="status-box" [ngClass]="getStatusClass()">
            <mat-icon>{{getStatusIcon()}}</mat-icon>
            <div class="status-info">
              <div class="status-title">{{getStatusText()}}</div>
              <div class="status-details" *ngIf="rodadaAtual">
                Rodada atual: {{rodadaAtual.rodada_atual}}
              </div>
            </div>
          </div>
          
          <div class="countdown" *ngIf="showCountdown()">
            <span>{{getCountdownText()}}</span>
            <mat-progress-bar mode="determinate" [value]="getCountdownProgress()"></mat-progress-bar>
          </div>
        </div>
        
        <mat-divider class="my-3"></mat-divider>
        
        <!-- Tarefas Manuais -->
        <div class="tasks-section">
          <h3>Tarefas Manuais</h3>
          <p class="task-description">
            Execute tarefas manualmente para atualizar dados do sistema.
          </p>
          
          <div class="tasks-grid">
            <button mat-raised-button color="primary" (click)="executarTarefa('atualizar-times')" [disabled]="isExecutingTask">
              <mat-icon>update</mat-icon>
              Atualizar Times
            </button>
            
            <button mat-raised-button color="accent" (click)="executarTarefa('calcular-pontuacoes')" [disabled]="isExecutingTask">
              <mat-icon>calculate</mat-icon>
              Calcular Pontuações
            </button>
            
            <button mat-raised-button color="warn" (click)="executarTarefa('calcular-parciais')" [disabled]="isExecutingTask || !isMercadoFechado()">
              <mat-icon>leaderboard</mat-icon>
              Calcular Parciais
            </button>
          </div>
          
          <div class="task-execution-status" *ngIf="isExecutingTask">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <span>Executando tarefa, aguarde...</span>
          </div>
        </div>
        
        <mat-divider class="my-3"></mat-divider>
        
        <!-- Status do Agendador -->
        <div class="scheduler-section">
          <h3>Agendador de Tarefas</h3>
          
          <div class="scheduler-status">
            <div class="status-indicator" [ngClass]="schedulerStatus ? 'active' : 'inactive'">
              <mat-icon>{{schedulerStatus ? 'schedule' : 'schedule_off'}}</mat-icon>
              <span>Agendador {{schedulerStatus ? 'Ativo' : 'Inativo'}}</span>
            </div>
            
            <button mat-button [color]="schedulerStatus ? 'warn' : 'primary'" (click)="toggleScheduler()">
              {{schedulerStatus ? 'Parar' : 'Iniciar'}} Agendador
            </button>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .tasks-card {
      margin-bottom: 16px;
    }
    
    .my-3 {
      margin: 24px 0;
    }
    
    .market-status-section, .tasks-section, .scheduler-section {
      margin-bottom: 16px;
    }
    
    h3 {
      font-size: 18px;
      margin-bottom: 12px;
      color: var(--primary-color);
    }
    
    .task-description {
      margin-bottom: 16px;
      color: var(--text-secondary-color);
    }
    
    .status-box {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
      color: white;
    }
    
    .status-box mat-icon {
      margin-right: 16px;
      font-size: 28px;
      height: 28px;
      width: 28px;
    }
    
    .status-info {
      flex-grow: 1;
    }
    
    .status-title {
      font-size: 16px;
      font-weight: 500;
    }
    
    .status-details {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .market-status-open {
      background-color: #43a047; /* verde */
    }
    
    .market-status-closed {
      background-color: #f44336; /* vermelho */
    }
    
    .market-status-maintenance {
      background-color: #ff9800; /* laranja */
    }
    
    .market-status-evaluating {
      background-color: #5c6bc0; /* azul indigo */
    }
    
    .market-status-unknown {
      background-color: #9e9e9e; /* cinza */
    }
    
    .countdown {
      margin-top: 8px;
    }
    
    .countdown span {
      display: block;
      margin-bottom: 4px;
      font-size: 14px;
      color: var(--text-secondary-color);
    }
    
    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .task-execution-status {
      margin-top: 16px;
      padding: 8px;
      background-color: var(--light-bg-color);
      border-radius: 4px;
    }
    
    .task-execution-status span {
      display: block;
      margin-top: 8px;
      font-size: 14px;
      text-align: center;
      color: var(--text-secondary-color);
    }
    
    .scheduler-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: var(--light-bg-color);
      border-radius: 8px;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
    }
    
    .status-indicator mat-icon {
      margin-right: 8px;
    }
    
    .status-indicator.active {
      color: #43a047;
    }
    
    .status-indicator.inactive {
      color: #f44336;
    }
    
    @media (max-width: 768px) {
      .tasks-grid {
        grid-template-columns: 1fr;
      }
      
      .scheduler-status {
        flex-direction: column;
        gap: 16px;
      }
    }
  `
})
export class TeamTasksComponent implements OnInit, OnDestroy {
  private taskSchedulerService = inject(TaskSchedulerService);
  private cartolaApiService = inject(CartolaApiService);
  
  // Status do mercado (constantes)
  private readonly MARKET_STATUS = {
    CLOSED: 1,      // Mercado fechado (rodada em andamento)
    OPEN: 2,        // Mercado aberto (antes da rodada)
    MAINTENANCE: 3, // Em manutenção
    EVALUATING: 4   // Avaliando (pós-rodada)
  };
  
  mercadoStatus: any = null;
  rodadaAtual: any = null;
  statusUpdateInterval: Subscription | null = null;
  schedulerStatus = false;
  isExecutingTask = false;
  
  ngOnInit(): void {
    // Iniciar o monitoramento do status do mercado
    this.updateMarketStatus();
    this.startStatusMonitoring();
    
    // Verificar o status do agendador
    this.schedulerStatus = this.taskSchedulerService.isRunning();
  }
  
  ngOnDestroy(): void {
    // Parar o monitoramento ao destruir o componente
    if (this.statusUpdateInterval) {
      this.statusUpdateInterval.unsubscribe();
    }
  }
  
  /**
   * Inicia o monitoramento periódico do status do mercado
   */
  private startStatusMonitoring(): void {
    // Atualizar a cada minuto
    this.statusUpdateInterval = interval(60000) // 1 minuto
      .pipe(
        tap(() => console.log('[TeamTasks] Atualizando status do mercado...')),
        switchMap(() => this.updateMarketStatus())
      )
      .subscribe();
  }
  
  /**
   * Atualiza o status atual do mercado
   */
  private updateMarketStatus(): any {
    return this.cartolaApiService.getMarketStatus()
      .pipe(
        tap(response => {
          if (response) {
            this.mercadoStatus = response;
            console.log('[TeamTasks] Status do mercado atualizado:', this.mercadoStatus);
          }
        }),
        switchMap(() => this.cartolaApiService.getCurrentRound()),
        tap(response => {
          if (response) {
            this.rodadaAtual = response;
            console.log('[TeamTasks] Rodada atual atualizada:', this.rodadaAtual);
          }
        }),
        catchError(error => {
          console.error('[TeamTasks] Erro ao atualizar status do mercado:', error);
          return [];
        })
      )
      .subscribe();
  }
  
  /**
   * Retorna a classe CSS com base no status do mercado
   */
  getStatusClass(): string {
    if (!this.mercadoStatus) return 'market-status-unknown';
    
    switch (this.mercadoStatus.status_mercado) {
      case this.MARKET_STATUS.CLOSED:
        return 'market-status-closed';
      case this.MARKET_STATUS.OPEN:
        return 'market-status-open';
      case this.MARKET_STATUS.MAINTENANCE:
        return 'market-status-maintenance';
      case this.MARKET_STATUS.EVALUATING:
        return 'market-status-evaluating';
      default:
        return 'market-status-unknown';
    }
  }
  
  /**
   * Retorna o ícone apropriado com base no status do mercado
   */
  getStatusIcon(): string {
    if (!this.mercadoStatus) return 'info';
    
    switch (this.mercadoStatus.status_mercado) {
      case this.MARKET_STATUS.CLOSED:
        return 'lock';
      case this.MARKET_STATUS.OPEN:
        return 'lock_open';
      case this.MARKET_STATUS.MAINTENANCE:
        return 'engineering';
      case this.MARKET_STATUS.EVALUATING:
        return 'analytics';
      default:
        return 'info';
    }
  }
  
  /**
   * Retorna o texto descritivo do status do mercado
   */
  getStatusText(): string {
    if (!this.mercadoStatus) return 'Carregando status do mercado...';
    
    switch (this.mercadoStatus.status_mercado) {
      case this.MARKET_STATUS.CLOSED:
        return 'Mercado fechado! Rodada em andamento.';
      case this.MARKET_STATUS.OPEN:
        return 'Mercado aberto! Escale seu time.';
      case this.MARKET_STATUS.MAINTENANCE:
        return 'Mercado em manutenção. Voltaremos em breve.';
      case this.MARKET_STATUS.EVALUATING:
        return 'Avaliando a rodada. Mercado temporariamente fechado.';
      default:
        return `Status desconhecido (${this.mercadoStatus.status_mercado})`;
    }
  }
  
  /**
   * Verifica se deve mostrar o contador
   */
  showCountdown(): boolean {
    return !!this.mercadoStatus && !!this.rodadaAtual && 
           (this.mercadoStatus.status_mercado === this.MARKET_STATUS.OPEN || 
            this.mercadoStatus.status_mercado === this.MARKET_STATUS.CLOSED);
  }
  
  /**
   * Verifica se o mercado está fechado
   */
  isMercadoFechado(): boolean {
    return this.mercadoStatus?.status_mercado === this.MARKET_STATUS.CLOSED;
  }
  
  /**
   * Retorna o texto do contador com base no status do mercado
   */
  getCountdownText(): string {
    if (!this.mercadoStatus || !this.rodadaAtual) return '';
    
    const now = new Date();
    let targetDate: Date;
    let message: string;
    
    switch (this.mercadoStatus.status_mercado) {
      case this.MARKET_STATUS.OPEN:
        // Contar até o fechamento
        targetDate = new Date(this.rodadaAtual.inicio);
        message = 'Fecha em';
        break;
      case this.MARKET_STATUS.CLOSED:
        // Contar até o término da rodada
        targetDate = new Date(this.rodadaAtual.fim);
        message = 'Termina em';
        break;
      default:
        return '';
    }
    
    // Calcular a diferença de tempo
    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return 'Atualizando...';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${message} ${diffDays}d ${diffHrs}h ${diffMins}m`;
    } else if (diffHrs > 0) {
      return `${message} ${diffHrs}h ${diffMins}m`;
    } else {
      return `${message} ${diffMins}m`;
    }
  }
  
  /**
   * Retorna o progresso do contador (0-100)
   */
  getCountdownProgress(): number {
    if (!this.mercadoStatus || !this.rodadaAtual) return 0;
    
    const now = new Date().getTime();
    let startTime: number;
    let endTime: number;
    
    switch (this.mercadoStatus.status_mercado) {
      case this.MARKET_STATUS.OPEN:
        // Período de mercado aberto
        startTime = new Date(this.mercadoStatus.fechamento.day).getTime();
        endTime = new Date(this.rodadaAtual.inicio).getTime();
        break;
      case this.MARKET_STATUS.CLOSED:
        // Período de rodada em andamento
        startTime = new Date(this.rodadaAtual.inicio).getTime();
        endTime = new Date(this.rodadaAtual.fim).getTime();
        break;
      default:
        return 0;
    }
    
    // Calcular o progresso (inverso - quanto menor o tempo restante, maior o progresso)
    if (endTime <= startTime) return 0;
    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;
    
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return Math.floor((elapsed / totalDuration) * 100);
  }
  
  /**
   * Alternar o status do agendador
   */
  toggleScheduler(): void {
    if (this.schedulerStatus) {
      this.taskSchedulerService.stopScheduler();
    } else {
      this.taskSchedulerService.startScheduler();
    }
    
    this.schedulerStatus = !this.schedulerStatus;
  }
  
  /**
   * Executar uma tarefa manualmente
   */
  executarTarefa(tarefa: 'atualizar-times' | 'calcular-pontuacoes' | 'calcular-parciais'): void {
    if (this.isExecutingTask) return;
    
    this.isExecutingTask = true;
    
    this.taskSchedulerService.executarTarefaManual(tarefa)
      .subscribe({
        next: (resultado) => {
          console.log(`[TeamTasks] Tarefa ${tarefa} executada com ${resultado ? 'sucesso' : 'falha'}`);
          this.isExecutingTask = false;
        },
        error: (error) => {
          console.error(`[TeamTasks] Erro ao executar tarefa ${tarefa}:`, error);
          this.isExecutingTask = false;
        }
      });
  }
} 