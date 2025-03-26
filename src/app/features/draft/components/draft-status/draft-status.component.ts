import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { DraftStatus, DraftTeam } from '../../models/draft.model';

@Component({
  selector: 'app-draft-status',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="status-card">
      <mat-card-header>
        <mat-card-title>Status do Draft</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="status-item">
          <div class="status-label">Estado:</div>
          <div class="status-value">
            <mat-chip color="{{ getStatusColor() }}" selected>{{ getStatusText() }}</mat-chip>
          </div>
        </div>
        
        <div class="status-item" *ngIf="status === 'in_progress'">
          <div class="status-label">Time atual:</div>
          <div class="status-value highlight">{{ currentTeam?.name || 'Carregando...' }}</div>
        </div>
        
        <div class="status-item" *ngIf="status === 'in_progress'">
          <div class="status-label">Rodada:</div>
          <div class="status-value">{{ currentRound }}</div>
        </div>
        
        <div class="status-item" *ngIf="status === 'in_progress'">
          <div class="status-label">Escolha:</div>
          <div class="status-value">{{ currentOrderIndex + 1 }}</div>
        </div>
        
        <div class="status-item" *ngIf="status === 'not_started'">
          <div class="status-label">Formato:</div>
          <div class="status-value">Snake Draft (ordem invertida a cada rodada)</div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .status-card {
      width: 100%;
      margin-bottom: 20px;
    }
    
    .status-item {
      display: flex;
      margin-bottom: 12px;
    }
    
    .status-label {
      font-weight: 500;
      width: 100px;
      flex-shrink: 0;
    }
    
    .status-value {
      flex-grow: 1;
    }
    
    .status-value.highlight {
      font-weight: 500;
      color: #3f51b5;
    }
  `
})
export class DraftStatusComponent {
  @Input() status: DraftStatus = 'not_started';
  @Input() currentTeam: DraftTeam | null = null;
  @Input() currentRound = 0;
  @Input() currentOrderIndex = -1;
  
  getStatusText(): string {
    switch (this.status) {
      case 'not_started':
        return 'Aguardando Início';
      case 'in_progress':
        return 'Em Andamento';
      case 'finished':
        return 'Finalizado';
      default:
        return 'Desconhecido';
    }
  }
  
  getStatusColor(): string {
    switch (this.status) {
      case 'not_started':
        return 'primary';
      case 'in_progress':
        return 'accent';
      case 'finished':
        return 'warn';
      default:
        return 'primary';
    }
  }
} 