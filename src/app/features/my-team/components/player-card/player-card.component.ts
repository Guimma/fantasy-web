import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MyTeamPlayer } from '../../models/my-team.model';
import { TeamLogoService } from '../../../../core/services/team-logo.service';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    DragDropModule
  ],
  template: `
    <div class="player-card" [ngClass]="{'in-lineup': player.inLineup, 'draggable': draggable}" cdkDrag [cdkDragData]="player" *ngIf="draggable; else nonDraggable">
      <div class="player-card-content">
        <div class="team-logo">
          <img [src]="getClubShieldUrl()" [alt]="player.clube" class="team-logo-img">
        </div>
        <div class="player-info">
          <div class="player-name">{{ player.apelido }}</div>
          <div class="player-meta">
            <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
              {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
            </span>
            <span class="player-price">C$ {{ (player.preco || 0).toFixed(1) }}</span>
          </div>
        </div>
        
        <div class="drag-handle">
          <mat-icon>drag_indicator</mat-icon>
        </div>
      </div>
    </div>
    
    <ng-template #nonDraggable>
      <div class="player-card" [ngClass]="{'in-lineup': player.inLineup}">
        <div class="player-card-content">
          <div class="team-logo">
            <img [src]="getClubShieldUrl()" [alt]="player.clube" class="team-logo-img">
          </div>
          <div class="player-info">
            <div class="player-name">{{ player.apelido }}</div>
            <div class="player-meta">
              <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
                {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
              </span>
              <span class="player-price">C$ {{ (player.preco || 0).toFixed(1) }}</span>
            </div>
          </div>
          
          <div class="player-actions">
            <button 
              mat-icon-button 
              color="primary" 
              (click)="addPlayer()" 
              [disabled]="player.inLineup"
              matTooltip="Adicionar à escalação"
            >
              <mat-icon>add_circle</mat-icon>
            </button>
            <button 
              mat-icon-button 
              color="warn" 
              (click)="removePlayer()" 
              [disabled]="!player.inLineup"
              matTooltip="Remover da escalação"
            >
              <mat-icon>remove_circle</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    .player-card {
      padding: 8px;
      border-radius: var(--border-radius);
      border: 1px solid rgba(0,0,0,0.1);
      background-color: white;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      height: 100%;
    }

    .player-card:hover {
      background-color: var(--light-color);
      transform: translateX(4px);
    }
    
    .player-card.draggable {
      cursor: move;
    }
    
    .player-card.draggable:hover {
      box-shadow: var(--shadow-sm);
      border-color: var(--primary-color);
    }

    .player-card.in-lineup {
      background-color: var(--primary-light);
      border-left: 3px solid var(--primary-color);
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
    
    .player-actions {
      display: flex;
      gap: 4px;
    }
    
    .drag-handle {
      cursor: move;
      color: var(--primary-color);
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
  `
})
export class PlayerCardComponent {
  @Input() player!: MyTeamPlayer;
  @Input() draggable = false;
  @Output() add = new EventEmitter<MyTeamPlayer>();
  @Output() remove = new EventEmitter<MyTeamPlayer>();
  
  constructor(private teamLogoService: TeamLogoService) {}
  
  addPlayer(): void {
    this.add.emit(this.player);
  }
  
  removePlayer(): void {
    this.remove.emit(this.player);
  }
  
  getClubShieldUrl(): string {
    if (!this.player.clubeAbreviacao) {
      return 'assets/clubs/default.png';
    }
    return this.teamLogoService.getTeamLogoPath(this.player.clubeAbreviacao);
  }
  
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
    
    // Try numeric codes (from Cartola API)
    const numericMap: Record<string, string> = {
      '1': 'GOL',
      '2': 'LAT',
      '3': 'ZAG',
      '4': 'MEI',
      '5': 'ATA',
      '6': 'TEC'
    };
    
    if (numericMap[position]) {
      return numericMap[position];
    }
    
    return '';
  }
} 