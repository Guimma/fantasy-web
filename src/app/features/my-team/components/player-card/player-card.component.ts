import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MyTeamPlayer } from '../../models/my-team.model';
import { TeamLogoService } from '../../../../core/services/team-logo.service';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="player-card" [ngClass]="{'in-lineup': player.inLineup}">
      <div class="player-image">
        <img *ngIf="player.foto_url" [src]="getPlayerPhoto(player)" alt="{{ player.apelido }}" class="player-photo">
        <div *ngIf="!player.foto_url" class="player-initials">
          {{ getPlayerInitials() }}
        </div>
      </div>
      <div class="player-info">
        <div class="player-name">{{ player.apelido }}</div>
        <div class="player-details">
          <span class="player-position">{{ player.posicao }}</span>
          <span class="player-club">
            <img [src]="getClubShieldUrl()" alt="{{ player.clubeAbreviacao }}" class="club-shield">
            {{ player.clubeAbreviacao }}
          </span>
        </div>
        <div class="player-stats">
          <span class="player-price">C$ {{ player.preco }}</span>
          <span class="player-points">{{ player.mediaPontos }} pts</span>
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
  `,
  styles: `
    .player-card {
      width: 100%;
      background-color: white;
      border-radius: var(--border-radius);
      padding: var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      box-shadow: var(--shadow-sm);
      transition: all 0.3s ease;
    }
    
    .player-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }
    
    .player-card.in-lineup {
      background-color: var(--primary-light);
      border-left: 4px solid var(--primary-color);
    }
    
    .player-image {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }
    
    .player-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border: 1px solid #eee;
    }
    
    .player-initials {
      width: 100%;
      height: 100%;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 18px;
      font-weight: bold;
    }
    
    .player-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .player-name {
      font-weight: bold;
      font-size: 16px;
    }
    
    .player-details, .player-stats {
      display: flex;
      gap: var(--spacing-md);
      color: var(--text-secondary);
      font-size: 14px;
    }
    
    .player-position {
      background-color: var(--primary-light);
      color: var(--primary-color);
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .player-club {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .club-shield {
      width: 16px;
      height: 16px;
      object-fit: contain;
    }
    
    .player-price {
      font-weight: bold;
      color: #4caf50;
    }
    
    .player-points {
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .player-actions {
      display: flex;
      gap: var(--spacing-xs);
    }
  `
})
export class PlayerCardComponent {
  @Input() player!: MyTeamPlayer;
  @Output() add = new EventEmitter<MyTeamPlayer>();
  @Output() remove = new EventEmitter<MyTeamPlayer>();
  
  constructor(private teamLogoService: TeamLogoService) {}
  
  addPlayer(): void {
    this.add.emit(this.player);
  }
  
  removePlayer(): void {
    this.remove.emit(this.player);
  }
  
  getPlayerInitials(): string {
    if (!this.player.nome) {
      return '?';
    }
    
    const nameParts = this.player.nome.split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }
  
  getClubShieldUrl(): string {
    if (!this.player.clubeAbreviacao) {
      return 'assets/clubs/default.png';
    }
    return this.teamLogoService.getTeamLogoPath(this.player.clubeAbreviacao);
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