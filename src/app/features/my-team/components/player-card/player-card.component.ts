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
           'player-null': isNull()
         }" 
         cdkDrag [cdkDragData]="player" *ngIf="draggable; else nonDraggable">
      <div class="player-card-content">
        <div class="team-logo">
          <img [src]="getClubShieldUrl()" [alt]="player.clube" class="team-logo-img" (error)="handleLogoError($event)">
        </div>
        <div class="player-info">
          <div class="player-name-row">
            <div class="player-name" [matTooltip]="player.apelido">{{ player.apelido }}</div>
            <div *ngIf="hasPontuacao()" class="player-points">{{ getPontuacao() | number:'1.1-1' }}</div>
          </div>
          <div class="player-meta">
            <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
              {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
            </span>
            <span class="player-price">C$ {{ (player.preco || 0).toFixed(1) }}</span>
          </div>
          <div *ngIf="player.status" class="player-status" [attr.data-status]="player.status">
            {{ getStatusLabel(player.status) }}
          </div>
        </div>
        
        <div class="drag-handle">
          <mat-icon>drag_indicator</mat-icon>
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
             'player-null': isNull()
           }">
        <div class="player-card-content">
          <div class="team-logo">
            <img [src]="getClubShieldUrl()" [alt]="player.clube" class="team-logo-img" (error)="handleLogoError($event)">
          </div>
          <div class="player-info">
            <div class="player-name-row">
              <div class="player-name" [matTooltip]="player.apelido">{{ player.apelido }}</div>
              <div *ngIf="hasPontuacao()" class="player-points">{{ getPontuacao() | number:'1.1-1' }}</div>
            </div>
            <div class="player-meta">
              <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
                {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
              </span>
              <span class="player-price">C$ {{ (player.preco || 0).toFixed(1) }}</span>
            </div>
            <div *ngIf="player.status" class="player-status" [attr.data-status]="player.status">
              {{ getStatusLabel(player.status) }}
            </div>
          </div>
          
          <div class="player-actions" *ngIf="!isInjured()">
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
    
    .player-card.player-injured {
      background-color: #ffebee;
      border-left: 3px solid #f44336;
    }
    
    .player-card.player-doubtful {
      background-color: #fff8e1;
      border-left: 3px solid #ffc107;
    }
    
    .player-card.player-probable {
      background-color: #e8f5e9;
      border-left: 3px solid #4caf50;
    }
    
    .player-card.player-null {
      background-color: #f5f5f5;
      border-left: 3px solid #9e9e9e;
    }

    .player-card-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .team-logo {
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background-color: white;
      border-radius: 50%;
      padding: 2px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
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

    .player-name-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .player-name {
      font-weight: 500;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(100% - 45px);
    }
    
    .player-points {
      font-weight: 700;
      font-size: 15px;
      color: var(--primary-color);
      background-color: rgba(33, 150, 243, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      min-width: 35px;
      text-align: center;
    }

    .player-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    
    .player-status {
      margin-top: 4px;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      font-weight: 500;
    }
    
    .player-status[data-status="Contundido"] {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .player-status[data-status="Dúvida"] {
      background-color: #fff8e1;
      color: #ff8f00;
    }
    
    .player-status[data-status="Suspenso"] {
      background-color: #e8eaf6;
      color: #3949ab;
    }
    
    .player-status[data-status="Provável"] {
      background-color: #e8f5e9;
      color: #2e7d32;
    }
    
    .player-status[data-status="Nulo"] {
      background-color: #f5f5f5;
      color: #757575;
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
      console.log(`Usando logo especial para ${cleanClubCode}: ${this.player.apelido}`);
      return specialClubs[cleanClubCode];
    }
    
    console.log(`Buscando logo para clube ${cleanClubCode}: ${this.player.apelido}`);
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

  // Handle logo loading errors
  handleLogoError(event: any): void {
    console.warn(`Logo load error for: ${event.target.alt}`);
    event.target.src = 'assets/clubs/default-team.png';
  }
} 