import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DraftTeam, DraftConfig } from '../../models/draft.model';

@Component({
  selector: 'app-current-team',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="current-team-container">
      <h2 class="section-title">Time Atual</h2>

      <div *ngIf="isLoading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!isLoading && !team" class="no-team">
        <mat-icon class="no-team-icon">group_off</mat-icon>
        <p>Nenhum time selecionado no momento</p>
      </div>

      <div *ngIf="!isLoading && team" class="team-content">
        <div class="team-header">
          <h3 class="team-name">{{ team.name }}</h3>
          <div class="team-badge">Rodada {{ currentRound }}</div>
        </div>

        <div class="team-info">
          <div class="info-item">
            <mat-icon>person</mat-icon>
            <span>{{ team.players.length || 0 }} / {{ requiredPlayers }} Jogadores</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="positions-summary">
          <h4>Posições</h4>
          <div class="position-chips">
            <div class="position-chip" 
                 [class.position-complete]="positionCounts['GOL'] >= 2"
                 matTooltip="Goleiros: {{ positionCounts['GOL'] }} / 2">
              <span class="position-label">GOL</span>
              <span class="position-count">{{ positionCounts['GOL'] }}</span>
            </div>
            <div class="position-chip" 
                 [class.position-complete]="positionCounts['ZAG'] >= 3"
                 matTooltip="Zagueiros: {{ positionCounts['ZAG'] }} / 3">
              <span class="position-label">ZAG</span>
              <span class="position-count">{{ positionCounts['ZAG'] }}</span>
            </div>
            <div class="position-chip" 
                 [class.position-complete]="positionCounts['LAT'] >= 4"
                 matTooltip="Laterais: {{ positionCounts['LAT'] }} / 4">
              <span class="position-label">LAT</span>
              <span class="position-count">{{ positionCounts['LAT'] }}</span>
            </div>
            <div class="position-chip" 
                 [class.position-complete]="positionCounts['MEI'] >= 5"
                 matTooltip="Meias: {{ positionCounts['MEI'] }} / 5">
              <span class="position-label">MEI</span>
              <span class="position-count">{{ positionCounts['MEI'] }}</span>
            </div>
            <div class="position-chip" 
                 [class.position-complete]="positionCounts['ATA'] >= 3"
                 matTooltip="Atacantes: {{ positionCounts['ATA'] }} / 3">
              <span class="position-label">ATA</span>
              <span class="position-count">{{ positionCounts['ATA'] }}</span>
            </div>
            <div class="position-chip" 
                 [class.position-complete]="positionCounts['TEC'] >= 1"
                 matTooltip="Técnicos: {{ positionCounts['TEC'] }} / 1">
              <span class="position-label">TEC</span>
              <span class="position-count">{{ positionCounts['TEC'] }}</span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <div class="player-list">
          <h4>Elenco ({{ team.players.length }})</h4>
          
          <div class="player-groups">
            <div *ngFor="let position of ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA', 'TEC']" class="player-group">
              <h5 class="position-title">{{ getPositionName(position) }}</h5>
              <div class="player-cards">
                <div *ngFor="let player of getPlayersByPosition(position)" class="player-card">
                  <div class="player-card-content">
                    <div class="player-position" [attr.data-position]="player.posicao || 'SEM'">
                      {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
                    </div>
                    <div class="player-info">
                      <div class="player-name">{{ player.apelido || player.nome || 'Sem nome' }}</div>
                      <div class="player-club">{{ player.clubeAbreviacao || player.clube || 'Sem clube' }}</div>
                    </div>
                  </div>
                </div>
                
                <div *ngIf="getPlayersByPosition(position).length === 0" class="empty-position">
                  <span>Nenhum jogador desta posição</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .current-team-container {
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

    .no-team {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      text-align: center;
      color: #757575;
    }

    .no-team-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }

    .team-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .team-name {
      margin: 0;
      font-size: 24px;
      font-weight: 500;
    }

    .team-badge {
      background-color: #3f51b5;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
    }

    .team-info {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-divider {
      margin: 16px 0;
    }

    .positions-summary {
      margin-bottom: 16px;
    }

    .positions-summary h4, .player-list h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .position-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .position-chip {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 6px 12px;
      border-radius: 16px;
      background-color: #f5f5f5;
      font-size: 14px;
    }

    .position-count {
      background-color: #e0e0e0;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
    }

    .position-complete {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .position-complete .position-count {
      background-color: #a5d6a7;
    }

    .player-groups {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .position-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #5c6bc0;
    }

    .player-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .player-card {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      width: calc(50% - 4px);
      overflow: hidden;
    }

    .player-card-content {
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .player-position {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      background-color: #aaa;
    }

    .player-position[data-position="GOL"] {
      background-color: #ffeb3b;
      color: #000;
    }

    .player-position[data-position="ZAG"] {
      background-color: #2196f3;
      color: white;
    }

    .player-position[data-position="LAT"] {
      background-color: #4caf50;
      color: white;
    }

    .player-position[data-position="MEI"] {
      background-color: #ff9800;
      color: #000;
    }

    .player-position[data-position="ATA"] {
      background-color: #f44336;
      color: white;
    }

    .player-position[data-position="TEC"] {
      background-color: #607d8b;
      color: white;
    }

    .player-position[data-position="SEM"] {
      background-color: #9e9e9e;
      color: white;
    }

    .player-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .player-name {
      font-weight: 500;
      font-size: 14px;
    }

    .player-club {
      color: #757575;
    }

    .empty-position {
      width: 100%;
      padding: 12px;
      text-align: center;
      font-size: 14px;
      color: #9e9e9e;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .player-card {
        width: 100%;
      }
    }
  `
})
export class CurrentTeamComponent {
  @Input() team: DraftTeam | null = null;
  @Input() draftConfig: DraftConfig | null = null;
  @Input() currentRound: number = 0;
  @Input() isLoading: boolean = false;

  get positionCounts(): Record<string, number> {
    if (!this.team) {
      return { 'GOL': 0, 'ZAG': 0, 'LAT': 0, 'MEI': 0, 'ATA': 0, 'TEC': 0 };
    }

    const counts: Record<string, number> = { 'GOL': 0, 'ZAG': 0, 'LAT': 0, 'MEI': 0, 'ATA': 0, 'TEC': 0 };
    
    const positionMapping: Record<string, string> = {
      'Goleiro': 'GOL',
      'Zagueiro': 'ZAG',
      'Lateral': 'LAT',
      'Meia': 'MEI',
      'Atacante': 'ATA',
      'Técnico': 'TEC'
    };
    
    this.team.players.forEach(player => {
      for (const [fullPosition, code] of Object.entries(positionMapping)) {
        if (player.posicao?.includes(fullPosition)) {
          counts[code]++;
          break;
        }
      }
    });
    
    return counts;
  }

  get requiredPlayers(): number {
    return this.draftConfig?.requiredPositions.totalPlayers || 18;
  }

  getPlayersByPosition(position: string): any[] {
    if (!this.team) return [];
    
    const positionMapping: Record<string, string> = {
      'Goleiro': 'GOL',
      'Zagueiro': 'ZAG',
      'Lateral': 'LAT',
      'Meia': 'MEI',
      'Atacante': 'ATA',
      'Técnico': 'TEC'
    };
    
    const fullPosition = Object.entries(positionMapping).find(([name, code]) => code === position)?.[0];
    
    if (!fullPosition) return [];
    
    return this.team.players.filter(player => player.posicao?.includes(fullPosition));
  }

  getPositionName(position: string): string {
    const positions: Record<string, string> = {
      'GOL': 'Goleiros',
      'ZAG': 'Zagueiros',
      'LAT': 'Laterais',
      'MEI': 'Meias',
      'ATA': 'Atacantes',
      'TEC': 'Técnicos'
    };
    
    return positions[position] || position;
  }
} 