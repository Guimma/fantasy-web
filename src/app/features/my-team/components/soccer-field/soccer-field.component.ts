import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MyTeamPlayer, FormationPosition } from '../../models/my-team.model';
import { TeamLogoService } from '../../../../core/services/team-logo.service';

@Component({
  selector: 'app-soccer-field',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    MatIconModule
  ],
  template: `
    <div class="soccer-field">
      <!-- Campo de futebol -->
      <div class="field-background">
        <!-- Linhas do campo -->
        <div class="field-lines">
          <div class="center-circle"></div>
          <div class="center-line"></div>
          <div class="center-spot"></div>
          <div class="penalty-area top">
            <div class="penalty-spot"></div>
          </div>
          <div class="penalty-area bottom">
            <div class="penalty-spot"></div>
          </div>
          <div class="goal-area top"></div>
          <div class="goal-area bottom"></div>
          <div class="arc-container top"></div>
          <div class="arc-container bottom"></div>
        </div>
        
        <!-- Jogadores da escalação -->
        <div class="players-container">
          <div 
            *ngFor="let position of formationPositions" 
            class="player-position"
            [style.left]="position.x + '%'"
            [style.top]="position.y + '%'"
            cdkDropList
            [cdkDropListData]="position"
            (cdkDropListDropped)="onDrop($event, position.id)"
            (cdkDropListEntered)="isDraggingOver = true"
            (cdkDropListExited)="isDraggingOver = false"
            [ngClass]="{'position-empty': !getPlayerInPosition(position.id), 'position-highlight': isDraggingOver }"
          >
            <div 
              *ngIf="getPlayerInPosition(position.id); let player"
              class="player-card" 
              [style.background-color]="getPositionColor(position.type)"
              cdkDrag
              [cdkDragData]="player"
            >
              <img *ngIf="player.foto_url" [src]="getPlayerPhoto(player)" alt="{{ player.apelido }}" class="player-photo">
              <div *ngIf="!player.foto_url" class="player-initials">
                {{ getPlayerInitials(player) }}
              </div>
              <div class="player-info">
                <div class="player-name">{{ player.apelido }}</div>
                <div class="player-position">{{ position.type }}</div>
              </div>
            </div>
            <div *ngIf="!getPlayerInPosition(position.id)" class="empty-position">
              <mat-icon>person_add</mat-icon>
              <span>{{ position.type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .soccer-field {
      width: 100%;
      padding-top: 150%; /* Proporção do campo de futebol */
      position: relative;
      overflow: hidden;
    }
    
    .field-background {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #4caf50;
      background-image: linear-gradient(
        to bottom,
        #4caf50 0%,
        #66bb6a 20%,
        #81c784 40%,
        #81c784 60%,
        #66bb6a 80%,
        #4caf50 100%
      );
      border: 2px solid white;
      border-radius: var(--border-radius);
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
      box-sizing: border-box;
    }
    
    .field-lines {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .center-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border: 2px solid rgba(255, 255, 255, 0.7);
      border-radius: 50%;
    }
    
    .center-line {
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.7);
    }
    
    .center-spot {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      z-index: 2;
    }
    
    .penalty-area {
      position: absolute;
      left: 15%;
      width: 70%;
      height: 20%;
      border: 2px solid rgba(255, 255, 255, 0.7);
      border-top: none;
      border-bottom: none;
    }
    
    .penalty-area.top {
      top: 0;
    }
    
    .penalty-area.top::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.7);
    }
    
    .penalty-area.bottom {
      bottom: 0;
    }
    
    .penalty-area.bottom::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.7);
    }
    
    /* Nova abordagem para os arcos */
    .arc-container {
      position: absolute;
      left: 50%;
      width: 140px;
      height: 120px;
      transform: translateX(-50%);
      overflow: hidden;
    }
    
    .arc-container.top {
      top: 20%;
      height: 50px; /* Aumentado mais alguns pixels */
    }
    
    .arc-container.bottom {
      bottom: 20%;
      height: 50px; /* Aumentado mais alguns pixels */
    }
    
    .arc-container::before {
      content: '';
      position: absolute;
      width: 120px;
      height: 120px;
      border: 2px solid rgba(255, 255, 255, 0.7);
      border-radius: 50%;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .arc-container.top::before {
      top: -76px; /* Ajustado para cima mais alguns pixels */
    }
    
    .arc-container.bottom::before {
      bottom: -76px; /* Ajustado para cima mais alguns pixels */
    }
    
    .penalty-spot {
      position: absolute;
      width: 6px;
      height: 6px;
      background-color: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .penalty-area.top .penalty-spot {
      bottom: 25%;
    }
    
    .penalty-area.bottom .penalty-spot {
      top: 25%;
    }
    
    .goal-area {
      position: absolute;
      left: 30%;
      width: 40%;
      height: 8%;
      border: 2px solid rgba(255, 255, 255, 0.7);
      border-top: none;
      border-bottom: none;
    }
    
    .goal-area.top {
      top: 0;
    }
    
    .goal-area.top::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.7);
    }
    
    .goal-area.bottom {
      bottom: 0;
    }
    
    .goal-area.bottom::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: rgba(255, 255, 255, 0.7);
    }
    
    .players-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .player-position {
      position: absolute;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      z-index: 2;
    }
    
    .position-empty {
      opacity: 0.7;
    }
    
    .player-card {
      width: 50px;
      height: 50px;
      background-color: var(--primary-color);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      overflow: hidden;
      position: relative;
      border: 2px solid white;
      cursor: grab;
    }
    
    .player-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .player-initials {
      font-size: 16px;
      text-align: center;
    }
    
    .player-info {
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px;
      border-radius: 4px;
      font-size: 10px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0;
      transition: opacity 0.3s, bottom 0.3s;
    }
    
    .player-position:hover .player-info {
      opacity: 1;
      bottom: -40px;
    }
    
    .empty-position {
      width: 50px;
      height: 50px;
      background-color: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      border: 2px dashed rgba(255, 255, 255, 0.7);
    }
    
    .empty-position mat-icon {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.8);
    }
    
    .empty-position span {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.8);
      margin-top: 2px;
    }
    
    /* Estilo para destacar posições durante o arrasto */
    .player-position.position-highlight {
      background-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      border: 2px dashed white;
    }
  `
})
export class SoccerFieldComponent {
  @Input() formationPositions: FormationPosition[] = [];
  @Input() players: MyTeamPlayer[] = [];
  @Output() playerDropped = new EventEmitter<{player: MyTeamPlayer, positionId: string}>();
  
