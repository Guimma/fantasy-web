import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { DraftTeam, DraftOrder, DraftStatus } from '../../models/draft.model';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule
  ],
  template: `
    <div class="team-list-container">
      <h2 class="section-title">Times Participantes</h2>

      <div *ngIf="isLoading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!isLoading && teams.length === 0" class="no-teams">
        <mat-icon>groups_off</mat-icon>
        <p>Nenhum time disponível para o draft</p>
      </div>

      <div *ngIf="!isLoading && teams.length > 0" class="teams-content">
        <div class="teams-list">
          <mat-accordion [multi]="true">
            <mat-expansion-panel 
              *ngFor="let team of teams; let i = index" 
              [expanded]="isExpanded(team)"
              class="team-panel"
              [ngClass]="{'current-team': team.id === currentTeamId, 'next-team': isNextTeam(team.id)}">
              
              <mat-expansion-panel-header collapsedHeight="60px" expandedHeight="60px">
                <div class="team-header">
                  <div class="team-info">
                    <div class="team-indicator">
                      <mat-icon *ngIf="team.id === currentTeamId" 
                                color="primary"
                                matTooltip="Time atual">
                        play_arrow
                      </mat-icon>
                      <mat-icon *ngIf="isNextTeam(team.id)" 
                                color="accent"
                                matTooltip="Próximo time">
                        skip_next
                      </mat-icon>
                    </div>
                    <div class="team-name">{{ team.name }}</div>
                  </div>
                  <div class="team-stats" [matTooltip]="'Total de jogadores selecionados'">
                    <span class="player-count">{{ team.players.length }}</span>
                  </div>
                </div>
              </mat-expansion-panel-header>

              <div class="team-content">
                <div class="team-positions">
                  <h4>Posições</h4>
                  <div class="position-summary">
                    <div class="position-item">
                      <span class="position-label">GOL:</span>
                      <span class="position-count">{{ countPlayersByPosition(team, 'GOL') }}</span>
                    </div>
                    <div class="position-item">
                      <span class="position-label">ZAG:</span>
                      <span class="position-count">{{ countPlayersByPosition(team, 'ZAG') }}</span>
                    </div>
                    <div class="position-item">
                      <span class="position-label">LAT:</span>
                      <span class="position-count">{{ countPlayersByPosition(team, 'LAT') }}</span>
                    </div>
                    <div class="position-item">
                      <span class="position-label">MEI:</span>
                      <span class="position-count">{{ countPlayersByPosition(team, 'MEI') }}</span>
                    </div>
                    <div class="position-item">
                      <span class="position-label">ATA:</span>
                      <span class="position-count">{{ countPlayersByPosition(team, 'ATA') }}</span>
                    </div>
                    <div class="position-item">
                      <span class="position-label">TEC:</span>
                      <span class="position-count">{{ countPlayersByPosition(team, 'TEC') }}</span>
                    </div>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <div class="team-players">
                  <h4>Jogadores Selecionados</h4>
                  
                  <div *ngIf="team.players.length === 0" class="no-players">
                    <span>Nenhum jogador selecionado</span>
                  </div>
                  
                  <div *ngIf="team.players.length > 0" class="players-list">
                    <div *ngFor="let player of team.players" class="player-item">
                      <div class="player-position" [attr.data-position]="player.posicao">
                        {{ player.posicao }}
                      </div>
                      <div class="player-info">
                        <span class="player-name">{{ player.nome }}</span>
                        <span class="player-club">{{ player.clube }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>
      </div>
    </div>
  `,
  styles: `
    .team-list-container {
      padding: 16px;
      height: 100%;
      overflow-y: auto;
    }

    .section-title {
      margin: 0 0 16px 0;
      color: #3f51b5;
      font-size: 20px;
      font-weight: 500;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .no-teams {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      text-align: center;
      color: #757575;
    }

    .no-teams mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }

    .teams-content {
      display: flex;
      flex-direction: column;
    }

    .teams-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .team-panel {
      margin-bottom: 8px;
      border-left: 4px solid transparent;
    }

    .current-team {
      border-left-color: #3f51b5;
    }

    .next-team {
      border-left-color: #ff4081;
    }

    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .team-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .team-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
    }

    .team-name {
      font-weight: 500;
      font-size: 16px;
    }

    .team-stats {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .player-count {
      background-color: #e0e0e0;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 500;
    }

    .team-content {
      padding: 16px 0;
    }

    .team-positions {
      margin-bottom: 16px;
    }

    .team-positions h4, .team-players h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #5c6bc0;
    }

    .position-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .position-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .position-label {
      font-weight: 500;
    }

    mat-divider {
      margin: 16px 0;
    }

    .no-players {
      padding: 12px;
      text-align: center;
      font-size: 14px;
      color: #9e9e9e;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .players-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .player-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 4px;
      background-color: #f5f5f5;
    }

    .player-position {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 11px;
      color: white;
    }

    .player-position[data-position="GOL"] {
      background-color: #ffa000;
    }

    .player-position[data-position="ZAG"] {
      background-color: #2196f3;
    }

    .player-position[data-position="LAT"] {
      background-color: #4caf50;
    }

    .player-position[data-position="MEI"] {
      background-color: #9c27b0;
    }

    .player-position[data-position="ATA"] {
      background-color: #f44336;
    }

    .player-position[data-position="TEC"] {
      background-color: #607d8b;
    }

    .player-info {
      display: flex;
      flex-direction: column;
    }

    .player-name {
      font-weight: 500;
      font-size: 14px;
    }

    .player-club {
      font-size: 12px;
      color: #757575;
    }
    
    /* Override Angular Material styling */
    ::ng-deep .team-panel .mat-expansion-panel-body {
      padding: 0 16px 16px;
    }
  `
})
export class TeamListComponent {
  @Input() teams: DraftTeam[] = [];
  @Input() currentTeamId: string | undefined;
  @Input() draftOrder: DraftOrder[] = [];
  @Input() currentOrderIndex: number = -1;
  @Input() draftStatus: DraftStatus = 'not_started';
  @Input() isLoading: boolean = false;

  // Used to check if team panel should be expanded
  isExpanded(team: DraftTeam): boolean {
    // Expand current team and next team automatically
    return team.id === this.currentTeamId || this.isNextTeam(team.id);
  }

  // Check if this team is the next to pick
  isNextTeam(teamId: string): boolean {
    if (this.draftStatus !== 'in_progress' || this.currentOrderIndex === -1) {
      return false;
    }
    
    const nextIndex = this.currentOrderIndex + 1;
    
    if (nextIndex < this.draftOrder.length) {
      return this.draftOrder[nextIndex].teamId === teamId;
    }
    
    return false;
  }

  // Count players by position
  countPlayersByPosition(team: DraftTeam, position: string): number {
    return team.players.filter(player => player.posicao === position).length;
  }
} 