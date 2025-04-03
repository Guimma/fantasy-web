import { Component, OnInit, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TeamHistoryService } from '../../services/team-history.service';
import { PontuacaoService } from '../../services/pontuacao.service';
import { MyTeamService } from '../../services/my-team.service';
import { TeamRoundHistory } from '../../models/team-history.model';
import { Rodada } from '../../models/pontuacao.model';

@Component({
  selector: 'app-team-history',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Histórico do Meu Time</mat-card-title>
        <mat-card-subtitle>Visualize a composição do seu time em rodadas anteriores</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="round-selector">
          <mat-form-field>
            <mat-label>Selecione a Rodada</mat-label>
            <mat-select [formControl]="rodadaControl">
              <mat-option *ngFor="let rodada of rodadasDisponiveis" [value]="rodada.id">
                {{ rodada.nome }}
              </mat-option>
            </mat-select>
          </mat-form-field>
          
          <button mat-raised-button color="primary" (click)="buscarHistorico()">
            Buscar Histórico
          </button>
        </div>
        
        <div *ngIf="carregando" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Carregando histórico...</p>
        </div>
        
        <div *ngIf="!carregando && !historicoTime && rodadaSelecionada" class="no-history">
          <mat-icon>info</mat-icon>
          <p>Histórico não encontrado para a rodada {{ rodadaSelecionada }}.</p>
        </div>
        
        <div *ngIf="!carregando && historicoTime" class="history-content">
          <h3>Time na Rodada {{ historicoTime.rodadaId }}</h3>
          <p class="history-date">Salvo em: {{ historicoTime.dataRegistro | date:'dd/MM/yyyy HH:mm' }}</p>
          
          <table mat-table [dataSource]="historicoTime.jogadores" class="mat-elevation-z2">
            <ng-container matColumnDef="posicao">
              <th mat-header-cell *matHeaderCellDef>Posição</th>
              <td mat-cell *matCellDef="let jogador">{{ jogador.posicaoAbreviacao }}</td>
            </ng-container>
            
            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let jogador">{{ jogador.apelido }}</td>
            </ng-container>
            
            <ng-container matColumnDef="clube">
              <th mat-header-cell *matHeaderCellDef>Clube</th>
              <td mat-cell *matCellDef="let jogador">{{ jogador.clube }}</td>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let jogador">{{ jogador.status }}</td>
            </ng-container>
            
            <ng-container matColumnDef="preco">
              <th mat-header-cell *matHeaderCellDef>Preço</th>
              <td mat-cell *matCellDef="let jogador">{{ jogador.preco | number:'1.2-2' }}</td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="colunas"></tr>
            <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
          </table>
        </div>
      </mat-card-content>
      
      <mat-card-actions *ngIf="rodadaAtual && rodadaSelecionada !== rodadaAtual.id">
        <!-- Botão de exportar CSV removido conforme solicitado -->
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .round-selector {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
    }
    
    .no-history {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px;
      color: #888;
    }
    
    .no-history mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
    
    .history-content {
      margin-top: 20px;
    }
    
    .history-date {
      color: #666;
      font-style: italic;
      margin-bottom: 16px;
    }
    
    table {
      width: 100%;
    }
  `]
})
export class TeamHistoryComponent implements OnInit {
  private teamHistoryService = inject(TeamHistoryService);
  private pontuacaoService = inject(PontuacaoService);
  private myTeamService = inject(MyTeamService);
  
  rodadasDisponiveis: Rodada[] = [];
  rodadaSelecionada: number | null = null;
  rodadaAtual: Rodada | null = null;
  timeId: string | null = null;
  
  historicoTime: TeamRoundHistory | null = null;
  carregando = false;
  
  rodadaControl = new FormControl<number | null>(null);
  colunas = ['posicao', 'nome', 'clube', 'status', 'preco'];
  
  ngOnInit(): void {
    // Carregar rodadas disponíveis
    this.carregarRodadas();
    
    // Carregar time do usuário
    this.myTeamService.getMyTeam().subscribe(team => {
      if (team) {
        this.timeId = team.id;
      }
    });
  }
  
  carregarRodadas(): void {
    this.carregando = true;
    
    this.pontuacaoService.getRodadaAtual().subscribe(rodadaAtual => {
      this.rodadaAtual = rodadaAtual;
      
      // Criar lista de rodadas (da rodada 0 até a atual)
      this.rodadasDisponiveis = [];
      
      // Adicionar rodada 0 (Pós-Draft)
      this.rodadasDisponiveis.push({
        id: 0,
        nome: 'Rodada 0 (Pós-Draft)',
        inicio: new Date(),
        fim: new Date(),
        status: 'finalizada'
      });
      
      // Adicionar todas as rodadas até a atual
      for (let i = 1; i <= rodadaAtual.id; i++) {
        this.rodadasDisponiveis.push({
          id: i,
          nome: `Rodada ${i}`,
          inicio: new Date(),
          fim: new Date(),
          status: i < rodadaAtual.id ? 'finalizada' : rodadaAtual.status
        });
      }
      
      // Selecionar a rodada atual por padrão
      this.rodadaControl.setValue(rodadaAtual.id);
      this.carregando = false;
    });
  }
  
  buscarHistorico(): void {
    this.rodadaSelecionada = this.rodadaControl.value;
    
    if (!this.rodadaSelecionada || this.rodadaSelecionada < 0 || !this.timeId) {
      return;
    }
    
    this.carregando = true;
    this.historicoTime = null;
    
    this.teamHistoryService.getTimeHistoricoRodada(this.timeId, this.rodadaSelecionada)
      .subscribe(historico => {
        this.historicoTime = historico;
        this.carregando = false;
      });
  }
  
  exportarCSV(): void {
    if (!this.historicoTime) {
      return;
    }
    
    // Criar conteúdo CSV
    const headers = ['ID', 'Nome', 'Posição', 'Clube', 'Status', 'Preço'];
    
    const csvContent = [
      headers.join(','),
      ...this.historicoTime.jogadores.map(jogador => [
        jogador.idCartola,
        `"${jogador.apelido}"`,
        jogador.posicao,
        `"${jogador.clube}"`,
        jogador.status,
        jogador.preco
      ].join(','))
    ].join('\n');
    
    // Criar o blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `time_rodada_${this.historicoTime.rodadaId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
} 