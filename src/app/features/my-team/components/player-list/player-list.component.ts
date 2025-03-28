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
      <div class="filters">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filtrar por posição</mat-label>
          <mat-select [(value)]="positionFilter" (selectionChange)="applyFilters()">
            <mat-option value="all">Todas</mat-option>
            <mat-option value="GOL">Goleiros</mat-option>
            <mat-option value="ZAG">Zagueiros</mat-option>
            <mat-option value="LAT">Laterais</mat-option>
            <mat-option value="MEI">Meio-campistas</mat-option>
            <mat-option value="ATA">Atacantes</mat-option>
            <mat-option value="TEC">Técnicos</mat-option>
          </mat-select>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar jogador</mat-label>
          <input matInput [(ngModel)]="searchTerm" (input)="applyFilters()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>
      
      <div class="players-list" cdkDropList [cdkDropListData]="filteredPlayers" (cdkDropListDropped)="dropPlayer.emit($event)">
        <div 
          *ngFor="let player of filteredPlayers" 
          class="player-list-item"
          [ngClass]="{'in-lineup': player.inLineup}"
          cdkDrag
          [cdkDragData]="player"
        >
          <app-player-card
            [player]="player"
            (add)="addPlayer.emit(player)"
            (remove)="removePlayer.emit(player)"
          ></app-player-card>
        </div>
        
        <div *ngIf="filteredPlayers.length === 0" class="no-players">
          <mat-icon>sentiment_dissatisfied</mat-icon>
          <p>Nenhum jogador encontrado.</p>
        </div>
      </div>
    </div>
  `,
  styles: `
    .players-list-container {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    
    .filters {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }
    
    .filter-field {
      flex: 1;
    }
    
    .players-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      max-height: 500px;
      overflow-y: auto;
      padding: var(--spacing-sm);
    }
    
    .player-list-item {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .player-list-item.cdk-drag-preview {
      box-shadow: var(--shadow-lg);
    }
    
    .player-list-item.cdk-drag-placeholder {
      opacity: 0;
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
  `
})
export class PlayerListComponent {
  @Input() players: MyTeamPlayer[] = [];
  @Output() addPlayer = new EventEmitter<MyTeamPlayer>();
  @Output() removePlayer = new EventEmitter<MyTeamPlayer>();
  @Output() dropPlayer = new EventEmitter<any>();
  
  positionFilter = 'all';
  searchTerm = '';
  filteredPlayers: MyTeamPlayer[] = [];
  
  ngOnChanges(): void {
    this.applyFilters();
  }
  
  applyFilters(): void {
    this.filteredPlayers = this.players.filter(player => {
      // Filter by position
      if (this.positionFilter !== 'all' && player.posicao !== this.positionFilter) {
        return false;
      }
      
      // Filter by search term
      if (this.searchTerm.trim() !== '') {
        const searchTermLower = this.searchTerm.trim().toLowerCase();
        return (
          player.nome.toLowerCase().includes(searchTermLower) ||
          player.apelido.toLowerCase().includes(searchTermLower) ||
          player.clube.toLowerCase().includes(searchTermLower)
        );
      }
      
      return true;
    });
  }
} 