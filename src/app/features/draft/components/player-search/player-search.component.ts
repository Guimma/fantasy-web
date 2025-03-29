import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
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
import { TeamLogoService } from '../../../../core/services/team-logo.service';

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
            <mat-card class="player-card">
              <mat-card-content>
                <div class="player-card-content">
                  <div class="player-main-info">
                    <div class="team-logo">
                      <img [src]="getTeamLogo(player.clube)" [alt]="player.clube || 'Time'" class="team-logo-img">
                    </div>
                    <div class="player-details">
                      <span class="player-name">{{ player.apelido || player.nome || 'Sem nome' }}</span>
                      <div class="player-meta">
                        <span class="player-position" [attr.data-position]="getPositionCode(player.posicao)">
                          {{ (player.posicaoAbreviacao || player.posicao || 'SEM').toUpperCase() }}
                        </span>
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
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .section-title {
      margin: 0;
      padding: 16px 16px 8px 16px;
      color: var(--primary-color);
      font-size: 20px;
      font-weight: 500;
      flex-shrink: 0;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 24px;
      flex-shrink: 0;
    }

    .search-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .search-filters {
      padding: 0 16px;
      margin-bottom: 8px;
      flex-shrink: 0;
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
      background-color: var(--light-color);
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
    }

    mat-divider {
      margin: 8px 0;
    }

    .results-count {
      padding: 8px 16px;
      font-size: 14px;
      color: #757575;
    }

    .players-list {
      padding: 0 16px 16px;
      overflow-y: auto;
      flex: 1;
    }

    .player-item {
      margin-bottom: 12px;
    }

    .player-item:last-child {
      margin-bottom: 0;
    }

    .player-card {
      background-color: white;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid rgba(0,0,0,0.06);
    }

    .player-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .player-card-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
    }

    .player-main-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .team-logo {
      width: 36px;
      height: 36px;
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

    .player-details {
      display: flex;
      flex-direction: column;
    }

    .player-name {
      font-weight: 500;
      font-size: 16px;
      margin-bottom: 4px;
    }

    .player-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
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

    .player-actions {
      display: flex;
      align-items: center;
    }

    .empty-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      text-align: center;
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

      .players-list {
        height: auto;
        max-height: 400px;
      }
    }
  `
})
export class PlayerSearchComponent implements OnChanges, OnInit {
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

  constructor(private teamLogoService: TeamLogoService) {}

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

  // Método para obter o código da posição a partir do nome completo
  getPositionCode(position: string): string {
    if (!position) return 'SEM';
    
    const positionMap: Record<string, string> = {
      'Goleiro': 'GOL',
      'Lateral': 'LAT',
      'Zagueiro': 'ZAG',
      'Meia': 'MEI',
      'Atacante': 'ATA',
      'Técnico': 'TEC',
      'Tecnico': 'TEC',
      // Já retorna a posição se ela já for uma abreviação
      'GOL': 'GOL',
      'LAT': 'LAT',
      'ZAG': 'ZAG',
      'MEI': 'MEI',
      'ATA': 'ATA',
      'TEC': 'TEC'
    };
    
    return positionMap[position] || 'SEM';
  }

  // Método para obter a URL da logo do time
  getTeamLogo(club: string): string {
    return this.teamLogoService.getTeamLogoPath(club);
  }
} 