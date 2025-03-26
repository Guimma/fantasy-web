import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GoogleAuthService } from '../../core/services/google-auth.service';
import { DraftService } from './services/draft.service';
import { PlayerSelectionDialogComponent } from './components/player-selection-dialog/player-selection-dialog.component';
import { TeamCardComponent } from './components/team-card/team-card.component';
import { DraftStatusComponent } from './components/draft-status/draft-status.component';
import { DraftOrderComponent } from './components/draft-order/draft-order.component';
import { DraftConfigComponent } from './components/draft-config/draft-config.component';
import { DraftTeam, DraftStatus, DraftOrder, Athlete } from './models/draft.model';

@Component({
  selector: 'app-draft',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    TeamCardComponent,
    DraftStatusComponent,
    DraftOrderComponent,
    DraftConfigComponent,
  ],
  template: `
    <div class="draft-container">
      <div class="header-section">
        <h1>Sistema de Draft</h1>
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
            color="accent" 
            *ngIf="draftStatus === 'in_progress'"
            [disabled]="isLoading"
            (click)="selectCurrentPlayer()">
            <mat-icon>person_add</mat-icon> Escolher Jogador
          </button>
          <button 
            mat-raised-button 
            color="warn" 
            *ngIf="draftStatus === 'in_progress'"
            [disabled]="isLoading || !canFinishDraft()"
            (click)="finishDraft()">
            <mat-icon>done_all</mat-icon> Finalizar Draft
          </button>
          <button 
            mat-raised-button 
            *ngIf="draftStatus === 'finished'"
            [disabled]="isLoading" 
            (click)="refreshData()">
            <mat-icon>refresh</mat-icon> Atualizar
          </button>
        </div>
      </div>

      <div class="draft-info-section">
        <app-draft-status 
          [status]="draftStatus" 
          [currentTeam]="currentTeam" 
          [currentRound]="currentRound"
          [currentOrderIndex]="currentOrderIndex">
        </app-draft-status>
        
        <app-draft-order 
          *ngIf="draftStatus !== 'not_started'"
          [draftOrder]="draftOrder"
          [currentOrderIndex]="currentOrderIndex"
          [teams]="teams">
        </app-draft-order>

        <app-draft-config
          *ngIf="draftStatus === 'not_started'"
          [teams]="teams"
          [config]="draftConfig">
        </app-draft-config>
      </div>

      <div *ngIf="isLoading" class="loading-overlay">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Carregando...</p>
      </div>

      <div *ngIf="!isLoading && draftStatus !== 'not_started'" class="teams-grid">
        <app-team-card 
          *ngFor="let team of teams" 
          [team]="team"
          [isCurrentTeam]="team.id === currentTeam?.id && draftStatus === 'in_progress'">
        </app-team-card>
      </div>
    </div>
  `,
  styles: `
    .draft-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    h1 {
      margin: 0;
      color: #3f51b5;
    }
    
    .draft-controls {
      display: flex;
      gap: 10px;
    }
    
    .draft-info-section {
      margin-bottom: 30px;
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
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
      z-index: 10;
    }
    
    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
      }
      
      .draft-controls {
        width: 100%;
        flex-wrap: wrap;
      }
    }
  `
})
export class DraftComponent implements OnInit {
  // Serviços injetados
  private authService = inject(GoogleAuthService);
  private draftService = inject(DraftService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Estado do componente
  isLoading = false;
  draftStatus: DraftStatus = 'not_started';
  teams: DraftTeam[] = [];
  draftOrder: DraftOrder[] = [];
  currentRound = 0;
  currentOrderIndex = -1;
  currentTeam: DraftTeam | null = null;
  draftConfig = {
    draftId: '',
    pickTime: 60,
    requiredPositions: {
      totalPlayers: 18,
      starters: 11,
      reserves: 6,
      requiredCoach: 1
    }
  };

  ngOnInit(): void {
    this.loadDraftData();
  }

  loadDraftData(): void {
    this.isLoading = true;
    this.draftService.getDraftStatus().subscribe({
      next: (status) => {
        this.draftStatus = status;
        
        // Carregar times
        this.draftService.getTeams().subscribe({
          next: (teams) => {
            this.teams = teams;
            
            // Se o draft estiver em andamento ou finalizado, carregar a ordem
            if (this.draftStatus !== 'not_started') {
              this.loadDraftOrderAndConfig();
            } else {
              this.isLoading = false;
            }
          },
          error: (error) => {
            this.handleError('Erro ao carregar times', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.handleError('Erro ao carregar status do draft', error);
        this.isLoading = false;
      }
    });
  }

  loadDraftOrderAndConfig(): void {
    this.draftService.getDraftOrder().subscribe({
      next: (orderData) => {
        this.draftOrder = orderData.order;
        this.currentRound = orderData.currentRound;
        this.currentOrderIndex = orderData.currentIndex;
        
        if (this.currentOrderIndex >= 0 && this.currentOrderIndex < this.draftOrder.length) {
          const currentTeamId = this.draftOrder[this.currentOrderIndex].teamId;
          this.currentTeam = this.teams.find(team => team.id === currentTeamId) || null;
        }
        
        this.draftService.getDraftConfig().subscribe({
          next: (config) => {
            this.draftConfig = config;
            this.isLoading = false;
          },
          error: (error) => {
            this.handleError('Erro ao carregar configuração do draft', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        this.handleError('Erro ao carregar ordem do draft', error);
        this.isLoading = false;
      }
    });
  }

  startDraft(): void {
    if (this.teams.length < 2) {
      this.snackBar.open('É necessário pelo menos 2 times para iniciar o draft', 'Fechar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.draftService.startDraft().subscribe({
      next: () => {
        this.draftStatus = 'in_progress';
        this.loadDraftOrderAndConfig();
        this.snackBar.open('Draft iniciado com sucesso!', 'Fechar', { duration: 3000 });
      },
      error: (error) => {
        this.handleError('Erro ao iniciar o draft', error);
        this.isLoading = false;
      }
    });
  }

  selectCurrentPlayer(): void {
    if (!this.currentTeam) {
      this.snackBar.open('Nenhum time selecionado para escolha', 'Fechar', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.draftService.getAvailablePlayers().subscribe({
      next: (players) => {
        this.isLoading = false;
        
        const dialogRef = this.dialog.open(PlayerSelectionDialogComponent, {
          width: '800px',
          data: {
            team: this.currentTeam,
            availablePlayers: players,
            requiredPositions: this.draftConfig.requiredPositions
          }
        });

        dialogRef.afterClosed().subscribe(selectedPlayer => {
          if (selectedPlayer) {
            this.assignPlayerToTeam(selectedPlayer);
          }
        });
      },
      error: (error) => {
        this.handleError('Erro ao carregar jogadores disponíveis', error);
        this.isLoading = false;
      }
    });
  }

  assignPlayerToTeam(player: Athlete): void {
    if (!this.currentTeam) return;
    
    this.isLoading = true;
    this.draftService.assignPlayerToTeam(
      this.currentTeam.id, 
      player.id, 
      this.currentRound, 
      this.currentOrderIndex
    ).subscribe({
      next: () => {
        // Atualizar o time atual com o novo jogador
        if (this.currentTeam) {
          this.currentTeam.players.push(player);
        }
        
        // Avançar para a próxima escolha
        this.moveToNextPick();
        
        this.snackBar.open(
          `${player.nome} adicionado ao time ${this.currentTeam?.name}`, 
          'Fechar', 
          { duration: 3000 }
        );
      },
      error: (error) => {
        this.handleError('Erro ao atribuir jogador ao time', error);
        this.isLoading = false;
      }
    });
  }

  moveToNextPick(): void {
    this.isLoading = true;
    this.draftService.advanceDraft().subscribe({
      next: (orderData) => {
        this.currentRound = orderData.currentRound;
        this.currentOrderIndex = orderData.currentIndex;
        
        if (this.currentOrderIndex >= 0 && this.currentOrderIndex < this.draftOrder.length) {
          const currentTeamId = this.draftOrder[this.currentOrderIndex].teamId;
          this.currentTeam = this.teams.find(team => team.id === currentTeamId) || null;
        } else {
          // Se chegarmos ao fim do draft
          this.currentTeam = null;
          this.draftStatus = 'finished';
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Erro ao avançar para próxima escolha', error);
        this.isLoading = false;
      }
    });
  }

  finishDraft(): void {
    if (!this.canFinishDraft()) {
      this.snackBar.open('Todos os times precisam atingir o mínimo de jogadores por posição', 'Fechar', { duration: 5000 });
      return;
    }

    this.isLoading = true;
    this.draftService.finishDraft().subscribe({
      next: () => {
        this.draftStatus = 'finished';
        this.currentTeam = null;
        this.snackBar.open('Draft finalizado com sucesso!', 'Fechar', { duration: 3000 });
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Erro ao finalizar draft', error);
        this.isLoading = false;
      }
    });
  }

  canFinishDraft(): boolean {
    // Verifica se todos os times têm o mínimo de jogadores por posição
    return this.teams.every(team => {
      // Contagem de jogadores por posição
      const positionCounts: Record<string, number> = {
        GOL: 0, LAT: 0, ZAG: 0, MEI: 0, ATA: 0, TEC: 0
      };
      
      // Contar jogadores por posição
      team.players.forEach(player => {
        if (player.posicao in positionCounts) {
          positionCounts[player.posicao]++;
        }
      });
      
      // Verificar se todas as posições atendem aos requisitos mínimos
      return Object.entries(this.draftConfig.requiredPositions).every(
        ([position, required]) => positionCounts[position] >= required
      );
    });
  }

  refreshData(): void {
    this.loadDraftData();
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.snackBar.open(`${message}: ${error.message || 'Erro desconhecido'}`, 'Fechar', {
      duration: 5000
    });
  }
} 