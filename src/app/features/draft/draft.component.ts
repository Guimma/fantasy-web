import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil, interval, Observable, switchMap } from 'rxjs';

import { GoogleAuthService } from '../../core/services/google-auth.service';
import { DraftService } from './services/draft.service';
import { CurrentTeamComponent } from './components/current-team/current-team.component';
import { PlayerSearchComponent } from './components/player-search/player-search.component';
import { TeamListComponent } from './components/team-list/team-list.component';
import { ConfirmationDialogComponent } from './components/confirmation-dialog/confirmation-dialog.component';
import { PlayerSelectionDialogComponent } from './components/player-selection-dialog/player-selection-dialog.component';
import { NotificationService } from '../../core/services/notification.service';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../core/components/header/header.component';
import { FooterComponent } from '../../core/components/footer/footer.component';

import { DraftStatus, DraftTeam, Athlete, DraftConfig, DraftOrder } from './models/draft.model';

@Component({
  selector: 'app-draft',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule,
    MatExpansionModule,
    MatDialogModule,
    MatTabsModule,
    CurrentTeamComponent,
    PlayerSearchComponent,
    TeamListComponent,
    HeaderComponent,
    FooterComponent
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <div class="main-content">
        <!-- Admin access check -->
        <div *ngIf="!isAdmin" class="access-denied">
          <mat-card>
            <mat-card-content>
              <mat-icon color="warn">lock</mat-icon>
              <h2>Acesso Restrito</h2>
              <p>Apenas administradores podem acessar o sistema de Draft.</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Draft Interface -->
        <div *ngIf="isAdmin" class="draft-container">
          <!-- Header Section -->
          <header class="draft-header">
            <div class="draft-title">
              <h1>Sistema de Draft</h1>
              <div class="draft-status-chip" [ngClass]="draftStatusClass">
                {{ draftStatusText }}
              </div>
            </div>
            <!-- Timer centralized in header if draft is in progress -->
            <div *ngIf="draftStatus === 'in_progress'" class="timer">
              <div [ngClass]="{'timer-warning': remainingSeconds < 20, 'timer-expired': remainingSeconds <= 0}">
                {{ remainingSeconds <= 0 ? 'Tempo esgotado!' : 'Tempo restante: ' + formatTime(remainingSeconds) }}
              </div>
            </div>
            <div class="draft-controls">
              <button 
                mat-raised-button 
                color="primary" 
                *ngIf="draftStatus === 'not_started'"
                [disabled]="isLoading || teams.length < 2"
                (click)="startDraft()">
                <mat-icon>play_arrow</mat-icon> Iniciar Draft
              </button>
              <button 
                mat-raised-button 
                color="warn" 
                *ngIf="draftStatus === 'in_progress'"
                [disabled]="isLoading || !canFinishDraft()"
                (click)="confirmFinishDraft()">
                <mat-icon>done_all</mat-icon> Finalizar Draft
              </button>
              <button 
                mat-raised-button 
                color="warn"
                *ngIf="draftStatus !== 'not_started'"
                [disabled]="isLoading" 
                (click)="confirmResetDraft()"
                class="reset-button">
                <mat-icon>restart_alt</mat-icon> Reiniciar Draft
              </button>
            </div>
          </header>

          <!-- Main Content Area -->
          <div class="draft-content">
            <!-- Left Column: Current Team -->
            <section class="column current-team-column">
              <app-current-team 
                [team]="currentTeam" 
                [draftConfig]="draftConfig"
                [currentRound]="currentRound"
                [isLoading]="isLoading">
              </app-current-team>
            </section>

            <!-- Middle Column: Player Search -->
            <section class="column player-search-column">
              <app-player-search
                [availablePlayers]="availablePlayers"
                [isCurrentTeamTurn]="isCurrentTeamTurn()"
                [isLoading]="isLoading"
                [draftStatus]="draftStatus"
                (playerSelected)="selectPlayer($event)">
              </app-player-search>
            </section>

            <!-- Right Column: Team List -->
            <section class="column team-list-column">
              <app-team-list
                [teams]="teams"
                [currentTeamId]="currentTeam?.id"
                [draftOrder]="draftOrder"
                [currentOrderIndex]="currentOrderIndex"
                [draftStatus]="draftStatus"
                [showDebugInfo]="true"
                [isLoading]="isLoading">
              </app-team-list>
            </section>
          </div>

          <!-- Loading Overlay -->
          <div *ngIf="isLoading" class="loading-overlay">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
      
      <app-footer></app-footer>
    </div>
  `,
  styles: `
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--background-color);
    }
    
    .main-content {
      flex: 1;
      padding: 120px 20px 20px 20px;
    }

    .access-denied {
      display: flex;
      justify-content: center;
      align-items: center;
      
      mat-card {
        max-width: 400px;
        text-align: center;
        padding: 2rem;
        
        mat-icon {
          font-size: 48px;
          height: 48px;
          width: 48px;
          margin-bottom: 1rem;
        }
        
        h2 {
          margin-bottom: 1rem;
          color: var(--warn-color);
        }
      }
    }

    .draft-container {
      display: flex;
      flex-direction: column;
      padding: 16px;
      position: relative;
      border-radius: var(--border-radius);
    }

    .draft-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      background: white;
      padding: 16px;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
    }

    .draft-title {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      
      h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
        color: var(--primary-color);
      }
    }

    .draft-status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
    }

    .draft-status-not-started {
      background-color: #e0e0e0;
      color: #616161;
    }

    .draft-status-in-progress {
      background-color: var(--accent-color);
      color: var(--primary-color);
    }

    .draft-status-finished {
      background-color: #4caf50;
      color: white;
    }

    .timer {
      display: flex;
      justify-content: center;
      flex: 1;
    }
    
    .timer div {
      background-color: var(--primary-color);
      color: white;
      padding: 8px 16px;
      border-radius: var(--border-radius);
      font-size: 16px;
      font-weight: 500;
      min-width: 150px;
      text-align: center;
      box-shadow: var(--shadow-sm);
    }

    .timer-warning {
      background-color: #ff9800 !important;
      animation: pulse 1s infinite;
    }

    .timer-expired {
      background-color: var(--warn-color) !important;
      animation: urgent-pulse 0.5s infinite;
      font-weight: 700;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.8; }
      100% { opacity: 1; }
    }

    @keyframes urgent-pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }

    .draft-controls {
      display: flex;
      gap: 8px;
      flex: 1;
      justify-content: flex-end;
    }

    .reset-button {
      background-color: var(--warn-color);
      margin-left: 16px;
    }

    .draft-content {
      display: flex;
      flex: 1;
      gap: 16px;
      overflow: hidden;
      padding: 0 16px 16px;
      background-color: var(--background-color);
      height: calc(100vh - 300px);
      min-height: 600px;
    }

    .column {
      flex: 1;
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(0,0,0,0.06);
      max-height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .current-team-column {
      flex: 1;
      overflow: auto;
    }

    .player-search-column {
      flex: 1.2;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .team-list-column {
      flex: 0.8;
      overflow: auto;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255,255,255,0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100;
    }

    /* Correções para os campos de input */
    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field-infix {
      display: flex;
      align-items: center;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper {
      background-color: transparent !important;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper.mdc-text-field--outlined .mat-mdc-form-field-infix {
      padding-top: 16px;
      padding-bottom: 16px;
    }

    ::ng-deep .mat-mdc-form-field .mdc-notched-outline__notch {
      border-right: none;
    }

    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border-color: var(--primary-color);
    }

    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__trailing {
      border-color: var(--accent-color);
    }

    ::ng-deep .mat-mdc-form-field.mat-focused:not(.mat-form-field-invalid) .mdc-notched-outline__leading,
    ::ng-deep .mat-mdc-form-field.mat-focused:not(.mat-form-field-invalid) .mdc-notched-outline__notch,
    ::ng-deep .mat-mdc-form-field.mat-focused:not(.mat-form-field-invalid) .mdc-notched-outline__trailing {
      border-color: var(--accent-color) !important;
    }
    
    ::ng-deep .mat-mdc-form-field-label {
      color: var(--primary-color) !important;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label {
      color: var(--accent-color) !important;
    }

    @media (max-width: 1200px) {
      .draft-content {
        flex-direction: column;
        height: auto;
      }
      
      .column {
        min-height: 500px;
        max-height: none;
        margin-bottom: 20px;
      }
      
      .column:last-child {
        margin-bottom: 0;
      }
    }

    @media (max-width: 768px) {
      .draft-header {
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }
      
      .draft-controls {
        width: 100%;
        justify-content: center;
      }
    }
  `
})
export class DraftComponent implements OnInit, OnDestroy {
  // Serviços
  private authService = inject(GoogleAuthService);
  private draftService = inject(DraftService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  
  // Estado da página
  isAdmin = false;
  isLoading = true;
  draftStatus: DraftStatus = 'not_started';
  teams: DraftTeam[] = [];
  availablePlayers: Athlete[] = [];
  currentTeam: DraftTeam | null = null;
  draftConfig: DraftConfig = {
    draftId: '',
    pickTime: 60,
    requiredPositions: {
      totalPlayers: 18,
      starters: 11,
      reserves: 6,
      requiredCoach: 1
    }
  };
  draftOrder: DraftOrder[] = [];
  currentRound = 0;
  currentOrderIndex = -1;
  remainingSeconds = 0;
  private timerInterval: any;
  private destroy$ = new Subject<void>();

  constructor() {
    // Não carregar dados aqui para evitar carregamentos duplicados
  }

  ngOnInit(): void {
    // Verificar se o usuário é admin
    this.checkAdminStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimerInterval();
  }

  private checkAdminStatus(): void {
    this.isAdmin = this.authService.isAdmin();
    
    if (this.isAdmin) {
      // Garantir que carregamos o draft apenas uma vez
      this.loadDraftData();
    }
  }

  loadDraftData(): void {
    this.isLoading = true;
    
    // Limpar o timer atual para evitar que continue rodando indevidamente
    this.clearTimerInterval();
    
    // Debug log
    console.log('Iniciando carregamento de dados do draft');
    
    // Primeiro carregamos o status do draft
    this.draftService.getDraftStatus().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (status) => {
        // Debug log
        console.log('Status do draft recebido do servidor:', status);
        this.draftStatus = status;
        
        // Debug log
        console.log('Status do draft após atribuição:', this.draftStatus);
        
        // Carregar times
        this.loadTeams();
      },
      error: (error) => {
        this.handleError('Erro ao carregar status do draft', error);
        this.isLoading = false;
      }
    });
  }

  private loadTeams(): void {
    console.log('Carregando times com status do draft:', this.draftStatus);
    
    // Se o draft estiver finalizado, carregamos o histórico das escolhas
    if (this.draftStatus === 'finished') {
      console.log('Draft finalizado, carregando histórico dos times');
      
      // Primeiro carregamos a configuração para obter o ID do draft
      this.draftService.getDraftConfig().pipe(
        takeUntil(this.destroy$),
        switchMap(config => {
          console.log('Configuração do draft carregada, ID:', config.draftId);
          // Usando a nova função para carregar times a partir do histórico das escolhas
          return this.draftService.getDraftTeamHistory(config.draftId);
        })
      ).subscribe({
        next: (teams) => {
          console.log('Histórico de times carregado com sucesso, times:', teams.length);
          this.teams = teams;
          
          // Carregar jogadores disponíveis
          this.loadAvailablePlayers();
          
          // Carregar detalhes adicionais do draft
          this.loadDraftDetails();
        },
        error: (error) => {
          this.handleError('Erro ao carregar histórico de times do draft', error);
          this.isLoading = false;
        }
      });
    } else {
      console.log('Draft não finalizado, carregando times normalmente');
      
      // Para draft não finalizado, usar o comportamento original
      this.draftService.getTeams().pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (teams) => {
          console.log('Times carregados com sucesso, times:', teams.length);
          this.teams = teams;
          
          // Carregar jogadores disponíveis
          this.loadAvailablePlayers();
          
          // Se o draft estiver em andamento, carregar detalhes adicionais
          if (this.draftStatus === 'in_progress') {
            console.log('Draft em andamento, carregando detalhes');
            this.loadDraftDetails();
          } else if (this.draftStatus === 'finished') {
            console.log('Draft finalizado, carregando detalhes sem iniciar timer');
            this.loadDraftDetails();
          } else {
            console.log('Draft não iniciado, carregando apenas configuração');
            this.loadDraftConfig();
          }
        },
        error: (error) => {
          this.handleError('Erro ao carregar times', error);
          this.isLoading = false;
        }
      });
    }
  }

  private loadAvailablePlayers(): void {
    this.draftService.getAvailablePlayers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (players) => {
        this.availablePlayers = players;
      },
      error: (error) => {
        this.handleError('Erro ao carregar jogadores disponíveis', error);
      }
    });
  }

  private loadDraftDetails(): void {
    console.log('Carregando detalhes do draft, status atual:', this.draftStatus);
    
    // Se o draft já estiver finalizado, não precisamos iniciar o timer
    if (this.draftStatus === 'finished') {
      console.log('Draft já finalizado, não iniciando timer');
      this.loadDraftConfig();
      return;
    }
    
    this.draftService.getDraftOrder().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (orderData) => {
        this.draftOrder = orderData.order;
        this.currentRound = orderData.currentRound;
        this.currentOrderIndex = orderData.currentIndex;
        
        console.log('Ordem do draft carregada, round:', this.currentRound, 'index:', this.currentOrderIndex);
        
        // Atualizar o time atual
        this.updateCurrentTeam();
        
        // Carregar configuração
        this.loadDraftConfig();
        
        // Atualização: Verificar novamente o status atual do draft antes de iniciar o timer
        console.log('Verificando status atual do draft antes de iniciar timer');
        
        this.draftService.getDraftStatus().pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (currentStatus) => {
            console.log('Status atual do draft recebido:', currentStatus);
            
            // Importante: atualizar o status com o valor mais recente
            this.draftStatus = currentStatus;
            console.log('Status do draft após atualização:', this.draftStatus);
            
            // Iniciar timer apenas se estiver realmente em andamento
            if (this.draftStatus === 'in_progress') {
              console.log('Iniciando timer pois draft está em andamento');
              this.startTimer();
            } else {
              console.log('Não iniciando timer pois draft não está em andamento');
            }
          },
          error: (error) => {
            this.handleError('Erro ao verificar status atual do draft', error);
          }
        });
      },
      error: (error) => {
        this.handleError('Erro ao carregar detalhes do draft', error);
        this.isLoading = false;
      }
    });
  }

  private loadDraftConfig(): void {
    this.draftService.getDraftConfig().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (config) => {
        this.draftConfig = config;
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Erro ao carregar configuração do draft', error);
        this.isLoading = false;
      }
    });
  }

  private updateCurrentTeam(): void {
    if (this.currentOrderIndex >= 0 && this.currentOrderIndex < this.draftOrder.length) {
      const currentTeamId = this.draftOrder[this.currentOrderIndex].teamId;
      this.currentTeam = this.teams.find(team => team.id === currentTeamId) || null;
    } else {
      this.currentTeam = null;
    }
  }

  startDraft(): void {
    if (!this.isAdmin) {
      this.notificationService.error('Apenas administradores podem iniciar o draft');
      return;
    }

    this.isLoading = true;
    this.draftService.startDraft().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.success('Draft iniciado com sucesso');
        this.loadDraftData();
      },
      error: (error) => {
        console.error('Erro ao iniciar draft:', error);
        this.notificationService.error('Erro ao iniciar draft');
        this.isLoading = false;
      }
    });
  }

  confirmFinishDraft(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Finalizar Draft',
        message: 'Tem certeza que deseja finalizar o draft? Esta ação não pode ser desfeita.',
        confirmButton: 'Finalizar',
        cancelButton: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.finishDraft();
      }
    });
  }

  finishDraft(): void {
    if (!this.isAdmin) {
      this.notificationService.error('Apenas administradores podem encerrar o draft');
      return;
    }

    if (!this.canFinishDraft()) {
      this.snackBar.open('Todos os times precisam ter 18 jogadores, incluindo 11 titulares, 6 reservas e 1 técnico', 'Fechar', { duration: 5000 });
      return;
    }

    this.isLoading = true;
    this.draftService.finishDraft().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.success('Draft encerrado com sucesso');
        this.draftStatus = 'finished';
        this.currentTeam = null;
        this.clearTimerInterval();
        this.loadDraftData();
      },
      error: (error) => {
        console.error('Erro ao encerrar draft:', error);
        this.notificationService.error('Erro ao encerrar draft');
        this.isLoading = false;
      }
    });
  }

  canFinishDraft(): boolean {
    // Verificar se todos os times possuem 18 jogadores, sendo 11 titulares, 6 reservas e 1 técnico
    return this.teams.every(team => {
      // Contagem de jogadores por posição
      const positionCounts: Record<string, number> = {
        GOL: 0, 
        LAT: 0, 
        ZAG: 0, 
        MEI: 0, 
        ATA: 0, 
        TEC: 0
      };
      
      // Contar jogadores por posição
      team.players.forEach(player => {
        if (player.posicao in positionCounts) {
          positionCounts[player.posicao]++;
        }
      });
      
      // Total de jogadores
      const totalPlayers = team.players.length;
      
      // Total de jogadores excluindo técnicos
      const playersWithoutCoach = totalPlayers - positionCounts['TEC'];
      
      // Verificar condições
      return totalPlayers === this.draftConfig.requiredPositions.totalPlayers &&
             playersWithoutCoach === this.draftConfig.requiredPositions.starters + this.draftConfig.requiredPositions.reserves &&
             positionCounts['TEC'] === this.draftConfig.requiredPositions.requiredCoach;
    });
  }

  selectPlayer(player: Athlete): void {
    if (!this.currentTeam || this.draftStatus !== 'in_progress') {
      this.snackBar.open('Não é possível selecionar jogador no momento', 'Fechar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.draftService.assignPlayerToTeam(
      this.currentTeam.id,
      player.id,
      this.currentRound,
      this.currentOrderIndex
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Adicionar o jogador ao time atual
        if (this.currentTeam) {
          this.currentTeam.players.push(player);
        }
        
        // Remover o jogador da lista de disponíveis
        this.availablePlayers = this.availablePlayers.filter(p => p.id !== player.id);
        
        // Avançar para a próxima escolha
        this.moveToNextPick();
        
        this.snackBar.open(
          `${player.nome} adicionado ao time ${this.currentTeam?.name}`,
          'Fechar',
          { duration: 3000 }
        );
      },
      error: (error) => {
        this.handleError('Erro ao selecionar jogador', error);
        this.isLoading = false;
      }
    });
  }

  moveToNextPick(): void {
    this.clearTimerInterval();
    
    this.draftService.advanceDraft().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (orderData) => {
        this.currentRound = orderData.currentRound;
        this.currentOrderIndex = orderData.currentIndex;
        
        if (this.currentOrderIndex >= 0 && this.currentOrderIndex < this.draftOrder.length) {
          // Atualizar o time atual
          this.updateCurrentTeam();
          
          // Reiniciar o timer apenas se o draft ainda estiver em andamento
          if (this.draftStatus === 'in_progress') {
            this.startTimer();
          }
        } else {
          // Se chegamos ao fim do draft
          this.currentTeam = null;
          this.draftStatus = 'finished';
          // Não iniciar timer pois o draft está finalizado
          this.clearTimerInterval();
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Erro ao avançar para a próxima escolha', error);
        this.isLoading = false;
      }
    });
  }

  startTimer(): void {
    // Não iniciar o timer se o draft estiver finalizado
    if (this.draftStatus === 'finished') {
      return;
    }
    
    this.clearTimerInterval();
    this.remainingSeconds = this.draftConfig.pickTime;
    
    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      
      if (this.remainingSeconds === 0) {
        // Tempo esgotado, mas não vamos parar o timer
        this.handleTimeUp();
        // Continuamos o timer para valores negativos para manter o aviso visual
      }
    }, 1000);
  }

  clearTimerInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleTimeUp(): void {
    // Não avançar automaticamente, apenas notificar
    this.snackBar.open('Tempo esgotado! O jogador deve ser selecionado manualmente.', 'Fechar', { 
      duration: 0, // Não fecha automaticamente
      panelClass: 'time-up-notification'
    });
  }

  refreshData(): void {
    this.loadDraftData();
  }

  isCurrentTeamTurn(): boolean {
    return this.draftStatus === 'in_progress' && !!this.currentTeam;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  get draftStatusText(): string {
    switch (this.draftStatus) {
      case 'not_started': return 'Não Iniciado';
      case 'in_progress': return 'Em Andamento';
      case 'finished': return 'Finalizado';
      default: return 'Desconhecido';
    }
  }

  get draftStatusClass(): string {
    switch (this.draftStatus) {
      case 'not_started': return 'draft-status-not-started';
      case 'in_progress': return 'draft-status-in-progress';
      case 'finished': return 'draft-status-finished';
      default: return 'draft-status-not-started';
    }
  }

  confirmResetDraft(): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      disableClose: true,
      panelClass: 'confirmation-dialog',
      data: {
        title: 'Reiniciar Draft',
        message: 'ATENÇÃO: Esta ação irá reiniciar o Draft completamente, apagando todas as escolhas de jogadores e ordem de escolha. Tem certeza que deseja continuar?',
        confirmButton: 'Sim, Reiniciar Draft',
        cancelButton: 'Cancelar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.resetDraft();
      }
    });
  }

  resetDraft(): void {
    if (!this.isAdmin) {
      this.notificationService.error('Apenas administradores podem reiniciar o draft');
      return;
    }

    this.isLoading = true;
    this.clearTimerInterval();
    
    this.draftService.resetDraft().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notificationService.success('Draft reiniciado com sucesso');
        this.draftStatus = 'not_started';
        this.currentTeam = null;
        this.currentRound = 0;
        this.currentOrderIndex = -1;
        this.draftOrder = [];
        
        // Recarregar os times com seus elencos vazios
        this.loadTeams();
      },
      error: (error) => {
        console.error('Erro ao reiniciar o draft:', error);
        this.notificationService.error('Erro ao reiniciar o draft');
        this.isLoading = false;
      }
    });
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.snackBar.open(`${message}: ${error.message || 'Erro desconhecido'}`, 'Fechar', { duration: 5000 });
  }
} 