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
import { TeamLogoService } from '../../../../core/services/team-logo.service';

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
              [ngClass]="getTeamStatusClass(team.id)">
              
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
                    <div class="debug-info" *ngIf="showDebugInfo">
                      <p>Time ID: {{ team.id }}</p>
                      <p>Liga ID: {{ team.ligaId }}</p>
                    </div>
                  </div>
                  
                  <div *ngIf="team.players.length > 0" class="players-list">
                    <div *ngFor="let player of team.players" class="player-item">
                      <div class="team-logo">
                        <img [src]="getTeamLogo(player.clube)" [alt]="player.clube || 'Time'" class="team-logo-img">
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
      color: var(--primary-color);
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
    }

    /* Remover borda padrão e background do Angular Material para aplicarmos nossos estilos */
    ::ng-deep .team-panel .mat-expansion-panel {
      background: transparent !important;
      box-shadow: none !important;
    }

    .team-panel {
      margin-bottom: 16px !important; /* Espaçamento reduzido pela metade */
      box-shadow: var(--shadow-sm);
      background-color: white;
      border-radius: var(--border-radius);
      overflow: hidden;
      transition: box-shadow 0.3s, transform 0.2s;
      position: relative;
    }

    /* Último time não precisa de margin-bottom */
    .team-panel:last-child {
      margin-bottom: 16px !important;
    }

    .team-panel::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background-color: transparent;
      transition: background-color 0.3s;
    }
    
    .team-panel:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .current-team::before {
      background-color: var(--primary-color);
    }

    .current-team {
      background-color: var(--light-color);
    }

    .next-team::before {
      background-color: var(--accent-color);
    }

    .next-team {
      background-color: rgba(221, 217, 42, 0.1);
    }

    ::ng-deep .team-panel .mat-expansion-panel-header {
      background-color: rgba(0,0,0,0.02);
      border-bottom: 1px solid rgba(0,0,0,0.05);
      padding: 0 16px 0 16px;
      height: 60px !important;
    }

    ::ng-deep .current-team .mat-expansion-panel-header {
      background-color: rgba(45, 42, 50, 0.05);
    }

    ::ng-deep .next-team .mat-expansion-panel-header {
      background-color: rgba(255, 64, 129, 0.05);
    }

    /* Consertar posição do indicador de expansão */
    ::ng-deep .team-panel .mat-expansion-indicator {
      margin-left: 8px;
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
      margin-right: 28px; /* Espaço para o indicador de expansão */
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
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .current-team .player-count {
      background-color: #3f51b5;
      color: white;
    }

    .next-team .player-count {
      background-color: #ff4081;
      color: white;
    }

    .team-content {
      padding: 16px 16px;
      background-color: white;
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
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(0,0,0,0.03);
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
      background-color: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid rgba(0,0,0,0.05);
      transition: transform 0.15s, box-shadow 0.15s;
    }

    .player-item:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 5px rgba(0,0,0,0.15);
    }

    .team-logo {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .team-logo-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .player-position {
      display: inline-block;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.5px;
      color: white;
      background-color: #aaa;
      text-transform: uppercase;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2);
      margin-right: 4px;
    }

    .player-position[data-position="GOL"] {
      background-color: #ffeb3b;
      color: #000;
    }

    .player-position[data-position="LAT"] {
      background-color: #4caf50;
      color: white;
    }

    .player-position[data-position="ZAG"] {
      background-color: #2196f3;
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
      margin-bottom: 4px;
    }
    
    .player-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 12px;
    }
    
    .player-price {
      font-size: 13px;
      color: #757575;
      font-weight: 500;
    }
    
    /* Override Angular Material styling */
    ::ng-deep .team-panel .mat-expansion-panel-body {
      padding: 0 16px 16px;
    }
    
    ::ng-deep .mat-expansion-panel:not(.mat-expanded) .mat-expansion-panel-header:hover:not([aria-disabled=true]) {
      background-color: rgba(0,0,0,0.04);
    }
    
    ::ng-deep .current-team:not(.mat-expanded) .mat-expansion-panel-header:hover:not([aria-disabled=true]) {
      background-color: rgba(63, 81, 181, 0.08);
    }
    
    ::ng-deep .next-team:not(.mat-expanded) .mat-expansion-panel-header:hover:not([aria-disabled=true]) {
      background-color: rgba(255, 64, 129, 0.08);
    }

    /* Style direto no mat-expansion-panel para garantir aplicação */
    ::ng-deep .teams-list .mat-expansion-panel {
      margin-bottom: 16px !important;
    }

    ::ng-deep .teams-list .mat-expansion-panel:last-child {
      margin-bottom: 8px !important;
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
  @Input() showDebugInfo: boolean = false;

  constructor(private teamLogoService: TeamLogoService) {}

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

  // Retorna a classe CSS correta para o time com prioridade para o time atual
  getTeamStatusClass(teamId: string): { [key: string]: boolean } {
    const isCurrent = teamId === this.currentTeamId;
    const isNext = this.isNextTeam(teamId);
    
    // Se for tanto o time atual quanto o próximo, prioriza o estilo de time atual
    if (isCurrent) {
      return { 'current-team': true };
    } else if (isNext) {
      return { 'next-team': true };
    }
    
    return {};
  }

  // Count players by position
  countPlayersByPosition(team: DraftTeam, position: string): number {
    // Mapeamento de nomes de posição para as chaves que usamos no componente
    const positionMapping: Record<string, string> = {
      'Goleiro': 'GOL',
      'Zagueiro': 'ZAG',
      'Lateral': 'LAT',
      'Meia': 'MEI',
      'Atacante': 'ATA',
      'Técnico': 'TEC'
    };
    
    // Inverter o mapeamento para buscar o nome completo da posição
    const fullPosition = Object.entries(positionMapping).find(([name, code]) => code === position)?.[0];
    
    if (!fullPosition) return 0;
    
    // Contar jogadores cuja posição inclui o nome completo da posição
    return team.players.filter(player => player.posicao?.includes(fullPosition)).length;
  }

  // Método para obter o código da posição a partir do nome completo
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
      // Já retorna a posição se ela já for uma abreviação
      'GOL': 'GOL',
      'LAT': 'LAT',
      'ZAG': 'ZAG',
      'MEI': 'MEI',
      'ATA': 'ATA',
      'TEC': 'TEC'
    };
    
    return positionMap[position] || 'SEM';
  }

  // Método para obter o logo do time
  getTeamLogo(club: string): string {
    return this.teamLogoService.getTeamLogoPath(club);
  }
} 