  isDraggingOver = false;
  
  constructor(private teamLogoService: TeamLogoService) {}
  
  onDrop(event: CdkDragDrop<any>, positionId: string): void {
    if (!event.item.data) {
      return;
    }
    
    const player = event.item.data as MyTeamPlayer;
    this.playerDropped.emit({player, positionId});
    this.isDraggingOver = false;
  }
  
  getPlayerInPosition(positionId: string): MyTeamPlayer | undefined {
    return this.players.find(player => player.position === positionId);
  }
  
  getPositionColor(positionType: string): string {
    switch (positionType) {
      case 'GOL': return '#e53935'; // Vermelho
      case 'ZAG': return '#1e88e5'; // Azul
      case 'LAT': return '#42a5f5'; // Azul claro
      case 'MEI': return '#7cb342'; // Verde
      case 'ATA': return '#ffa000'; // Laranja
      case 'TEC': return '#6d4c41'; // Marrom
      default: return '#9e9e9e'; // Cinza
    }
  }
  
  getPlayerInitials(player: MyTeamPlayer): string {
    if (!player.nome) {
      return '?';
    }
    
    const nameParts = player.nome.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }
  
  getPlayerPhoto(player: MyTeamPlayer): string {
    // Verificar se a foto é uma URL de clube - se for, usar o serviço de logo
    if (player.foto_url && (player.foto_url.includes('clube') || player.foto_url.includes('team'))) {
      return this.teamLogoService.getTeamLogoPath(player.clubeAbreviacao || player.clube);
    }
    // Verificar se a URL começa com "assets/clubs"
    if (player.foto_url && !player.foto_url.startsWith('http')) {
      if (!player.foto_url.startsWith('assets/')) {
        return `assets/clubs/${player.foto_url}`;
      }
    }
    return player.foto_url || 'assets/clubs/default.png';
  }
} 