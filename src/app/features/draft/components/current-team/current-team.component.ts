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
import { TeamLogoService } from '../../../../core/services/team-logo.service';

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
                    <div class="team-logo">
                      <img [src]="getTeamLogo(player.clube)" [alt]="player.clube || 'Time'" class="team-logo-img" (error)="handleLogoError($event)">
                    </div>
                    <div class="player-info">
                      <div class="player-name">{{ player.apelido || player.nome || 'Sem nome' }}</div>
                      <div class="player-meta">
                        <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
                          {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
                        </span>
                        <span class="player-price">R$ {{ (player.preco || 0).toFixed(2) }}</span>
                      </div>
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
      color: var(--primary-color);
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
      background-color: var(--primary-color);
      color: white;
      padding: 4px 8px;
      border-radius: var(--border-radius);
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
      background-color: var(--light-color);
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
      background-color: rgba(221, 217, 42, 0.2);
      color: var(--primary-color);
    }

    .position-complete .position-count {
      background-color: var(--accent-color);
      color: var(--primary-color);
    }

    .player-list {
      display: flex;
      flex-direction: column;
    }

    .player-groups {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .player-group {
      display: flex;
      flex-direction: column;
    }

    .position-title {
      margin: 0 0 8px 0;
      font-size: 15px;
      font-weight: 500;
      color: var(--primary-color);
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }

    .player-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .player-card {
      padding: 8px;
      border-radius: var(--border-radius);
      border: 1px solid rgba(0,0,0,0.1);
      background-color: white;
      transition: all 0.2s;
    }

    .player-card:hover {
      background-color: var(--light-color);
      transform: translateX(4px);
    }

    .player-card-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .team-logo {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .team-logo-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .player-info {
      flex: 1;
      min-width: 0;
    }

    .player-name {
      font-weight: 500;
      margin-bottom: 4px;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .player-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .player-position {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
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

    .player-price {
      color: #757575;
    }

    .empty-position {
      color: #757575;
      font-style: italic;
      font-size: 13px;
      padding: 4px 8px;
    }
  `
})
export class CurrentTeamComponent {
  @Input() team: DraftTeam | null = null;
  @Input() draftConfig: DraftConfig | null = null;
  @Input() currentRound: number = 0;
  @Input() isLoading: boolean = false;

  constructor(private teamLogoService: TeamLogoService) {}

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

  getTeamLogo(club: string): string {
    return this.teamLogoService.getTeamLogoPath(club);
  }

  getPositionCode(position: string): string {
    if (!position) return 'SEM';
    
    const positionMap: Record<string, string> = {
      'Goleiro': 'GOL',
      'Lateral': 'LAT',
      'Zagueiro': 'ZAG',
      'Meia': 'MEI',
      'Atacante': 'ATA',
      'Técnico': 'TEC',
      'Tecnico': 'TEC',
      'GOL': 'GOL',
      'LAT': 'LAT',
      'ZAG': 'ZAG',
      'MEI': 'MEI',
      'ATA': 'ATA',
      'TEC': 'TEC'
    };
    
    return positionMap[position] || 'SEM';
  }

  // Handle logo loading errors
  handleLogoError(event: any): void {
    console.warn(`Logo load error for: ${event.target.alt}`);
    event.target.src = 'assets/clubs/default-team.png';
  }
} 