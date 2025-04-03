import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../core/components/header/header.component';
import { FooterComponent } from '../../core/components/footer/footer.component';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';
import { tap, switchMap, finalize } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

// Componentes personalizados
import { PlayerListComponent } from './components/player-list/player-list.component';
import { SoccerFieldComponent } from './components/soccer-field/soccer-field.component';
import { TeamNameEditorComponent } from './components/team-name-editor/team-name-editor.component';
import { FormationSelectorComponent } from './components/formation-selector/formation-selector.component';
import { PlayerCardComponent } from './components/player-card/player-card.component';

// Modelos e Serviço
import { MyTeamService } from './services/my-team.service';
import { PontuacaoService } from './services/pontuacao.service';
import { TaskSchedulerService } from './services/task-scheduler.service';
import { MyTeam, MyTeamPlayer, LineupPlayer, Formation, FormationPosition, FORMATIONS } from './models/my-team.model';
import { Rodada, PontuacaoRodada, DetalhePontuacaoAtleta } from './models/pontuacao.model';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatBadgeModule,
    MatListModule,
    MatTooltipModule,
    DragDropModule,
    PlayerListComponent,
    SoccerFieldComponent,
    TeamNameEditorComponent,
    FormationSelectorComponent,
    PlayerCardComponent,
    MatExpansionModule,
    MatBadgeModule,
    MatListModule,
    MatTooltipModule
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <div class="main-content">
        <div class="content-container">
          <div class="page-header">
            <div class="header-title-area">
              <div class="title-text">
                <h1>Meu Time</h1>
                <p class="subtitle">Gerencie seu elenco e acompanhe o desempenho</p>
              </div>
              
              <div class="page-actions">
                <!-- No buttons here after removal -->
              </div>
            </div>
            
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
              <!-- Coluna 1: Pontuações do time nas rodadas -->
              <div class="scores-container">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title class="squad-title">Pontuações</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <!-- Pontuação parcial da rodada atual (se em andamento) -->
                    <div *ngIf="rodadaAtual && rodadaAtual.status === 'em_andamento'" class="current-round-section">
                      <div class="section-header current-round">
                        <mat-icon>access_time</mat-icon>
                        <span>{{ rodadaAtual.nome }} (Em andamento)</span>
                      </div>
                      
                      <div *ngIf="isLoadingPontuacoes" class="loading-container">
                        <mat-spinner diameter="30"></mat-spinner>
                        <span>Calculando pontuação parcial...</span>
                      </div>
                      
                      <div *ngIf="!isLoadingPontuacoes && parcialRodadaAtual" class="score-card parcial">
                        <div class="score-value">
                          <span class="score">{{ parcialRodadaAtual.pontuacao_total | number:'1.2-2' }}</span>
                          <span class="parcial-label">pontos (parcial)</span>
                        </div>
                        <div class="score-details">
                          <span>{{ parcialRodadaAtual.atletas_pontuados.length }} jogadores pontuados</span>
                          <button mat-icon-button (click)="loadParcialRodadaAtual()" matTooltip="Atualizar pontuação parcial">
                            <mat-icon>refresh</mat-icon>
                          </button>
                        </div>
                      </div>
                      
                      <div *ngIf="!isLoadingPontuacoes && !parcialRodadaAtual" class="empty-state">
                        <span>Nenhum jogador pontuado ainda nesta rodada.</span>
                        <button mat-button color="primary" (click)="loadParcialRodadaAtual()">
                          <mat-icon>refresh</mat-icon> Atualizar
                        </button>
                      </div>
                    </div>
                    
                    <!-- Rodadas anteriores -->
                    <div class="past-rounds-section">
                      <div class="section-header">
                        <mat-icon>history</mat-icon>
                        <span>Rodadas Anteriores</span>
                      </div>
                      
                      <div *ngIf="isLoadingPontuacoes" class="loading-container">
                        <mat-spinner diameter="30"></mat-spinner>
                        <span>Carregando pontuações...</span>
                      </div>
                      
                      <div *ngIf="!isLoadingPontuacoes && pontuacoesRodadas.length === 0" class="empty-state">
                        <span>Nenhuma pontuação encontrada.</span>
                      </div>
                      
                      <mat-accordion *ngIf="!isLoadingPontuacoes && pontuacoesRodadas.length > 0">
                        <mat-expansion-panel 
                          *ngFor="let pontuacao of pontuacoesRodadas" 
                          [expanded]="rodadaSelecionadaId === pontuacao.rodada_id"
                          (opened)="selecionarRodada(pontuacao.rodada_id)"
                        >
                          <mat-expansion-panel-header>
                            <mat-panel-title>
                              Rodada {{ pontuacao.rodada_id }}
                            </mat-panel-title>
                            <mat-panel-description>
                              {{ pontuacao.pontuacao_total | number:'1.2-2' }} pts
                            </mat-panel-description>
                          </mat-expansion-panel-header>
                          
                          <!-- Conteúdo expandido com detalhes da pontuação -->
                          <div class="round-details">
                            <div *ngIf="isLoadingDetalhes" class="loading-container">
                              <mat-spinner diameter="24"></mat-spinner>
                              <span>Carregando detalhes...</span>
                            </div>
                            
                            <div *ngIf="!isLoadingDetalhes && detalhesRodadaSelecionada.length > 0" class="player-details-container">
                              <!-- Formation summary -->
                              <div class="formation-summary">
                                <div class="round-summary-header">
                                  <mat-icon class="summary-icon">emoji_events</mat-icon>
                                  <span>Formação utilizada: {{ displayFormationFromDetalhes(detalhesRodadaSelecionada, pontuacao.rodada_id) }}</span>
                                </div>
                                <div class="total-points">
                                  <span class="points-label">Pontuação total:</span>
                                  <span class="points-value">{{ pontuacao.pontuacao_total | number:'1.2-2' }} pts</span>
                                </div>
                              </div>
                              
                              <!-- Considered players section -->
                              <div class="players-section considered">
                                <div class="section-header">
                                  <mat-icon class="header-icon">check_circle</mat-icon>
                                  <span>Jogadores considerados na pontuação ({{ getConsideredPlayers(detalhesRodadaSelecionada).length }})</span>
                                </div>
                                
                                <div class="players-grid">
                                  <div *ngFor="let player of getConsideredPlayers(detalhesRodadaSelecionada)" 
                                       class="player-card considered">
                                    <div class="player-header">
                                      <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
                                        {{ player.posicaoAbreviacao }}
                                      </span>
                                      <span class="player-score" [ngClass]="{'negative': player.pontuacao < 0, 'positive': player.pontuacao > 0}">
                                        {{ player.pontuacao | number:'1.2-2' }}
                                      </span>
                                    </div>
                                    <div class="player-content">
                                      <img [src]="getTeamLogoUrl(player.clubeAbreviacao)" 
                                           [alt]="player.clube"
                                           class="player-club-logo"
                                           (error)="handleLogoError($event)">
                                      <span class="player-name" [matTooltip]="player.apelido">
                                        {{ player.apelido }}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <!-- Non-considered players section -->
                              <ng-container *ngIf="getNonConsideredPlayers(detalhesRodadaSelecionada).length > 0">
                                <div class="players-section not-considered">
                                  <div class="section-header">
                                    <mat-icon class="header-icon">do_not_disturb_on</mat-icon>
                                    <span>Jogadores fora da pontuação ({{ getNonConsideredPlayers(detalhesRodadaSelecionada).length }})</span>
                                  </div>
                                  
                                  <div class="players-grid">
                                    <div *ngFor="let player of getNonConsideredPlayers(detalhesRodadaSelecionada)" 
                                         class="player-card not-considered">
                                      <div class="player-header">
                                        <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
                                          {{ player.posicaoAbreviacao }}
                                        </span>
                                        <div class="player-status" 
                                             [matTooltip]="player.entrou_em_campo ? 'Entrou em campo, mas não considerado na formação' : 'Não entrou em campo'">
                                          {{ player.entrou_em_campo ? 'Fora da formação' : 'Não jogou' }}
                                        </div>
                                      </div>
                                      <div class="player-content">
                                        <img [src]="getTeamLogoUrl(player.clubeAbreviacao)" 
                                             [alt]="player.clube"
                                             class="player-club-logo"
                                             (error)="handleLogoError($event)">
                                        <span class="player-name" [matTooltip]="player.apelido">
                                          {{ player.apelido }}
                                        </span>
                                        <span class="player-score" [ngClass]="{'negative': player.pontuacao < 0, 'positive': player.pontuacao > 0}">
                                          {{ player.pontuacao | number:'1.2-2' }}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </ng-container>
                            </div>
                            
                            <div *ngIf="!isLoadingDetalhes && detalhesRodadaSelecionada.length === 0" class="empty-state">
                              <span>Nenhum detalhe disponível.</span>
                            </div>
                          </div>
                        </mat-expansion-panel>
                      </mat-accordion>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
              
              <!-- Coluna 2: Campo de futebol e escalação -->
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
              
              <!-- Coluna 3: Lista de jogadores -->
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
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }
    
    .page-header {
      margin-bottom: 28px;
      display: flex;
      flex-direction: column;
    }
    
    .header-title-area {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .title-container {
      display: flex;
      align-items: center;
    }
    
    .title-text h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: var(--primary-color);
      letter-spacing: -0.5px;
    }
    
    .title-text .subtitle {
      font-size: 16px;
      color: #666;
      margin: 0;
      font-weight: 400;
    }
    
    .page-actions {
      display: flex;
      gap: 8px;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    
    .team-container {
      background-color: white;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      overflow: hidden;
      position: relative;
    }
    
    .team-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(to right, var(--primary-color), var(--accent-color, #7b1fa2));
    }
    
    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
      position: relative;
    }
    
    .section-divider {
      margin-bottom: 28px;
      border-color: rgba(0, 0, 0, 0.05);
    }
    
    mat-card {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease-in-out;
    }
    
    mat-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.09);
    }
    
    mat-card-header {
      background: linear-gradient(to right, rgba(var(--primary-color-rgb), 0.05), transparent);
      padding: 16px 16px 8px 16px;
    }
    
    .squad-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-color);
      letter-spacing: 0.3px;
      position: relative;
      padding-left: 8px;
      margin-bottom: 8px !important;
    }
    
    .squad-title::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 18px;
      background-color: var(--primary-color);
      border-radius: 3px;
    }
    
    .actions-container {
      display: flex;
      gap: 16px;
      margin-top: 28px;
    }
    
    .actions-container button {
      padding: 8px 16px;
      border-radius: 8px;
    }
    
    .main-interface {
      display: grid;
      grid-template-columns: minmax(300px, 1fr) minmax(350px, 2fr) minmax(280px, 1fr);
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
      min-width: 280px;
      max-width: 380px;
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
    
    /* Estilos para a coluna de pontuações */
    .scores-container {
      width: 320px;
      min-width: 320px;
    }
    
    .scores-container mat-card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    
    .scores-container mat-card-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      max-height: none;
      overflow-y: visible;
    }
    
    .section-header {
      background-color: rgba(0, 0, 0, 0.04);
      padding: 8px 12px;
      font-weight: 500;
      border-radius: 4px;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    
    .section-header.current-round {
      background-color: #e3f2fd;
      color: #1976d2;
      border-left: 4px solid #1976d2;
    }
    
    .section-header mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }
    
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 16px;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .score-card {
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .score-card.parcial {
      background-color: #f5f5f5;
    }
    
    .score-value {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .score {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
    }
    
    .parcial-label {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .score-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.67);
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      text-align: center;
      color: rgba(0, 0, 0, 0.54);
      gap: 8px;
    }
    
    .round-details {
      margin-top: 8px;
    }
    
    .player-score-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .player-info {
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 80%;
    }
    
    .player-club-logo {
      width: 20px;
      height: 20px;
      object-fit: contain;
      background-color: transparent;
      padding: 1px;
    }
    
    .player-position {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      min-width: 30px;
      text-align: center;
      color: white;
      background-color: var(--primary-color);
    }
    
    .player-position[data-position="GOL"] {
      background-color: #ffb74d;
    }

    .player-position[data-position="ZAG"] {
      background-color: #4fc3f7;
    }

    .player-position[data-position="LAT"] {
      background-color: #7986cb;
    }

    .player-position[data-position="MEI"] {
      background-color: #81c784;
    }

    .player-position[data-position="ATA"] {
      background-color: #e57373;
    }

    .player-position[data-position="TEC"] {
      background-color: #9575cd;
    }
    
    .player-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .player-club {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .player-score {
      font-weight: 700;
      font-size: 15px;
      background-color: rgba(0,0,0,0.05);
      padding: 2px 8px;
      border-radius: 4px;
      min-width: 45px;
      text-align: center;
    }
    
    .player-score.positive {
      color: #4caf50;
      background-color: rgba(76, 175, 80, 0.1);
    }
    
    .player-score.negative {
      color: #f44336;
      background-color: rgba(244, 67, 54, 0.1);
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
    
    /* Estilos para o departamento médico */
    .medical-department {
      margin-bottom: 16px;
      width: 100%;
    }
    
    .medical-department .section-header {
      background-color: #ffebee;
      color: #d32f2f;
      border-left: 4px solid #f44336;
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
    
    /* Responsividade */
    @media (max-width: 1200px) {
      .main-interface {
        grid-template-columns: 1fr 1fr;
      }
      
      .scores-container {
        grid-column: span 2;
        order: 3;
        width: 100%;
      }
      
      .field-container {
        order: 1;
      }
      
      .players-container {
        order: 2;
      }
    }
    
    @media (max-width: 768px) {
      .main-interface {
        flex-direction: column;
      }
      
      .team-header {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .field-container, 
      .players-container,
      .scores-container {
        max-width: 100%;
        width: 100%;
      }
      
      .players-container {
        order: 2;
      }
      
      .scores-container {
        order: 3;
      }
    }
    
    @media (max-width: 480px) {
      .player-list-item {
        width: 100%;
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

    .players-container mat-card-title.squad-title,
    .field-container mat-card-title.squad-title,
    .scores-container mat-card-title.squad-title {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 16px;
      letter-spacing: 0.5px;
    }
    
    .player-name.not-considered {
      text-decoration: line-through;
      color: rgba(0, 0, 0, 0.6);
    }

    .player-details-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .formation-summary {
      background-color: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .round-summary-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: var(--primary-color);
    }

    .summary-icon {
      color: #ffc107;
    }

    .total-points {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }

    .points-label {
      font-weight: 500;
    }

    .points-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary-color);
    }

    .players-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      padding: 8px 12px;
      border-radius: 6px;
    }

    .players-section.considered .section-header {
      background-color: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
      border-left: 3px solid #2e7d32;
    }

    .players-section.not-considered .section-header {
      background-color: rgba(158, 158, 158, 0.1);
      color: #616161;
      border-left: 3px solid #616161;
    }

    .header-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
    }

    .players-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
      padding: 4px;
    }

    .player-card {
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }

    .player-card:hover {
      transform: translateY(-2px);
    }

    .player-card.considered {
      background-color: white;
      border: 1px solid #e0e0e0;
    }

    .player-card.not-considered {
      background-color: #f5f5f5;
      border: 1px solid #e0e0e0;
      opacity: 0.85;
    }

    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      background-color: #f5f5f5;
    }

    .player-content {
      display: flex;
      align-items: center;
      padding: 10px;
      gap: 8px;
    }

    .player-position {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      min-width: 30px;
      text-align: center;
      color: white;
    }

    .player-status {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 10px;
      background-color: #bdbdbd;
      color: white;
      white-space: nowrap;
    }

    .player-club-logo {
      width: 24px;
      height: 24px;
      object-fit: contain;
      background-color: transparent;
    }

    .player-name {
      flex: 1;
      font-weight: 500;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .player-score {
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background-color: #f5f5f5;
      font-size: 14px;
    }

    .player-score.positive {
      color: #4caf50;
      background-color: rgba(76, 175, 80, 0.1);
    }

    .player-score.negative {
      color: #f44336;
      background-color: rgba(244, 67, 54, 0.1);
    }

    @media (max-width: 600px) {
      .players-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
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
  
  // Novas propriedades para pontuações
  rodadaAtual: Rodada | null = null;
  rodadasAnteriores: Rodada[] = [];
  pontuacoesRodadas: PontuacaoRodada[] = [];
  detalhesRodadaSelecionada: DetalhePontuacaoAtleta[] = [];
  rodadaSelecionadaId: number | null = null;
  isLoadingPontuacoes = false;
  isLoadingDetalhes = false;
  parcialRodadaAtual: PontuacaoRodada | null = null;
  
  constructor(
    private myTeamService: MyTeamService,
    private pontuacaoService: PontuacaoService,
    private taskSchedulerService: TaskSchedulerService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    console.log('[MyTeamComponent] Inicializando componente...');
    
    // Carregar formações disponíveis
    this.loadFormations();
    
    // Primeiro carregar o time
    this.loadMyTeam();
    
    // Depois carregar as rodadas (a função loadRodadas carregará as pontuações após obter as rodadas)
    this.loadRodadas();
  }

  loadMyTeam(): void {
    console.log('[MyTeamComponent] Carregando dados do time...');
    this.isLoading = true;
    
    this.myTeamService.getMyTeam().subscribe({
      next: (team: MyTeam | null) => {
        console.log('[MyTeamComponent] Time recebido:', team);
        this.myTeam = team;
        this.isLoading = false;
        
        if (team) {
          this.updateFormationPositions();
          console.log('[MyTeamComponent] Time carregado com sucesso. ID:', team.id);
          
          // Se as rodadas já estiverem carregadas, carregar pontuações
          if (this.rodadaAtual) {
            console.log('[MyTeamComponent] Rodada atual já está definida, carregando pontuações...');
            
            if (this.rodadaAtual.status === 'em_andamento') {
              console.log('[MyTeamComponent] Carregando pontuação parcial da rodada atual...');
              this.loadParcialRodadaAtual();
            }
            
            console.log('[MyTeamComponent] Carregando pontuações das rodadas anteriores...');
            this.loadPontuacoesTime();
          } else {
            console.log('[MyTeamComponent] Rodada atual ainda não está definida. Pontuações serão carregadas depois.');
          }
        } else {
          console.log('[MyTeamComponent] Não foi encontrado um time para este usuário.');
        }
      },
      error: (error: any) => {
        console.error('[MyTeamComponent] Erro ao carregar time:', error);
        this.isLoading = false;
        this.myTeam = null;
        this.snackBar.open('Erro ao carregar seu time. Por favor, tente novamente.', 'OK', { duration: 5000 });
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

  // Métodos para lidar com a pontuação das rodadas
  loadRodadas(): void {
    console.log('[MyTeamComponent] Carregando rodada atual...');
    this.pontuacaoService.getRodadaAtual().subscribe({
      next: (rodada: Rodada) => {
        console.log('[MyTeamComponent] Rodada atual recebida:', rodada);
        this.rodadaAtual = rodada;
        
        // Carregar rodadas anteriores
        console.log('[MyTeamComponent] Carregando rodadas anteriores a', rodada.id);
        this.loadRodadasAnteriores(rodada.id);
        
        // Se o time já estiver carregado, carregar pontuações
        if (this.myTeam) {
          if (rodada.status === 'em_andamento') {
            console.log('[MyTeamComponent] Rodada atual em andamento, carregando parcial...');
            this.loadParcialRodadaAtual();
          }
          
          // Carregar pontuações das rodadas anteriores
          console.log('[MyTeamComponent] Carregando pontuações das rodadas anteriores...');
          this.loadPontuacoesTime();
        }
      },
      error: (error: any) => {
        console.error('[MyTeamComponent] Erro ao carregar rodada atual:', error);
        // Fallback para uma rodada padrão
        this.rodadaAtual = {
          id: 1,
          nome: 'Rodada 1',
          inicio: new Date(),
          fim: new Date(),
          status: 'em_andamento'
        };
        this.loadRodadasAnteriores(this.rodadaAtual.id);
      }
    });
  }

  loadRodadasAnteriores(rodadaAtualId: number): void {
    console.log('[MyTeamComponent] Definindo rodadas anteriores...');
    this.rodadasAnteriores = [];
    
    // Incluir todas as rodadas anteriores à atual
    // Em um cenário real, buscaria da API, mas para simplificação, criamos baseado no ID atual
    for (let i = 1; i < rodadaAtualId; i++) {
      const rodadaAnterior: Rodada = {
        id: i,
        nome: `Rodada ${i}`,
        inicio: new Date(),
        fim: new Date(),
        status: 'finalizada' // Todas as rodadas anteriores são consideradas finalizadas
      };
      
      this.rodadasAnteriores.push(rodadaAnterior);
      console.log(`[MyTeamComponent] Adicionada rodada anterior: ${i}`);
    }
    
    // Ordenar das mais recentes para as mais antigas
    this.rodadasAnteriores.reverse();
    console.log(`[MyTeamComponent] ${this.rodadasAnteriores.length} rodadas anteriores foram definidas.`);
  }

  loadPontuacoesTime(): void {
    if (!this.myTeam) {
      console.log('[MyTeamComponent] Não há time carregado. Impossível carregar pontuações.');
      return;
    }
    
    console.log('[MyTeamComponent] Iniciando carregamento de pontuações para o time:', this.myTeam.id);
    console.log('[MyTeamComponent] Rodadas anteriores disponíveis:', this.rodadasAnteriores.length);
    
    this.isLoadingPontuacoes = true;
    this.pontuacoesRodadas = [];
    
    // Se não houver rodadas anteriores
    if (this.rodadasAnteriores.length === 0) {
      console.log('[MyTeamComponent] Não há rodadas anteriores para carregar pontuações.');
      this.isLoadingPontuacoes = false;
      return;
    }
    
    // Criar um array de observables para cada rodada anterior
    const observables = this.rodadasAnteriores.map(rodada => {
      console.log(`[MyTeamComponent] Preparando para buscar pontuação da rodada ${rodada.id}`);
      return this.pontuacaoService.getPontuacaoTimeRodada(this.myTeam!.id, rodada.id);
    });
    
    // Processar os resultados
    let completedRequests = 0;
    observables.forEach((obs, index) => {
      const rodadaId = this.rodadasAnteriores[index].id;
      console.log(`[MyTeamComponent] Buscando pontuação da rodada ${rodadaId}...`);
      
      obs.subscribe({
        next: (pontuacao: PontuacaoRodada | null) => {
          console.log(`[MyTeamComponent] Resposta recebida para rodada ${rodadaId}:`, pontuacao ? 'Pontuação encontrada' : 'Nenhuma pontuação');
          
          if (pontuacao) {
            this.pontuacoesRodadas.push(pontuacao);
            console.log(`[MyTeamComponent] Pontuação da rodada ${rodadaId} adicionada. Total até agora: ${this.pontuacoesRodadas.length}`);
          }
          
          completedRequests++;
          if (completedRequests === observables.length) {
            this.isLoadingPontuacoes = false;
            // Ordenar por rodada (decrescente)
            this.pontuacoesRodadas.sort((a, b) => b.rodada_id - a.rodada_id);
            console.log(`[MyTeamComponent] Carregamento de pontuações concluído. Total: ${this.pontuacoesRodadas.length}`);
          }
        },
        error: (error) => {
          console.error(`[MyTeamComponent] Erro ao carregar pontuação da rodada ${rodadaId}:`, error);
          completedRequests++;
          if (completedRequests === observables.length) {
            this.isLoadingPontuacoes = false;
          }
        }
      });
    });
  }

  loadParcialRodadaAtual(): void {
    if (!this.myTeam || !this.rodadaAtual) return;
    
    // Apenas carregar parcial se a rodada estiver em andamento
    if (this.rodadaAtual.status !== 'em_andamento') {
      this.parcialRodadaAtual = null;
      return;
    }
    
    this.isLoadingPontuacoes = true;
    this.pontuacaoService.calcularPontuacaoTime(this.myTeam, this.rodadaAtual.id)
      .pipe(finalize(() => this.isLoadingPontuacoes = false))
      .subscribe({
        next: (pontuacao: PontuacaoRodada) => {
          this.parcialRodadaAtual = pontuacao;
        },
        error: (error: any) => {
          console.error('Erro ao calcular pontuação parcial:', error);
          this.parcialRodadaAtual = null;
        }
      });
  }

  selecionarRodada(rodadaId: number): void {
    if (this.rodadaSelecionadaId === rodadaId) {
      // Se clicou na mesma rodada, fecha os detalhes
      this.rodadaSelecionadaId = null;
      this.detalhesRodadaSelecionada = [];
      return;
    }
    
    this.rodadaSelecionadaId = rodadaId;
    this.carregarDetalhesRodada(rodadaId);
  }

  carregarDetalhesRodada(rodadaId: number): void {
    if (!this.myTeam) return;
    
    this.isLoadingDetalhes = true;
    this.detalhesRodadaSelecionada = [];
    
    this.pontuacaoService.getDetalhesPontuacaoTime(this.myTeam.id, rodadaId)
      .pipe(finalize(() => this.isLoadingDetalhes = false))
      .subscribe({
        next: (detalhes: DetalhePontuacaoAtleta[]) => {
          this.detalhesRodadaSelecionada = detalhes;
        },
        error: (error: any) => {
          console.error(`Erro ao carregar detalhes da rodada ${rodadaId}:`, error);
          this.snackBar.open(`Erro ao carregar detalhes da rodada ${rodadaId}.`, 'OK', { duration: 3000 });
        }
      });
  }

  recalcularPontuacaoRodada(rodadaId: number, event: Event): void {
    event.stopPropagation(); // Evitar que o clique abra/feche o painel de detalhes
    
    if (!this.myTeam) return;
    
    this.snackBar.open(`Recalculando pontuação da rodada ${rodadaId}...`, '', { duration: 2000 });
    
    this.taskSchedulerService.recalcularPontuacaoRodada(rodadaId)
      .subscribe({
        next: (success: boolean) => {
          if (success) {
            // Recarregar os dados após o recálculo
            this.loadPontuacoesTime();
            if (this.rodadaSelecionadaId === rodadaId) {
              this.carregarDetalhesRodada(rodadaId);
            }
          } else {
            this.snackBar.open(`Erro ao recalcular pontuação da rodada ${rodadaId}.`, 'OK', { duration: 3000 });
          }
        },
        error: (error: any) => {
          console.error(`Erro ao recalcular pontuação da rodada ${rodadaId}:`, error);
          this.snackBar.open(`Erro ao recalcular pontuação da rodada ${rodadaId}.`, 'OK', { duration: 3000 });
        }
      });
  }

  // Helper para formatar data
  formatarData(data: Date): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  // Add these helper methods
  getPositionCode(position: string): string {
    if (!position) return '';
    
    // Try to match position abbreviations first
    if (['GOL', 'ZAG', 'LAT', 'MEI', 'ATA', 'TEC'].includes(position)) {
      return position;
    }
    
    // Handle full position names
    const positionMap: Record<string, string> = {
      'Goleiro': 'GOL',
      'Zagueiro': 'ZAG',
      'Lateral': 'LAT',
      'Meia': 'MEI',
      'Meio-Campo': 'MEI',
      'Meio-Campista': 'MEI',
      'Atacante': 'ATA',
      'Técnico': 'TEC',
      'Tecnico': 'TEC'
    };
    
    for (const [key, value] of Object.entries(positionMap)) {
      if (position.includes(key)) {
        return value;
      }
    }
    
    return '';
  }
  
  getTeamLogoUrl(clubeAbreviacao: string): string {
    if (!clubeAbreviacao) {
      return 'assets/clubs/default-team.png';
    }
    
    // Clean the club code
    const cleanClubCode = clubeAbreviacao.replace('@', '');
    
    // Special handling for some problematic logos
    const specialClubs: Record<string, string> = {
      'MIR': 'assets/clubs/MIR.png',
      'RBB': 'assets/clubs/RBB.png',
      'JUV': 'assets/clubs/JUV.png'
    };
    
    if (specialClubs[cleanClubCode]) {
      return specialClubs[cleanClubCode];
    }
    
    return `assets/clubs/${cleanClubCode}.png`;
  }
  
  handleLogoError(event: any): void {
    event.target.src = 'assets/clubs/default-team.png';
  }
  
  hasScouts(scout: Record<string, number>): boolean {
    return Object.keys(scout).length > 0;
  }
  
  formatScouts(scout: Record<string, number>): string {
    const scoutLabels: Record<string, string> = {
      'G': 'Gol',
      'A': 'Assistência',
      'FT': 'Finalização na trave',
      'FD': 'Finalização defendida',
      'FF': 'Finalização para fora',
      'FS': 'Falta sofrida',
      'PS': 'Pênalti sofrido',
      'PP': 'Pênalti perdido',
      'DP': 'Defesa de pênalti',
      'SG': 'Sem gol sofrido',
      'DE': 'Defesa',
      'GS': 'Gol sofrido',
      'FC': 'Falta cometida',
      'CA': 'Cartão amarelo',
      'CV': 'Cartão vermelho',
      'GC': 'Gol contra',
      'PC': 'Pênalti cometido',
      'I': 'Impedimento',
      'PI': 'Passe interceptado'
    };
    
    return Object.entries(scout)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => `${key}:${value}`)
      .join(' ');
  }

  /**
   * Exibe os jogadores usados na rodada selecionada com suas pontuações
   * usando o histórico daquela rodada em vez do elenco atual
   */
  getAllPlayersWithPontuacao(detalhes: DetalhePontuacaoAtleta[], rodadaId: number): any[] {
    if (!this.myTeam) return [];
    
    // Como os detalhes já contêm os jogadores do histórico da rodada
    // graças ao método getDetalhesPontuacaoTime que busca do HistoricoTimes,
    // podemos simplesmente retornar os detalhes organizados
    
    return detalhes.map(detalhe => ({
      ...detalhe.atleta,
      pontuacao: detalhe.pontuacao,
      scout: detalhe.scout,
      consideradoNaCalculacao: true
    })).sort((a, b) => b.pontuacao - a.pontuacao); // Ordena por pontuação decrescente
  }

  getConsideredPlayers(detalhes: DetalhePontuacaoAtleta[]): any[] {
    return detalhes
      .filter(d => d.consideradoNaCalculacao === true)
      .map(d => ({
        ...d.atleta,
        pontuacao: d.pontuacao,
        scout: d.scout,
        consideradoNaCalculacao: d.consideradoNaCalculacao,
        entrou_em_campo: d.entrou_em_campo
      }))
      .sort((a, b) => b.pontuacao - a.pontuacao);
  }

  getNonConsideredPlayers(detalhes: DetalhePontuacaoAtleta[]): any[] {
    return detalhes
      .filter(d => d.consideradoNaCalculacao !== true)
      .map(d => ({
        ...d.atleta,
        pontuacao: d.pontuacao,
        scout: d.scout,
        consideradoNaCalculacao: d.consideradoNaCalculacao,
        entrou_em_campo: d.entrou_em_campo
      }))
      .sort((a, b) => b.pontuacao - a.pontuacao);
  }

  getConsideredPlayersTotal(detalhes: DetalhePontuacaoAtleta[]): number {
    return detalhes
      .filter(d => d.consideradoNaCalculacao === true)
      .reduce((total, d) => total + d.pontuacao, 0);
  }

  getFormationName(formationId?: string): string {
    if (!formationId) return 'Padrão';
    const formation = this.formations.find(f => f.id === formationId);
    return formation ? formation.name : formationId;
  }

  // Update the getFormationUsedInRound method to safely handle the formation data
  displayFormationFromDetalhes(detalhes: DetalhePontuacaoAtleta[], rodadaId: number): string {
    // In this implementation, we need to handle the formation ID carefully due to type constraints
    
    // We need to use type assertion more carefully since the actual runtime object might 
    // have properties not defined in the TypeScript interface
    let formationId: string | undefined;
    
    // Only try to access if we have details
    if (detalhes && detalhes.length > 0) {
      const firstDetailAsAny = detalhes[0] as any;
      
      // Try various properties that might contain the formation ID
      if (firstDetailAsAny.formacaoId) {
        formationId = firstDetailAsAny.formacaoId;
      } else if (firstDetailAsAny.historicoFormacao?.formacaoId) {
        formationId = firstDetailAsAny.historicoFormacao.formacaoId;
      } else if (firstDetailAsAny.formacao) {
        formationId = firstDetailAsAny.formacao;
      }
    }
    
    // If we couldn't find it in the details, fall back to our history lookup
    if (!formationId) {
      formationId = this.getFormationIdFromHistory(rodadaId);
    }
    
    // Get readable name from the formation ID
    return this.getFormationName(formationId);
  }

  // Add a method to get formation ID from historical data
  getFormationIdFromHistory(rodadaId: number): string | undefined {
    // This would ideally query the FormacoesHistorico for this specific round and team
    // For now we'll implement a simple placeholder that could be expanded
    
    // Special case for team ID 2 with rodada_id that should use F003
    if (this.myTeam?.id === '2') {
      return 'F003'; // Explicitly return F003 for team ID 2
    }
    
    // Return current formation as fallback
    return this.myTeam?.formation;
  }
} 