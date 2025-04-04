import { Component, inject, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, NgForOf, NgIf, DatePipe } from '@angular/common';
import { GoogleAuthService } from '../core/services/google-auth.service';
import { AuthService } from '../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { HeaderComponent } from '../core/components/header/header.component';
import { FooterComponent } from '../core/components/footer/footer.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CartolaApiService } from '../core/services/cartola-api.service';
import { Subscription, interval } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { NotificationService } from '../core/services/notification.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClipboardModule } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule, 
    RouterModule,
    NgIf,
    NgForOf,
    DatePipe,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatRippleModule,
    MatProgressBarModule,
    HeaderComponent,
    FooterComponent,
    MatSnackBarModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    ClipboardModule
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <!-- Faixa de status do mercado -->
      <div class="market-status-bar" *ngIf="mercadoStatus" [ngClass]="getStatusClass()">
        <div class="status-content">
          <div class="status-text">
            <mat-icon class="status-icon">{{getStatusIcon()}}</mat-icon>
            <span>{{getStatusText()}}</span>
          </div>
          <div class="countdown" *ngIf="showCountdown">
            <span>{{getCountdownText()}}</span>
            <mat-progress-bar mode="determinate" [value]="getCountdownProgress()" class="status-progress"></mat-progress-bar>
          </div>
        </div>
      </div>
      
      <main class="main-content">
        <div class="home-container">
          <div class="team-info" *ngIf="userTeam">
            <h2><mat-icon>shield</mat-icon> {{ randomTeamGreeting }} {{ userTeam.name }}</h2>
          </div>
          
          <div class="card-container">
            <mat-card class="dashboard-card clickable-card" matRipple [routerLink]="['/home']">
              <div class="card-icon-container">
                <mat-icon class="card-icon">home</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Home</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Bem-vindo ao Fantasy Futebol! Esta é a página inicial.</p>
                <p *ngIf="userTeam">Time: {{ userTeam.name }}</p>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card clickable-card" matRipple [routerLink]="['/meu-time']">
              <div class="card-icon-container">
                <mat-icon class="card-icon">sports_soccer</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Meu Time</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Configure a escalação do seu time para a próxima rodada.</p>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card disabled-card" matTooltip="Em breve">
              <div class="card-icon-container">
                <mat-icon class="card-icon">shopping_cart</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Mercado</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Compre e venda jogadores para o seu time.</p>
                <div class="coming-soon-label">Em breve</div>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card disabled-card" matTooltip="Em breve">
              <div class="card-icon-container">
                <mat-icon class="card-icon">emoji_events</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Liga</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Veja sua posição na liga e acompanhe os times concorrentes.</p>
                <div class="coming-soon-label">Em breve</div>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card clickable-card" matRipple [routerLink]="['/draft']" *ngIf="isAdmin">
              <div class="card-icon-container">
                <mat-icon class="card-icon">view_list</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Draft</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Configure e gerencie o draft da temporada.</p>
                <p>Esta funcionalidade é exclusiva para administradores.</p>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </main>

      <app-footer></app-footer>
    </div>
  `,
  styles: `
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--background-color);
      padding-top: 100px; /* Match header height */
      box-sizing: border-box;
    }

    .market-status-bar {
      padding: 10px 16px;
      color: white;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      margin-top: 0;
      z-index: 5;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      font-size: 14px;
      letter-spacing: 0.3px;
    }
    
    .status-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      height: 100%;
    }
    
    .status-text {
      flex-grow: 1;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .status-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }
    
    .countdown {
      display: flex;
      flex-direction: column;
      min-width: 150px;
      flex-shrink: 0;
      width: 200px;
      border-left: 1px solid rgba(255, 255, 255, 0.3);
      padding-left: 12px;
    }
    
    .countdown span {
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
    }
    
    .status-progress {
      height: 6px;
      border-radius: 3px;
    }
    
    .market-status-open {
      background-color: #43a047; /* verde */
    }
    
    .market-status-open ::ng-deep .mat-progress-bar-fill::after {
      background-color: #c8e6c9;
    }
    
    .market-status-closed {
      background-color: #f44336; /* vermelho */
    }
    
    .market-status-closed ::ng-deep .mat-progress-bar-fill::after {
      background-color: #ffcdd2;
    }
    
    .market-status-maintenance {
      background-color: #ff9800; /* laranja */
    }
    
    .market-status-maintenance ::ng-deep .mat-progress-bar-fill::after {
      background-color: #ffe0b2;
    }
    
    .market-status-evaluating {
      background-color: #5c6bc0; /* azul indigo */
    }
    
    .market-status-evaluating ::ng-deep .mat-progress-bar-fill::after {
      background-color: #c5cae9;
    }

    .main-content {
      flex: 1;
      width: 100%;
      box-sizing: border-box;
      margin-top: 16px;
    }

    .home-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-md);
      box-sizing: border-box;
    }

    .team-info {
      margin-bottom: var(--spacing-lg);
      background-color: var(--light-color);
      padding: var(--spacing-md);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
    }

    .team-info h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--primary-color);
      font-size: 28px;
      font-weight: 700;
    }
    
    .team-info h2 mat-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
    }
    
    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
      width: 100%;
      box-sizing: border-box;
    }
    
    .dashboard-card {
      height: 100%;
      position: relative;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-md);
      transition: transform 0.3s, box-shadow 0.3s;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .clickable-card {
      cursor: pointer;
    }

    .clickable-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .disabled-card {
      opacity: 0.7;
      background-color: var(--disabled-background);
    }

    .card-icon-container {
      display: flex;
      justify-content: center;
      margin-top: var(--spacing-lg);
    }

    .card-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: var(--primary-color);
    }

    mat-card-header {
      padding: var(--spacing-md) var(--spacing-md) 0;
    }

    mat-card-content {
      padding: var(--spacing-md) !important;
    }

    .coming-soon-label {
      position: absolute;
      bottom: var(--spacing-md);
      right: var(--spacing-md);
      background-color: var(--accent-color, var(--secondary-color));
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .app-container {
        padding-top: 80px; /* Match smaller header on mobile */
      }
    
      .home-container {
        padding: var(--spacing-sm);
      }

      .card-container {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
      
      .status-content {
        flex-direction: column;
        align-items: flex-start;
        padding: 8px 0;
        gap: 8px;
      }
      
      .countdown {
        width: 100%;
        margin-top: 4px;
        border-left: none;
        padding-left: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
        padding-top: 8px;
      }
      
      .market-status-bar {
        margin-top: 0;
        padding: 12px 16px;
      }
    }

    // Font classes
    .dm-sans {
      font-family: "DM Sans", sans-serif;
      font-optical-sizing: auto;
      font-style: normal;
    }

    .dm-sans-italic {
      font-family: "DM Sans", sans-serif;
      font-optical-sizing: auto;
      font-style: italic;
    }

    // Global styles
    html, body {
      height: 100%;
      margin: 0;
      font-family: "DM Sans", sans-serif;
      font-optical-sizing: auto;
      font-style: normal;
    }

    .mat-typography {
      font: 400 14px/20px "DM Sans", sans-serif;
      letter-spacing: normal;
    }

    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 20px;
      color: var(--primary-color);
    }
    
    .admin-debug-info {
      margin: 0 auto 16px auto;
      max-width: 1200px;
      padding: 0 var(--spacing-md);
      display: flex;
      justify-content: flex-end;
    }
    
    .admin-debug-info button {
      padding: 4px 12px;
      font-size: 12px;
      opacity: 0.8;
    }
    
    .admin-debug-info button:hover {
      opacity: 1;
    }
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  protected googleAuthService = inject(GoogleAuthService);
  protected authService = inject(AuthService);
  protected router = inject(Router);
  private cartolaApiService = inject(CartolaApiService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  
  currentUser: any = null;
  userTeam: any = null;
  isAdmin = false;
  randomTeamGreeting: string = '';
  
  // Status do mercado
  mercadoStatus: any = null;
  rodadaAtual: any = null;
  statusUpdateInterval: Subscription | null = null;
  
  // Status do mercado (constantes)
  private readonly MARKET_STATUS = {
    CLOSED: 0,      // Mercado fechado
    OPEN: 1,        // Mercado aberto (antes da rodada)
    MAINTENANCE: 3, // Em manutenção
    EVALUATING: 4   // Avaliando (pós-rodada)
  };

  // Lista de frases de boas-vindas para o time
  private teamGreetings: string[] = [
    "Bem-vindo de volta",
    "🌍 O maior time do mundo é o seu:",
    "🎩 Senhoras e senhores, eis o gigante",
    "👑 Salve o",
    "🏆 Avisem que o campeão será",
    "💀 Trema mundo, chegou o poderoso",
    "👑 A lenda continua:",
    "💰 Façam suas apostas no favorito:",
    "👹 O terror dos adversários:",
    "🏆 Direto do olimpo dos campeões:",
    "💪 O invencível, o imbatível:",
    "🔰 Não é time, é seleção:",
    "😨 Mais temido que a sogra:",
    "🏆 Melhor que café na segunda-feira:",
    "👹 O pesadelo dos rivais:",
    "👑 Até os deuses aplaudem o",
    "🕒 1 minuto de silêncio para o",
    "👶 O pequeno",
    "🙌 A torcida ainda acredita no"
  ];

  ngOnInit(): void {
    this.currentUser = this.googleAuthService.currentUser;
    this.isAdmin = this.googleAuthService.isAdmin();
    this.userTeam = this.googleAuthService.getUserTeam();
    this.randomTeamGreeting = this.getRandomTeamGreeting();
    
    // Iniciar o monitoramento do status do mercado
    this.updateMarketStatus();
    this.startStatusMonitoring();
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
        tap(() => console.log('[Home] Atualizando status do mercado...')),
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
            console.log('[Home] Status do mercado atualizado:', this.mercadoStatus);
          }
        }),
        switchMap(() => this.cartolaApiService.getCurrentRound()),
        tap(response => {
          if (response) {
            this.rodadaAtual = response;
            console.log('[Home] Rodada atual atualizada:', this.rodadaAtual);
          }
        }),
        catchError(error => {
          console.error('[Home] Erro ao atualizar status do mercado:', error);
          return [];
        })
      )
      .subscribe();
  }
  
  /**
   * Retorna a classe CSS com base no status do mercado
   */
  getStatusClass(): string {
    if (!this.mercadoStatus) return '';
    
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
        return '';
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
  get showCountdown(): boolean {
    return !!this.mercadoStatus && !!this.rodadaAtual;
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

  // Método para obter uma frase aleatória de boas-vindas
  private getRandomTeamGreeting(): string {
    const randomIndex = Math.floor(Math.random() * this.teamGreetings.length);
    return this.teamGreetings[randomIndex];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return '?';
    
    const nameParts = this.currentUser.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }

  showUserDebugInfo(): void {
    const user = this.googleAuthService.currentUser;
    if (!user) {
      this.notificationService.error('No user information available');
      return;
    }
    
    // Open dialog with user information
    this.dialog.open(UserIdDialogComponent, {
      data: {
        id: user.id,
        originalId: user.originalId,
        dbId: user.dbId,
        email: user.email,
        name: user.name
      },
      width: '500px'
    });
    
    // Log to console for debugging
    console.log('User Debug Info:', {
      googleId: user.id,
      originalId: user.originalId,
      dbId: user.dbId,
      email: user.email,
      name: user.name
    });
  }
}

// User ID Dialog Component
@Component({
  selector: 'app-user-id-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ClipboardModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Informações de Usuário</h2>
    <mat-dialog-content>
      <div class="important-notice">
        <mat-icon color="primary">info</mat-icon>
        <span>
          <strong>IMPORTANTE:</strong> O administrador precisa atualizar seu ID na planilha.
          Compartilhe seu Google ID abaixo.
        </span>
      </div>
      
      <div class="user-info-field highlight">
        <div class="field-label">Google ID:</div>
        <div class="field-value">{{ data.id }}</div>
        <button 
          mat-icon-button 
          [cdkCopyToClipboard]="data.id"
          (click)="copyNotification('Google ID')"
          matTooltip="Copiar Google ID">
          <mat-icon>content_copy</mat-icon>
        </button>
      </div>
      
      <div class="user-info-field">
        <div class="field-label">Email:</div>
        <div class="field-value">{{ data.email }}</div>
      </div>
      
      <div class="user-info-field">
        <div class="field-label">Nome:</div>
        <div class="field-value">{{ data.name }}</div>
      </div>
      
      <div class="user-info-field" *ngIf="data.dbId">
        <div class="field-label">ID Banco de Dados:</div>
        <div class="field-value">{{ data.dbId }}</div>
      </div>
      
      <div class="copy-all-section">
        <button 
          mat-raised-button 
          color="primary"
          [cdkCopyToClipboard]="getAllInfoText()"
          (click)="copyNotification('todas as informações')">
          <mat-icon>content_copy</mat-icon> Copiar Todas as Informações
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .user-info-field {
      display: flex;
      margin-bottom: 16px;
      align-items: center;
    }
    
    .field-label {
      font-weight: 500;
      width: 150px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .field-value {
      flex: 1;
      font-family: monospace;
      padding: 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
      word-break: break-all;
    }
    
    .copy-all-section {
      margin-top: 24px;
      display: flex;
      justify-content: center;
    }
    
    .highlight {
      background-color: rgba(33, 150, 243, 0.05);
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
      margin: 16px 0;
    }
    
    .highlight .field-value {
      background-color: #e3f2fd;
      font-weight: bold;
    }
    
    .important-notice {
      display: flex;
      align-items: center;
      background-color: #e3f2fd;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      gap: 12px;
    }
    
    .important-notice mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }
  `
})
export class UserIdDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {}
  
  copyNotification(field: string): void {
    this.snackBar.open(`${field} copiado para a área de transferência`, 'OK', {
      duration: 2000
    });
  }
  
  getAllInfoText(): string {
    return `Google ID: ${this.data.id}
Email: ${this.data.email}
Nome: ${this.data.name}
${this.data.dbId ? 'ID Banco de Dados: ' + this.data.dbId : ''}`;
  }
} 