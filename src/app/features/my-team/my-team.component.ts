import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../core/components/header/header.component';
import { FooterComponent } from '../../core/components/footer/footer.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { tap, switchMap, finalize } from 'rxjs/operators';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

// Componentes personalizados
import { PlayerListComponent } from './components/player-list/player-list.component';
import { SoccerFieldComponent } from './components/soccer-field/soccer-field.component';
import { TeamNameEditorComponent } from './components/team-name-editor/team-name-editor.component';
import { FormationSelectorComponent } from './components/formation-selector/formation-selector.component';
import { PlayerCardComponent } from './components/player-card/player-card.component';

// Modelos e Serviço
import { MyTeamService } from './services/my-team.service';
import { MyTeam, MyTeamPlayer, LineupPlayer, Formation, FormationPosition, FORMATIONS } from './models/my-team.model';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    DragDropModule,
    PlayerListComponent,
    SoccerFieldComponent,
    TeamNameEditorComponent,
    FormationSelectorComponent,
    PlayerCardComponent
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <div class="main-content">
        <div class="content-container">
          <div class="page-header">
            <h1>Meu Time</h1>
            
            <div *ngIf="isLoading" class="loading-spinner">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          </div>

          <div *ngIf="myTeam" class="team-container">
            <!-- Nome do Time e Formação -->
            <div class="team-header">
              <app-team-name-editor 
                [teamName]="myTeam.name"
                [isEditing]="isEditingTeamName"
                (save)="updateTeamName($event)"
                (edit)="isEditingTeamName = $event"
                (cancel)="isEditingTeamName = false">
              </app-team-name-editor>
              
              <app-formation-selector
                [formations]="formations"
                [selectedFormation]="myTeam.formation"
                (formationChanged)="updateFormation($event)">
              </app-formation-selector>
            </div>
            
            <mat-divider class="section-divider"></mat-divider>
            
            <!-- Interface principal -->
            <div class="main-interface">
              <!-- Campo de futebol e escalação -->
              <div class="field-container">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title class="squad-title">Campo de Jogo</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <app-soccer-field
                      [formationPositions]="currentFormationPositions"
                      [players]="getPlayersInLineup()"
                      (playerDropped)="onPlayerDropped($event)">
                    </app-soccer-field>
                  </mat-card-content>
                </mat-card>
              </div>
              
              <!-- Lista de jogadores -->
              <div class="players-container">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title class="squad-title">Meu Elenco</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <!-- Departamento Médico (Injured Players) -->
                    <div *ngIf="getInjuredPlayers().length > 0" class="medical-department">
                      <div class="section-header">
                        <mat-icon>healing</mat-icon>
                        <span>Departamento Médico</span>
                      </div>
                      
                      <div class="player-cards-container">
                        <div *ngFor="let player of getInjuredPlayers()" 
                          class="player-list-item"
                          [ngClass]="{'in-lineup': player.inLineup}"
                        >
                          <app-player-card
                            [player]="player"
                            [draggable]="false"
                            (add)="addPlayerToLineup($event)"
                            (remove)="removePlayerFromLineup($event)">
                          </app-player-card>
                        </div>
                      </div>
                    </div>
                    
                    <mat-divider *ngIf="getInjuredPlayers().length > 0" class="section-divider"></mat-divider>
                    
                    <!-- Lista de jogadores regulares -->
                    <app-player-list
                      [players]="getActivePlayersForList()"
                      [draggable]="true"
                      (addPlayer)="addPlayerToLineup($event)"
                      (removePlayer)="removePlayerFromLineup($event)"
                      (dropPlayer)="onPlayerListDrop($event)">
                    </app-player-list>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
            
            <!-- Botões de ação -->
            <div class="actions-container">
              <button mat-raised-button color="primary" (click)="saveLineup()" [disabled]="isSaving">
                <mat-icon>save</mat-icon> Salvar Alterações
                <span *ngIf="formationChanged" class="unsaved-changes">(Formação alterada)</span>
              </button>
              <button mat-button (click)="clearLineup()">
                <mat-icon>clear</mat-icon> Limpar Escalação
              </button>
            </div>
          </div>
          
          <!-- Mensagem caso não tenha time -->
          <div *ngIf="!isLoading && !myTeam" class="no-team">
            <mat-card>
              <mat-card-content>
                <div class="empty-state">
                  <mat-icon>sports_soccer</mat-icon>
                  <h3>Você ainda não tem um time</h3>
                  <p>Crie seu time para começar a jogar!</p>
                  <button mat-raised-button color="primary">Criar Time</button>
                </div>
              </mat-card-content>
            </mat-card>
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
    
    .content-container {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    
    .page-header {
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .page-header h1 {
      font-size: 28px;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
    }
    
    .loading-spinner {
      display: flex;
      align-items: center;
    }
    
    .team-container {
      display: flex;
      flex-direction: column;
    }
    
    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 16px;
    }
    
    .section-divider {
      margin-bottom: 20px;
    }
    
    .main-interface {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      width: 100%;
    }
    
    .field-container {
      flex: 1;
      min-width: 0;
    }
    
    .field-container mat-card-content {
      justify-content: center;
      display: flex;
    }
    
    .field-container app-soccer-field {
      width: 100%;
      max-width: 600px;
      height: auto;
    }
    
    .players-container {
      flex: 1;
      min-width: 300px;
      max-width: 450px;
    }
    
    .players-container mat-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }
    
    .players-container mat-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: visible;
      padding-bottom: 16px !important;
    }
    
    .actions-container {
      display: flex;
      gap: 16px;
      margin-top: 20px;
    }
    
    .no-team {
      padding: 40px 0;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
    }
    
    .empty-state mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 20px;
      color: var(--primary-color);
    }
    
    .empty-state h3 {
      margin-bottom: 16px;
      color: var(--primary-color);
    }
    
    .unsaved-changes {
      font-size: 12px;
      margin-left: 8px;
      font-style: italic;
      color: rgba(255, 255, 255, 0.8);
    }
    
    /* Responsividade */
    @media (max-width: 768px) {
      .main-interface {
        flex-direction: column;
      }
      
      .team-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .players-container {
        max-width: 100%;
      }
    }

    /* Fix for vertical line in inputs */
    ::ng-deep .mat-mdc-form-field .mdc-notched-outline__notch {
      border-right: none !important;
    }
    
    ::ng-deep .mat-form-field-outline-start,
    ::ng-deep .mat-form-field-outline-gap,
    ::ng-deep .mat-form-field-outline-end {
      border-width: 1px !important;
    }
    
    ::ng-deep .mat-form-field-outline-gap {
      border-right: none !important;
    }
    
    ::ng-deep .mdc-notched-outline__notch {
      border-right-style: none !important;
      border-right-width: 0 !important;
    }
    
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border-color: var(--primary-color);
    }

    .players-container mat-card-title.squad-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    
    .medical-department {
      margin-bottom: 16px;
      width: 100%;
    }
    
    .section-header {
      background-color: #ffebee;
      color: #d32f2f;
      border-left: 4px solid #f44336;
      padding: 8px 12px;
      font-weight: 500;
      border-radius: 4px;
      margin-bottom: 8px;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-header mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .player-cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
    }
    
    .player-list-item {
      width: calc(50% - 4px);
      box-sizing: border-box;
    }
    
    @media (max-width: 480px) {
      .player-list-item {
        width: 100%;
      }
    }
  `
})
export class MyTeamComponent implements OnInit {
  myTeam: MyTeam | null = null;
  formations: Formation[] = [];
  currentFormationPositions: FormationPosition[] = [];
  isLoading = false;
  isSaving = false;
  isEditingTeamName = false;
  formationChanged = false;
  newFormationId: string | null = null;
  
  constructor(
    private myTeamService: MyTeamService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadMyTeam();
    this.loadFormations();
  }

  loadMyTeam(): void {
    this.isLoading = true;
    this.myTeamService.getMyTeam()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (team) => {
          this.myTeam = team;
          console.log('Time carregado:', this.myTeam);
          if (team?.players) {
            console.log('[MyTeam] Total de jogadores carregados:', team.players.length);
            console.log('[MyTeam] Exemplo de dados de jogador:', team.players[0]);
            
            // Verificar jogadores lesionados/contundidos como exemplo
            const injuredPlayers = team.players.filter(p => p.status === 'Contundido');
            console.log(`[MyTeam] Jogadores contundidos (${injuredPlayers.length}):`, 
              injuredPlayers.map(p => p.apelido));
              
            // Verificar outros status de jogadores
            const statusCounts: Record<string, number> = {};
            team.players.forEach(p => {
              if (p.status) {
                statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
              }
            });
            console.log('[MyTeam] Distribuição de status dos jogadores:', statusCounts);
          }
          if (team) {
            this.updateFormationPositions();
          }
        },
        error: (error) => {
          console.error('Erro ao carregar o time:', error);
          this.snackBar.open('Erro ao carregar o time. Tente novamente mais tarde.', 'OK', {
            duration: 5000
          });
        }
      });
  }

  loadFormations(): void {
    this.myTeamService.getFormations().subscribe({
      next: (formations) => {
        console.log('Formações carregadas no componente:', formations);
        this.formations = formations;
        this.updateFormationPositions();
      },
      error: (error) => {
        console.error('Erro ao carregar formações:', error);
        this.snackBar.open('Não foi possível carregar as formações disponíveis. Por favor, tente novamente mais tarde.', 'OK', {
          duration: 5000
        });
        // Não temos fallback, então manteremos a lista de formações vazia
        this.formations = [];
      }
    });
  }
  
  updateTeamName(newName: string): void {
    if (!this.myTeam) return;

    this.myTeamService.updateTeamName(this.myTeam.id, newName).subscribe({
      next: (success) => {
        if (success && this.myTeam) {
          this.myTeam.name = newName;
        }
      },
      error: (error) => {
        console.error('Erro ao atualizar nome do time:', error);
        this.snackBar.open('Erro ao atualizar o nome do time.', 'OK', {
          duration: 3000
        });
      }
    });
  }
  
  updateFormation(formationId: string): void {
    if (!this.myTeam) return;
    
    // Apenas armazenar a nova formação sem aplicar imediatamente
    this.newFormationId = formationId;
    this.formationChanged = true;
    
    // Atualizar as posições no campo para visualização
    const formation = this.formations.find(f => f.id === formationId);
    this.currentFormationPositions = formation ? formation.positions : [];
  }
  
  updateFormationPositions(): void {
    if (!this.myTeam) return;
    
    const formation = this.formations.find(f => f.id === this.myTeam?.formation);
    this.currentFormationPositions = formation ? formation.positions : [];
  }
  
  getPlayersInLineup(): MyTeamPlayer[] {
    if (!this.myTeam) return [];
    return this.myTeam.players.filter(p => p.inLineup);
  }
  
  addPlayerToLineup(player: MyTeamPlayer): void {
    if (!player.inLineup) {
      player.inLineup = true;
    }
  }
  
  removePlayerFromLineup(player: MyTeamPlayer): void {
    if (player.inLineup) {
      player.inLineup = false;
      player.position = undefined;
    }
  }
  
  onPlayerDropped(event: {player: MyTeamPlayer, positionId: string}): void {
    const { player, positionId } = event;
    player.inLineup = true;
    player.position = positionId;
  }
  
  onPlayerListDrop(event: CdkDragDrop<MyTeamPlayer[]>): void {
    // Lógica para reordenar os jogadores na lista
  }
  
  saveLineup(): void {
    if (!this.myTeam) return;
    
    // Verificar se existem formações disponíveis
    if (this.formations.length === 0) {
      this.snackBar.open('Não é possível salvar alterações sem formações disponíveis.', 'OK', {
        duration: 3000
      });
      return;
    }

    this.isSaving = true;
    
    // Sequência de operações para salvar
    let saveOperations$: Observable<boolean>;
    
    // Se a formação foi alterada, salvar primeiro a formação
    if (this.formationChanged && this.newFormationId) {
      saveOperations$ = this.myTeamService.updateTeamFormation(this.myTeam.id, this.newFormationId)
        .pipe(
          tap(success => {
            if (success && this.myTeam && this.newFormationId) {
              this.myTeam.formation = this.newFormationId;
              this.formationChanged = false;
              this.newFormationId = null;
            }
          }),
          switchMap(() => {
            // Após salvar a formação, salvar a escalação
            const lineup: LineupPlayer[] = this.myTeam!.players
              .filter(p => p.inLineup && p.position)
              .map(p => {
                const position = this.currentFormationPositions.find(pos => pos.id === p.position);
                return {
                  athleteId: p.id,
                  position: p.position!,
                  x: position?.x || 50,
                  y: position?.y || 50
                };
              });
            
            return this.myTeamService.updateTeamLineup(this.myTeam!.id, lineup);
          })
        );
    } else {
      // Se não houve alteração na formação, salvar apenas a escalação
      const lineup: LineupPlayer[] = this.myTeam.players
        .filter(p => p.inLineup && p.position)
        .map(p => {
          const position = this.currentFormationPositions.find(pos => pos.id === p.position);
          return {
            athleteId: p.id,
            position: p.position!,
            x: position?.x || 50,
            y: position?.y || 50
          };
        });
      
      saveOperations$ = this.myTeamService.updateTeamLineup(this.myTeam.id, lineup);
    }
    
    // Executar as operações de salvamento
    saveOperations$
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: (success) => {
          if (success && this.myTeam) {
            this.snackBar.open('Alterações salvas com sucesso!', 'OK', {
              duration: 3000
            });
          }
        },
        error: (error) => {
          console.error('Erro ao salvar alterações:', error);
          this.snackBar.open('Erro ao salvar alterações. Tente novamente.', 'OK', {
            duration: 3000
          });
        }
      });
  }
  
  clearLineup(): void {
    if (!this.myTeam) return;

    this.myTeam.players.forEach(p => {
      p.inLineup = false;
      p.position = undefined;
    });
    
    this.saveLineup();
  }

  // Method to count players by status
  countPlayersByStatus(status: string): number {
    if (!this.myTeam?.players) return 0;
    
    if (status === 'active') {
      // Count all players except injured ones
      return this.myTeam.players.filter(player => player.status !== 'Contundido').length;
    }
    
    return this.myTeam.players.filter(player => player.status === status).length;
  }

  // New methods for the three-column layout
  getActivePlayersForList(): MyTeamPlayer[] {
    if (!this.myTeam) return [];
    return this.myTeam.players.filter(p => p.status !== 'Contundido');
  }
  
  getInjuredPlayers(): MyTeamPlayer[] {
    if (!this.myTeam) return [];
    return this.myTeam.players.filter(p => p.status === 'Contundido');
  }
} 