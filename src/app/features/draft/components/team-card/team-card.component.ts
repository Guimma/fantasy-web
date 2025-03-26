import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { DraftTeam, Athlete } from '../../models/draft.model';

@Component({
  selector: 'app-team-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatBadgeModule,
    MatDividerModule
  ],
  template: `
    <mat-card class="team-card" [class.current-team]="isCurrentTeam">
      <mat-card-header>
        <mat-card-title>{{ team.name }}</mat-card-title>
        <mat-card-subtitle>
          {{ positionsByCategory['GOL'].length }} GOL | 
          {{ positionsByCategory['ZAG'].length + positionsByCategory['LAT'].length }} DEF | 
          {{ positionsByCategory['MEI'].length }} MEI | 
          {{ positionsByCategory['ATA'].length }} ATA |
          {{ positionsByCategory['TEC'].length }} TEC
        </mat-card-subtitle>
        <div class="card-badge" *ngIf="isCurrentTeam">
          <mat-icon color="accent">play_arrow</mat-icon>
          <span>Escolhendo</span>
        </div>
      </mat-card-header>
      
      <mat-card-content>
        <div class="players-container">
          <ng-container *ngIf="team.players.length > 0; else noPlayers">
            <div class="position-section" *ngIf="positionsByCategory['GOL'].length > 0">
              <h4 class="position-title">Goleiros</h4>
              <div class="player-list">
                <div class="player-item" *ngFor="let player of positionsByCategory['GOL']">
                  <span class="player-name">{{ player.nome }}</span>
                  <span class="player-club">{{ player.clube }}</span>
                </div>
              </div>
            </div>
            
            <div class="position-section" *ngIf="positionsByCategory['LAT'].length > 0 || positionsByCategory['ZAG'].length > 0">
              <h4 class="position-title">Defensores</h4>
              <div class="player-list">
                <div class="player-item" *ngFor="let player of defensores">
                  <span class="player-name">{{ player.nome }}</span>
                  <span class="player-club">{{ player.clube }}</span>
                  <span class="player-position">{{ player.posicao }}</span>
                </div>
              </div>
            </div>
            
            <div class="position-section" *ngIf="positionsByCategory['MEI'].length > 0">
              <h4 class="position-title">Meio-Campistas</h4>
              <div class="player-list">
                <div class="player-item" *ngFor="let player of positionsByCategory['MEI']">
                  <span class="player-name">{{ player.nome }}</span>
                  <span class="player-club">{{ player.clube }}</span>
                </div>
              </div>
            </div>
            
            <div class="position-section" *ngIf="positionsByCategory['ATA'].length > 0">
              <h4 class="position-title">Atacantes</h4>
              <div class="player-list">
                <div class="player-item" *ngFor="let player of positionsByCategory['ATA']">
                  <span class="player-name">{{ player.nome }}</span>
                  <span class="player-club">{{ player.clube }}</span>
                </div>
              </div>
            </div>
            
            <div class="position-section" *ngIf="positionsByCategory['TEC'].length > 0">
              <h4 class="position-title">Técnico</h4>
              <div class="player-list">
                <div class="player-item" *ngFor="let player of positionsByCategory['TEC']">
                  <span class="player-name">{{ player.nome }}</span>
                  <span class="player-club">{{ player.clube }}</span>
                </div>
              </div>
            </div>
          </ng-container>
          
          <ng-template #noPlayers>
            <div class="no-players">
              <p>Nenhum jogador selecionado ainda</p>
            </div>
          </ng-template>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .team-card {
      height: 100%;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      border: 1px solid rgba(0,0,0,0.08);
      background-color: white;
    }
    
    .team-card.current-team {
      box-shadow: 0 0 0 2px #3f51b5, 0 6px 10px rgba(0,0,0,0.15);
      transform: translateY(-4px);
      background-color: #f5f7ff;
    }
    
    mat-card-header {
      position: relative;
      background-color: rgba(0,0,0,0.02);
      border-bottom: 1px solid rgba(0,0,0,0.05);
      padding: 16px 16px 12px;
    }
    
    mat-card-title {
      margin-bottom: 4px !important;
    }
    
    .card-badge {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      align-items: center;
      background-color: #3f51b5;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }
    
    .card-badge mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    mat-card-content {
      flex-grow: 1;
      overflow: auto;
      padding-top: 16px;
    }
    
    .players-container {
      height: 100%;
    }
    
    .position-section {
      margin-bottom: 16px;
    }
    
    .position-title {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      border-bottom: 1px solid #eee;
      padding-bottom: 4px;
    }
    
    .player-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .player-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 10px;
      background: white;
      border-radius: 4px;
      font-size: 13px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.05);
    }
    
    .player-name {
      font-weight: 500;
      flex: 2;
    }
    
    .player-club {
      color: #666;
      flex: 1;
      text-align: right;
    }
    
    .player-position {
      background: #e0e0e0;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
      font-size: 11px;
    }
    
    .no-players {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      font-style: italic;
    }
  `
})
export class TeamCardComponent {
  @Input() team!: DraftTeam;
  @Input() isCurrentTeam = false;
  
  get positionsByCategory(): Record<string, Athlete[]> {
    const result: Record<string, Athlete[]> = {
      'GOL': [],
      'LAT': [],
      'ZAG': [],
      'MEI': [],
      'ATA': [],
      'TEC': []
    };
    
    if (this.team?.players) {
      this.team.players.forEach(player => {
        if (player.posicao in result) {
          result[player.posicao].push(player);
        }
      });
    }
    
    return result;
  }
  
  get defensores(): Athlete[] {
    return [...this.positionsByCategory['ZAG'], ...this.positionsByCategory['LAT']];
  }
} 