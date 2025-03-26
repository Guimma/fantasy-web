import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Athlete } from '../../models/draft.model';
import { DraftStatus } from '../../models/draft.model';

@Component({
  selector: 'app-player-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="player-search-container">
      <h2 class="section-title">Buscar Jogadores</h2>

      <div *ngIf="isLoading" class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!isLoading" class="search-content">
        <!-- Search Filters -->
        <div class="search-filters">
          <mat-form-field appearance="outline" class="search-input">
            <mat-label>Buscar jogador</mat-label>
            <input 
              matInput 
              type="text" 
              [formControl]="searchControl"
              placeholder="Nome do jogador"
            >
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <div class="filter-row">
            <mat-form-field appearance="outline" class="position-filter">
              <mat-label>Posição</mat-label>
              <mat-select [formControl]="positionControl">
                <mat-option value="">Todas</mat-option>
                <mat-option value="G">Goleiro</mat-option>
                <mat-option value="Z">Zagueiro</mat-option>
                <mat-option value="L">Lateral</mat-option>
                <mat-option value="M">Meia</mat-option>
                <mat-option value="A">Atacante</mat-option>
                <mat-option value="T">Técnico</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="club-filter">
              <mat-label>Clube</mat-label>
              <mat-select [formControl]="clubControl">
                <mat-option value="">Todos</mat-option>
                <mat-option *ngFor="let club of uniqueClubs" [value]="club">
                  {{ club }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="active-filters" *ngIf="hasActiveFilters">
            <div class="filter-chips">
              <div *ngIf="searchControl.value" class="filter-chip">
                <span class="filter-text">{{ searchControl.value }}</span>
                <button mat-icon-button (click)="searchControl.setValue('')">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div *ngIf="positionControl.value" class="filter-chip">
                <span class="filter-text">{{ getPositionLabel(positionControl.value) }}</span>
                <button mat-icon-button (click)="positionControl.setValue('')">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
              <div *ngIf="clubControl.value" class="filter-chip">
                <span class="filter-text">{{ clubControl.value }}</span>
                <button mat-icon-button (click)="clubControl.setValue('')">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
            <button 
              mat-button 
              color="primary" 
              (click)="clearFilters()">
              Limpar filtros
            </button>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Results Count -->
        <div class="results-count">
          <span>{{ filteredPlayers.length }} jogadores encontrados</span>
        </div>

        <!-- Players List -->
        <div class="players-list" *ngIf="filteredPlayers.length > 0">
          <div *ngFor="let player of filteredPlayers" class="player-item">
            <mat-card>
              <mat-card-content>
                <div class="player-card-content">
                  <div class="player-main-info">
                    <div class="player-position" [attr.data-position]="player.posicao || 'SEM'">
                      {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
                    </div>
                    <div class="player-details">
                      <span class="player-name">{{ player.apelido || player.nome || 'Sem nome' }}</span>
                      <div class="player-meta">
                        <span class="player-club">{{ player.clube || 'Sem clube' }}</span>
                        <span class="player-price">R$ {{ (player.preco || 0).toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="player-actions">
                    <button 
                      mat-mini-fab 
                      color="primary"
                      [disabled]="!canSelectPlayer()"
                      (click)="selectPlayer(player)"
                      [matTooltip]="getSelectTooltip()">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredPlayers.length === 0" class="empty-results">
          <mat-icon>search_off</mat-icon>
          <p>Nenhum jogador encontrado com os filtros atuais</p>
          <button mat-button color="primary" (click)="clearFilters()">Limpar filtros</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .player-search-container {
      padding: 16px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .section-title {
      margin: 0 0 16px 0;
      color: #3f51b5;
      font-size: 20px;
      font-weight: 500;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px;
    }

    .search-content {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .search-filters {
      margin-bottom: 16px;
    }

    .search-input {
      width: 100%;
    }

    .filter-row {
      display: flex;
      gap: 12px;
    }

    .position-filter, .club-filter {
      flex: 1;
    }

    .active-filters {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .filter-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      background-color: #e3f2fd;
      border-radius: 16px;
      padding: 4px 8px 4px 12px;
      font-size: 14px;
    }

    .filter-text {
      flex: 1;
    }

    .filter-chip button {
      width: 24px;
      height: 24px;
      line-height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
    }

    .filter-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    mat-divider {
      margin-bottom: 16px;
    }

    .results-count {
      margin-bottom: 16px;
      font-size: 14px;
      color: #757575;
    }

    .players-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow-y: auto;
    }

    .player-item {
      border-radius: 4px;
    }

    mat-card {
      padding: 0;
    }

    mat-card-content {
      padding: 12px !important; /* Override Material padding */
      margin-bottom: 0;
    }

    .player-card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .player-main-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .player-position {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      color: white;
      background-color: #aaa;
    }

    .player-position[data-position="GOL"] {
      background-color: #ffeb3b;
      color: #000;
    }

    .player-position[data-position="LAT"] {
      background-color: #4caf50;
      color: white;
    }

    .player-position[data-position="ZAG"] {
      background-color: #2196f3;
      color: white;
    }

    .player-position[data-position="MEI"] {
      background-color: #ff9800;
      color: #000;
    }

    .player-position[data-position="ATA"] {
      background-color: #f44336;
      color: white;
    }

    .player-position[data-position="TEC"] {
      background-color: #607d8b;
      color: white;
    }

    .player-position[data-position="SEM"] {
      background-color: #9e9e9e;
      color: white;
    }

    .player-details {
      display: flex;
      flex-direction: column;
    }

    .player-name {
      font-weight: 500;
    }

    .player-meta {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 13px;
      color: #757575;
    }

    .player-club {
      font-size: 13px;
      color: #757575;
    }

    .empty-results {
      padding: 32px 16px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #757575;
    }

    .empty-results mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }

    @media (max-width: 768px) {
      .filter-row {
        flex-direction: column;
        gap: 0;
      }
    }

    .player-actions {
      display: flex;
      align-items: center;
    }

    .player-actions button {
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      width: 36px;
      height: 36px;
      line-height: 36px;
    }

    .player-actions mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `
})
export class PlayerSearchComponent implements OnChanges {
  @Input() availablePlayers: Athlete[] = [];
  @Input() isCurrentTeamTurn: boolean = false;
  @Input() isLoading: boolean = false;
  @Input() draftStatus: DraftStatus = 'not_started';
  @Output() playerSelected = new EventEmitter<Athlete>();

  searchControl = new FormControl('');
  positionControl = new FormControl('');
  clubControl = new FormControl('');

  filteredPlayers: Athlete[] = [];
  uniqueClubs: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availablePlayers']) {
      // Ordenar jogadores por preço (do maior para o menor)
      this.availablePlayers.sort((a, b) => (b.preco || 0) - (a.preco || 0));
      
      this.filteredPlayers = [...this.availablePlayers];
      this.extractUniqueClubs();
      this.applyFilters();
      
      // Logar o primeiro jogador para verificação de dados
      if (this.availablePlayers.length > 0) {
        console.log('Exemplo de objeto de jogador:', this.availablePlayers[0]);
        console.log('Preço do jogador mais caro:', this.availablePlayers[0].preco);
        
        // Contar jogadores por posição
        const positionCount: Record<string, number> = {};
        this.availablePlayers.forEach(player => {
          const pos = player.posicao || 'Desconhecida';
          positionCount[pos] = (positionCount[pos] || 0) + 1;
        });
        console.log('Contagem de jogadores por posição:', positionCount);
      }
    }
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.positionControl.valueChanges.subscribe(() => this.applyFilters());
    this.clubControl.valueChanges.subscribe(() => this.applyFilters());
    
    // Logar informações sobre os valores do filtro de posição para depuração
    this.positionControl.valueChanges.subscribe(value => {
      console.log('Filtro de posição alterado para:', value);
      if (this.availablePlayers.length > 0) {
        const primeiroJogador = this.availablePlayers[0];
        console.log('Exemplo de jogador - posição:', primeiroJogador.posicao);
        console.log('Exemplo de jogador - posicaoAbreviacao:', primeiroJogador.posicaoAbreviacao);
      }
    });
  }

  extractUniqueClubs(): void {
    const clubs = new Set<string>();
    this.availablePlayers.forEach(player => clubs.add(player.clube));
    this.uniqueClubs = Array.from(clubs).sort();
  }

  applyFilters(): void {
    const searchValue = this.searchControl.value?.toLowerCase() || '';
    const positionValue = this.positionControl.value || '';
    const clubValue = this.clubControl.value || '';

    this.filteredPlayers = this.availablePlayers.filter(player => {
      // Verificar correspondência no nome ou apelido
      const nameMatch = (player.nome?.toLowerCase().includes(searchValue) || 
                         player.apelido?.toLowerCase().includes(searchValue));
      
      // Verificar se a posição corresponde - usando a propriedade posicao
      let positionMatch = !positionValue; // Se não houver filtro, retorna true
      
      if (positionValue) {
        // Mapeamento de abreviações para textos completos de posição
        const positionMapping: Record<string, string> = {
          'G': 'Goleiro',
          'Z': 'Zagueiro',
          'L': 'Lateral',
          'M': 'Meia',
          'A': 'Atacante',
          'T': 'Técnico'
        };
        
        const fullPosition = positionMapping[positionValue] || '';
        
        // Verificar se a posição do jogador contém o texto completo da posição
        positionMatch = player.posicao?.includes(fullPosition) || false;
      }
      
      // Verificar correspondência do clube
      const clubMatch = !clubValue || player.clube === clubValue;
      
      return nameMatch && positionMatch && clubMatch;
    });
    
    // Garantir que os jogadores filtrados permaneçam ordenados por preço
    this.filteredPlayers.sort((a, b) => (b.preco || 0) - (a.preco || 0));
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.positionControl.setValue('');
    this.clubControl.setValue('');
  }

  getPositionLabel(position: string): string {
    const positions: Record<string, string> = {
      'G': 'Goleiro',
      'Z': 'Zagueiro',
      'L': 'Lateral',
      'M': 'Meia',
      'A': 'Atacante',
      'T': 'Técnico'
    };
    
    return positions[position] || position;
  }

  selectPlayer(player: Athlete): void {
    if (this.canSelectPlayer()) {
      this.playerSelected.emit(player);
    }
  }

  canSelectPlayer(): boolean {
    return this.isCurrentTeamTurn && this.draftStatus === 'in_progress';
  }

  getSelectTooltip(): string {
    if (this.draftStatus !== 'in_progress') {
      return 'Draft não está em andamento';
    }
    
    if (!this.isCurrentTeamTurn) {
      return 'Não é a vez do seu time';
    }
    
    return 'Selecionar este jogador';
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchControl.value || this.positionControl.value || this.clubControl.value);
  }
} 