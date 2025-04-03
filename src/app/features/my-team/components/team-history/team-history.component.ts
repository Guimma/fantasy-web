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
import { Rodada, DetalhePontuacaoAtleta } from '../../models/pontuacao.model';
import { Athlete } from '../../../draft/models/draft.model';

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
          
          <div *ngIf="!carregandoPontuacao && detalhePontuacao && detalhePontuacao.length > 0">
            <h4>Pontuação: {{ calcularPontuacaoTotal() | number:'1.1-1' }} pts</h4>
            <p class="formation-info" *ngIf="historicoTime.formacao">Formação: {{ historicoTime.formacao }}</p>
          </div>
          
          <div *ngIf="carregandoPontuacao" class="loading-container">
            <mat-spinner diameter="30"></mat-spinner>
            <p>Carregando pontuações...</p>
          </div>
          
          <table mat-table [dataSource]="tableDataSource" class="mat-elevation-z2">
            <ng-container matColumnDef="posicao">
              <th mat-header-cell *matHeaderCellDef>Posição</th>
              <td mat-cell *matCellDef="let jogador">
                {{ jogador.atleta ? jogador.atleta.posicaoAbreviacao : jogador.posicaoAbreviacao }}
              </td>
            </ng-container>
            
            <ng-container matColumnDef="nome">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let jogador" [class.not-considered]="!isConsiderado(jogador)">
                {{ jogador.atleta ? jogador.atleta.apelido : jogador.apelido }}
              </td>
            </ng-container>
            
            <ng-container matColumnDef="clube">
              <th mat-header-cell *matHeaderCellDef>Clube</th>
              <td mat-cell *matCellDef="let jogador">
                {{ jogador.atleta ? jogador.atleta.clube : jogador.clube }}
              </td>
            </ng-container>
            
            <ng-container matColumnDef="pontuacao">
              <th mat-header-cell *matHeaderCellDef>Pontuação</th>
              <td mat-cell *matCellDef="let jogador" [class.not-considered]="!isConsiderado(jogador)">
                <span *ngIf="jogador.pontuacao !== undefined" 
                      [class.negative]="jogador.pontuacao < 0"
                      [class.zero]="jogador.pontuacao === 0"
                      class="points">
                  {{ jogador.pontuacao | number:'1.1-1' }}
                </span>
                <span *ngIf="jogador.pontuacao === undefined">-</span>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let jogador">
                <span *ngIf="isConsiderado(jogador)" class="status-badge considered">
                  <mat-icon fontIcon="check"></mat-icon> Considerado
                </span>
                <span *ngIf="isJogou(jogador) && !isConsiderado(jogador)" class="status-badge not-considered">
                  <mat-icon fontIcon="close"></mat-icon> Fora da formação
                </span>
                <span *ngIf="!isJogou(jogador)" class="status-badge not-played">
                  <mat-icon fontIcon="dangerous"></mat-icon> Não jogou
                </span>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="colunasPontuacao"></tr>
            <tr mat-row *matRowDef="let row; columns: colunasPontuacao;"></tr>
          </table>
        </div>
      </mat-card-content>
      
      <mat-card-actions *ngIf="rodadaAtual && rodadaSelecionada !== rodadaAtual.id">
        <!-- Botão de exportar CSV removido conforme solicitado -->
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
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
    
    .formation-info {
      margin-top: -8px;
      margin-bottom: 16px;
      color: #444;
      font-weight: 500;
    }
    
    table {
      width: 100%;
    }
    
    .not-considered {
      text-decoration: line-through;
      color: #888;
    }
    
    .points {
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
      background-color: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    
    .points.negative {
      background-color: rgba(244, 67, 54, 0.15);
      color: #d32f2f;
    }
    
    .points.zero {
      background-color: rgba(158, 158, 158, 0.15);
      color: #616161;
    }
    
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-badge mat-icon {
      font-size: 14px;
      height: 14px;
      width: 14px;
      line-height: 14px;
    }
    
    .status-badge.considered {
      background-color: rgba(76, 175, 80, 0.15);
      color: #2e7d32;
    }
    
    .status-badge.not-considered {
      background-color: rgba(255, 152, 0, 0.15);
      color: #ef6c00;
    }
    
    .status-badge.not-played {
      background-color: rgba(158, 158, 158, 0.15);
      color: #616161;
    }
  `
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
  detalhePontuacao: DetalhePontuacaoAtleta[] | null = null;
  carregando = false;
  carregandoPontuacao = false;
  
  rodadaControl = new FormControl<number | null>(null);
  colunas = ['posicao', 'nome', 'clube', 'status', 'preco'];
  colunasPontuacao = ['posicao', 'nome', 'clube', 'pontuacao', 'status'];
  
  get tableDataSource(): Array<DetalhePontuacaoAtleta | Athlete> {
    if (this.detalhePontuacao && this.detalhePontuacao.length > 0) {
      return this.detalhePontuacao;
    }
    
    if (this.historicoTime && this.historicoTime.jogadores && this.historicoTime.jogadores.length > 0) {
      return this.historicoTime.jogadores;
    }
    
    return [];
  }
  
  ngOnInit(): void {
    // Carregar rodadas disponíveis
    this.carregarRodadas();
    
    // Carregar time do usuário
    this.myTeamService.getMyTeam().subscribe({
      next: (team) => {
        if (team) {
          this.timeId = team.id;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar time:', err);
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
    this.detalhePontuacao = null;
    
    this.teamHistoryService.getTimeHistoricoRodada(this.timeId, this.rodadaSelecionada)
      .subscribe({
        next: (historico) => {
          this.historicoTime = historico;
          this.carregando = false;
          
          if (historico && this.rodadaSelecionada && this.rodadaSelecionada > 0) {
            this.carregarDetalhesRodada();
          }
        },
        error: (err) => {
          console.error('Erro ao carregar histórico:', err);
          this.carregando = false;
          this.historicoTime = null;
        }
      });
  }
  
  carregarDetalhesRodada(): void {
    if (!this.timeId || !this.rodadaSelecionada) {
      return;
    }
    
    this.carregandoPontuacao = true;
    
    this.pontuacaoService.getDetalhesPontuacaoTime(this.timeId, this.rodadaSelecionada)
      .subscribe({
        next: (detalhes) => {
          this.detalhePontuacao = detalhes;
          this.carregandoPontuacao = false;
          console.log('Detalhes pontuação carregados:', detalhes);
        },
        error: (err) => {
          console.error('Erro ao carregar detalhes da pontuação:', err);
          this.carregandoPontuacao = false;
        }
      });
  }
  
  calcularPontuacaoTotal(): number {
    if (!this.detalhePontuacao || this.detalhePontuacao.length === 0) {
      return 0;
    }
    
    return this.detalhePontuacao
      .filter(d => d.consideradoNaCalculacao === true)
      .reduce((total, detalhe) => total + (detalhe.pontuacao || 0), 0);
  }
  
  isConsiderado(jogador: DetalhePontuacaoAtleta | Athlete): boolean {
    // Para jogadores do tipo DetalhePontuacaoAtleta
    if ('consideradoNaCalculacao' in jogador) {
      return jogador.consideradoNaCalculacao === true;
    }
    // Para jogadores sem informação de consideração, assumir true
    return true;
  }
  
  isJogou(jogador: DetalhePontuacaoAtleta | Athlete): boolean {
    // Para jogadores do tipo DetalhePontuacaoAtleta
    if ('entrou_em_campo' in jogador) {
      return jogador.entrou_em_campo === true;
    }
    // Para jogadores do tipo Athlete sem informações adicionais
    return false;
  }
} 