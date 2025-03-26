import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { DraftTeam, Athlete } from '../../models/draft.model';

interface DialogData {
  team: DraftTeam;
  availablePlayers: Athlete[];
  requiredPositions: Record<string, number>;
}

@Component({
  selector: 'app-player-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>Selecionar Jogador para {{ data.team.name }}</h2>
    
    <mat-dialog-content>
      <div class="filter-section">
        <mat-form-field class="search-field">
          <mat-label>Buscar Jogador</mat-label>
          <input matInput [(ngModel)]="searchText" placeholder="Nome, posição ou clube" (input)="applyFilter()">
        </mat-form-field>
        
        <mat-form-field class="position-filter">
          <mat-label>Posição</mat-label>
          <mat-select [(ngModel)]="positionFilter" (selectionChange)="applyFilter()">
            <mat-option value="">Todas</mat-option>
            <mat-option value="GOL">Goleiro</mat-option>
            <mat-option value="LAT">Lateral</mat-option>
            <mat-option value="ZAG">Zagueiro</mat-option>
            <mat-option value="MEI">Meio-Campo</mat-option>
            <mat-option value="ATA">Atacante</mat-option>
            <mat-option value="TEC">Técnico</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      
      <div class="team-summary">
        <h3>Elenco Atual</h3>
        <div class="position-chips">
          <span class="position-chip" 
                [class.complete]="getPositionCount('GOL') >= data.requiredPositions['GOL']">
            Goleiros: {{ getPositionCount('GOL') }}/{{ data.requiredPositions['GOL'] }}
          </span>
          <span class="position-chip" 
                [class.complete]="getPositionCount('LAT') >= data.requiredPositions['LAT']">
            Laterais: {{ getPositionCount('LAT') }}/{{ data.requiredPositions['LAT'] }}
          </span>
          <span class="position-chip" 
                [class.complete]="getPositionCount('ZAG') >= data.requiredPositions['ZAG']">
            Zagueiros: {{ getPositionCount('ZAG') }}/{{ data.requiredPositions['ZAG'] }}
          </span>
          <span class="position-chip" 
                [class.complete]="getPositionCount('MEI') >= data.requiredPositions['MEI']">
            Meias: {{ getPositionCount('MEI') }}/{{ data.requiredPositions['MEI'] }}
          </span>
          <span class="position-chip" 
                [class.complete]="getPositionCount('ATA') >= data.requiredPositions['ATA']">
            Atacantes: {{ getPositionCount('ATA') }}/{{ data.requiredPositions['ATA'] }}
          </span>
          <span class="position-chip" 
                [class.complete]="getPositionCount('TEC') >= data.requiredPositions['TEC']">
            Técnicos: {{ getPositionCount('TEC') }}/{{ data.requiredPositions['TEC'] }}
          </span>
        </div>
      </div>
      
      <div class="players-table-container">
        <table class="players-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Posição</th>
              <th>Clube</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let player of filteredPlayers">
              <td>{{ player.nome }}</td>
              <td>{{ formatPosition(player.posicao) }}</td>
              <td>{{ player.clube }}</td>
              <td>
                <button mat-raised-button color="primary" (click)="selectPlayer(player)">
                  Selecionar
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredPlayers.length === 0">
              <td colspan="4" class="no-results">
                Nenhum jogador encontrado. Tente ajustar os filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .filter-section {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .search-field {
      flex: 2;
    }
    
    .position-filter {
      flex: 1;
    }
    
    .team-summary {
      margin-bottom: 24px;
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
    }
    
    .team-summary h3 {
      margin-top: 0;
      margin-bottom: 12px;
    }
    
    .position-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .position-chip {
      background-color: #e0e0e0;
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 14px;
    }
    
    .position-chip.complete {
      background-color: #c8e6c9;
      color: #2e7d32;
    }
    
    .players-table-container {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 16px;
    }
    
    .players-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .players-table th, .players-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .players-table th {
      background-color: #f5f5f5;
      font-weight: 500;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    
    .no-results {
      text-align: center;
      padding: 24px;
      color: #757575;
    }
  `
})
export class PlayerSelectionDialogComponent implements OnInit {
  searchText = '';
  positionFilter = '';
  filteredPlayers: Athlete[] = [];

  constructor(
    public dialogRef: MatDialogRef<PlayerSelectionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    this.filteredPlayers = [...this.data.availablePlayers];
  }

  applyFilter(): void {
    let filtered = [...this.data.availablePlayers];
    
    // Aplicar filtro de texto
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.nome.toLowerCase().includes(search) || 
        this.formatPosition(player.posicao).toLowerCase().includes(search) || 
        player.clube.toLowerCase().includes(search)
      );
    }
    
    // Aplicar filtro de posição
    if (this.positionFilter) {
      filtered = filtered.filter(player => player.posicao === this.positionFilter);
    }
    
    this.filteredPlayers = filtered;
  }

  selectPlayer(player: Athlete): void {
    this.dialogRef.close(player);
  }

  getPositionCount(position: string): number {
    return this.data.team.players.filter(player => player.posicao === position).length;
  }

  formatPosition(position: string): string {
    const positions: Record<string, string> = {
      'GOL': 'Goleiro',
      'LAT': 'Lateral',
      'ZAG': 'Zagueiro',
      'MEI': 'Meio-Campo',
      'ATA': 'Atacante',
      'TEC': 'Técnico'
    };
    
    return positions[position] || position;
  }
} 