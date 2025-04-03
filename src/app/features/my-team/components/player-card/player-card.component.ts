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
    <div class="player-card" 
         [ngClass]="{
           'in-lineup': player.inLineup, 
           'draggable': draggable,
           'player-injured': isInjured(),
           'player-doubtful': isDoubtful(),
           'player-probable': isProbable(),
           'player-null': isNull(),
           'player-suspended': isSuspended()
         }" 
         cdkDrag [cdkDragData]="player" *ngIf="draggable; else nonDraggable">
      <div class="status-indicator"></div>
      <div class="player-card-content">
        <div class="player-header">
          <img [src]="getClubShieldUrl()" [alt]="player.clube" class="team-logo" (error)="handleLogoError($event)">
          <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
            {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
          </span>
          <mat-icon class="drag-handle">drag_indicator</mat-icon>
        </div>
        
        <div class="player-name" [matTooltip]="player.apelido">{{ player.apelido }}</div>
        
        <div class="player-details">
          <div class="price-tag">C$ {{ (player.preco || 0).toFixed(1) }}</div>
          <div *ngIf="hasPontuacao()" class="points-tag" [ngClass]="{'negative': getPontuacao() < 0}">
            {{ getPontuacao() | number:'1.1-1' }} pts
          </div>
        </div>
        
        <div *ngIf="player.status" class="player-status">
          {{ getStatusLabel(player.status) }}
        </div>
      </div>
    </div>
    
    <ng-template #nonDraggable>
      <div class="player-card" 
           [ngClass]="{
             'in-lineup': player.inLineup,
             'player-injured': isInjured(),
             'player-doubtful': isDoubtful(),
             'player-probable': isProbable(),
             'player-null': isNull(),
             'player-suspended': isSuspended()
           }">
        <div class="status-indicator"></div>
        <div class="player-card-content">
          <div class="player-header">
            <img [src]="getClubShieldUrl()" [alt]="player.clube" class="team-logo" (error)="handleLogoError($event)">
            <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
              {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
            </span>
          </div>
          
          <div class="player-name" [matTooltip]="player.apelido">{{ player.apelido }}</div>
          
          <div class="player-details">
            <div class="price-tag">C$ {{ (player.preco || 0).toFixed(1) }}</div>
            <div *ngIf="hasPontuacao()" class="points-tag" [ngClass]="{'negative': getPontuacao() < 0}">
              {{ getPontuacao() | number:'1.1-1' }} pts
            </div>
          </div>
          
          <div *ngIf="player.status" class="player-status">
            {{ getStatusLabel(player.status) }}
          </div>
          
          <div class="player-actions" *ngIf="!isInjured()">
            <button 
              mat-icon-button 
              color="primary" 
              (click)="addPlayer()" 
              [disabled]="player.inLineup"
              matTooltip="Adicionar à escalação"
              class="action-button add-button"
            >
              <mat-icon>add_circle</mat-icon>
            </button>
            <button 
              mat-icon-button 
              color="warn" 
              (click)="removePlayer()" 
              [disabled]="!player.inLineup"
              matTooltip="Remover da escalação"
              class="action-button remove-button"
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
      border-radius: 8px;
      background-color: white;
      transition: all 0.2s;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      height: 100%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.08);
      overflow: hidden;
      display: flex;
    }

    .status-indicator {
      width: 4px;
      height: 100%;
      background-color: transparent;
      transition: all 0.2s;
    }

    .player-card-content {
      padding: 12px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .player-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .player-card.draggable {
      cursor: move;
    }
    
    .player-card.in-lineup {
      background-color: var(--primary-light);
    }
    
    .player-card.in-lineup .status-indicator {
      background-color: var(--primary-color);
    }
    
    .player-card.player-injured .status-indicator {
      background-color: #f44336;
    }
    
    .player-card.player-injured {
      background-color: #ffebee;
    }
    
    .player-card.player-doubtful .status-indicator {
      background-color: #ffc107;
    }
    
    .player-card.player-doubtful {
      background-color: #fff8e1;
    }
    
    .player-card.player-probable .status-indicator {
      background-color: #4caf50;
    }
    
    .player-card.player-probable {
      background-color: #e8f5e9;
    }
    
    .player-card.player-null .status-indicator {
      background-color: #9e9e9e;
    }
    
    .player-card.player-null {
      background-color: #f5f5f5;
    }
    
    .player-card.player-suspended .status-indicator {
      background-color: #3f51b5;
    }
    
    .player-card.player-suspended {
      background-color: #e8eaf6;
    }

    .player-header {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .team-logo {
      width: 28px;
      height: 28px;
      object-fit: contain;
      background-color: transparent;
    }

    .player-name {
      font-weight: 600;
      font-size: 15px;
      line-height: 1.2;
      color: #333;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .player-details {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 4px;
    }

    .price-tag {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }
    
    .points-tag {
      background-color: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 600;
    }
    
    .points-tag.negative {
      background-color: rgba(244, 67, 54, 0.15);
      color: #d32f2f;
    }

    .player-position {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 6px;
      border-radius: 4px;
      color: white;
      background-color: var(--primary-color);
      letter-spacing: 0.5px;
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

    .player-status {
      font-size: 12px;
      font-weight: 500;
      color: #555;
      margin-top: 2px;
    }
    
    .player-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }

    .action-button {
      width: 30px;
      height: 30px;
      line-height: 30px;
    }
    
    .action-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      line-height: 20px;
    }

    .drag-handle {
      position: absolute;
      right: 0;
      top: 0;
      cursor: move;
      color: #888;
      font-size: 20px;
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
  
  /**
   * Check if the player has a pontuacao value
   */
  hasPontuacao(): boolean {
    return (this.player as any).pontuacao !== undefined;
  }
  
  /**
   * Get the player's pontuacao value safely
   */
  getPontuacao(): number {
    return (this.player as any).pontuacao || 0;
  }
  
  getClubShieldUrl(): string {
    if (!this.player.clubeAbreviacao) {
      console.log(`Abreviação de clube não encontrada para: ${this.player.apelido}`);
      return 'assets/clubs/default-team.png';
    }
    
    // Clean the club code in case it has @ characters
    const cleanClubCode = this.player.clubeAbreviacao.replace('@', '');
    
    // Special handling for some problematic logos
    const specialClubs: Record<string, string> = {
      'MIR': 'assets/clubs/MIR.png',
      'RBB': 'assets/clubs/RBB.png',
      'JUV': 'assets/clubs/JUV.png'
    };
    
    if (specialClubs[cleanClubCode]) {
      return specialClubs[cleanClubCode];
    }
    
    return this.teamLogoService.getTeamLogoPath(cleanClubCode);
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
    
    return '';
  }
  
  /**
   * Get a user-friendly label for a status
   */
  getStatusLabel(status: string): string {
    // Map common status values to their user-friendly labels
    const statusMap: Record<string, string> = {
      'Disponível': 'Disponível',
      'Ativo': 'Disponível',
      'Contundido': 'Contundido',
      'Dúvida': 'Dúvida',
      'Suspenso': 'Suspenso',
      'Provável': 'Provável',
      'Nulo': 'Nulo'
    };
    
    return statusMap[status] || status || '';
  }
  
  isInjured(): boolean {
    return this.player.status === 'Contundido';
  }
  
  isDoubtful(): boolean {
    return this.player.status === 'Dúvida';
  }
  
  isProbable(): boolean {
    return this.player.status === 'Provável';
  }
  
  isNull(): boolean {
    return this.player.status === 'Nulo';
  }
  
  isSuspended(): boolean {
    return this.player.status === 'Suspenso';
  }

  // Handle logo loading errors
  handleLogoError(event: any): void {
    console.warn(`Logo load error for: ${event.target.alt}`);
    event.target.src = 'assets/clubs/default-team.png';
  }
} 