import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { PlayerCardComponent } from '../player-card/player-card.component';
import { MyTeamPlayer } from '../../models/my-team.model';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    PlayerCardComponent
  ],
  template: `
    <div class="players-list-container">
      <div class="players-list" cdkDropList [cdkDropListData]="players" (cdkDropListDropped)="dropPlayer.emit($event)">
        <div *ngFor="let positionGroup of playersByPosition" class="position-group">
          <div class="position-header">
            <span>{{ getPositionName(positionGroup.position) }}</span>
          </div>
          
          <div class="player-cards-container">
            <div *ngFor="let player of positionGroup.players" 
              class="player-list-item"
              [ngClass]="{'in-lineup': player.inLineup}"
            >
              <app-player-card
                [player]="player"
                [draggable]="draggable"
                (add)="addPlayer.emit(player)"
                (remove)="removePlayer.emit(player)">
              </app-player-card>
            </div>
          </div>
          
          <div *ngIf="positionGroup.players.length === 0" class="no-players-position">
            <p>Nenhum jogador nesta posição</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .players-list-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    
    .players-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      padding: var(--spacing-sm);
      width: 100%;
      height: 100%;
    }
    
    .position-group {
      margin-bottom: 16px;
      width: 100%;
    }
    
    .position-header {
      background-color: var(--light-color);
      padding: 8px 12px;
      font-weight: 500;
      border-radius: 4px;
      margin-bottom: 8px;
      color: var(--primary-color);
      border-left: 4px solid var(--primary-color);
      width: 100%;
      box-sizing: border-box;
    }
    
    .player-cards-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      width: 100%;
    }
    
    .player-list-item {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      margin-bottom: 0;
      position: relative;
      width: calc(50% - 4px);
      box-sizing: border-box;
    }
    
    /* Add responsive layout for smaller screens */
    @media (max-width: 480px) {
      .player-list-item {
        width: 100%;
      }
    }
    
    .player-list-item.cdk-drag-preview {
      box-shadow: var(--shadow-lg);
    }
    
    .player-list-item.cdk-drag-placeholder {
      opacity: 0;
    }
    
    .player-list-item.draggable {
      cursor: move;
    }
    
    .drag-handle {
      position: absolute;
      top: 5px;
      right: 5px;
      z-index: 10;
      color: var(--primary-color);
      background-color: rgba(255,255,255,0.7);
      border-radius: 50%;
      padding: 2px;
    }
    
    .no-players {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl);
      color: var(--text-secondary);
    }
    
    .no-players mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: var(--spacing-md);
      opacity: 0.5;
    }
    
    .no-players-position {
      padding: 8px;
      color: var(--text-secondary);
      font-style: italic;
      font-size: 14px;
    }
  `
})
export class PlayerListComponent {
  @Input() players: MyTeamPlayer[] = [];
  @Input() draggable = false;
  @Output() addPlayer = new EventEmitter<MyTeamPlayer>();
  @Output() removePlayer = new EventEmitter<MyTeamPlayer>();
  @Output() dropPlayer = new EventEmitter<any>();
  
  playersByPosition: { position: string, players: MyTeamPlayer[] }[] = [];
  
  // Ordem das posições para exibição
  private positionOrder = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA', 'TEC'];
  
  ngOnChanges(): void {
    this.groupPlayersByPosition();
  }
  
  private groupPlayersByPosition(): void {
    // Check if there are any players
    if (!this.players || this.players.length === 0) {
      console.log('No players to group', this.players);
      this.playersByPosition = this.positionOrder.map(position => ({
        position,
        players: []
      }));
      return;
    }
    
    console.log('Agrupando jogadores por posição:', this.players.length, 'jogadores');
    console.log('Exemplo de jogador:', this.players[0]);
    
    // Inicializa o array de jogadores por posição
    this.playersByPosition = this.positionOrder.map(position => {
      // Find players matching this position
      const playersInPosition = this.players.filter(player => 
        this.getPositionCode(player) === position
      );
      
      console.log(`Posição ${position}:`, playersInPosition.length, 'jogadores');
      return {
        position,
        players: playersInPosition
      };
    });
  }
  
  // Helper function to determine the position code
  private getPositionCode(player: MyTeamPlayer): string {
    // Check different properties that might contain position info
    const posicao = player.posicao;
    const posicaoAbreviacao = player.posicaoAbreviacao;
    
    console.log(`Verificando posição para ${player.apelido}: posicao=${posicao}, abreviacao=${posicaoAbreviacao}`);
    
    // First, check if posicao is one of our position codes
    if (posicao && this.positionOrder.includes(posicao)) {
      return posicao;
    }
    
    // If posicaoAbreviacao is available, use that
    if (posicaoAbreviacao && this.positionOrder.includes(posicaoAbreviacao)) {
      return posicaoAbreviacao;
    }
    
    // Map full position names to codes
    if (posicao) {
      switch(posicao.toUpperCase()) {
        case 'GOLEIRO': return 'GOL';
        case 'ZAGUEIRO': return 'ZAG';
        case 'LATERAL': return 'LAT';
        case 'MEIA': 
        case 'MEIO-CAMPO': 
        case 'MEIO-CAMPISTA': return 'MEI';
        case 'ATACANTE': return 'ATA';
        case 'TÉCNICO': 
        case 'TECNICO': return 'TEC';
      }
    }
    
    // Default fallback - use numeric codes from Cartola API if any
    if (typeof posicao === 'string' || typeof posicao === 'number') {
      switch(String(posicao)) {
        case '1': return 'GOL';
        case '2': return 'LAT';
        case '3': return 'ZAG';
        case '4': return 'MEI';
        case '5': return 'ATA';
        case '6': return 'TEC';
      }
    }
    
    console.log(`Não foi possível determinar a posição para ${player.apelido}`);
    return 'TEC'; // Default fallback
  }
  
  getPositionName(position: string): string {
    switch (position) {
      case 'GOL': return 'Goleiros';
      case 'ZAG': return 'Zagueiros';
      case 'LAT': return 'Laterais';
      case 'MEI': return 'Meio-campistas';
      case 'ATA': return 'Atacantes';
      case 'TEC': return 'Técnicos';
      default: return position;
    }
  }
} 