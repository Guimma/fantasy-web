import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-liga-detail',
  template: `
    <div class="container">
      <div class="header">
        <button mat-icon-button (click)="voltar()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{liga?.nome}}</h1>
        <div class="status">
          <mat-chip-list>
            <mat-chip [color]="liga?.status === 'ativa' ? 'primary' : 'warn'" selected>
              {{liga?.status}}
            </mat-chip>
          </mat-chip-list>
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-tab-group>
            <!-- Informações Gerais -->
            <mat-tab label="Informações">
              <div class="info-content">
                <div class="info-row">
                  <span class="label">Times:</span>
                  <span>{{liga?.times}}/{{liga?.maxTimes}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Orçamento Inicial:</span>
                  <span>{{liga?.orcamentoInicial}} dinheiros</span>
                </div>
                <div class="info-row">
                  <span class="label">Data de Início:</span>
                  <span>{{liga?.dataInicio | date}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Data de Término:</span>
                  <span>{{liga?.dataTermino | date}}</span>
                </div>
              </div>
            </mat-tab>

            <!-- Tabela de Classificação -->
            <mat-tab label="Classificação">
              <table mat-table [dataSource]="classificacao">
                <ng-container matColumnDef="posicao">
                  <th mat-header-cell *matHeaderCellDef>Pos</th>
                  <td mat-cell *matCellDef="let row">{{row.posicao}}</td>
                </ng-container>

                <ng-container matColumnDef="time">
                  <th mat-header-cell *matHeaderCellDef>Time</th>
                  <td mat-cell *matCellDef="let row">{{row.time}}</td>
                </ng-container>

                <ng-container matColumnDef="pontos">
                  <th mat-header-cell *matHeaderCellDef>Pts</th>
                  <td mat-cell *matCellDef="let row">{{row.pontos}}</td>
                </ng-container>

                <ng-container matColumnDef="vitorias">
                  <th mat-header-cell *matHeaderCellDef>V</th>
                  <td mat-cell *matCellDef="let row">{{row.vitorias}}</td>
                </ng-container>

                <ng-container matColumnDef="empates">
                  <th mat-header-cell *matHeaderCellDef>E</th>
                  <td mat-cell *matCellDef="let row">{{row.empates}}</td>
                </ng-container>

                <ng-container matColumnDef="derrotas">
                  <th mat-header-cell *matHeaderCellDef>D</th>
                  <td mat-cell *matCellDef="let row">{{row.derrotas}}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="colunasClassificacao"></tr>
                <tr mat-row *matRowDef="let row; columns: colunasClassificacao;"></tr>
              </table>
            </mat-tab>

            <!-- Configurações -->
            <mat-tab label="Configurações">
              <div class="config-content">
                <h3>Regras da Liga</h3>
                <div class="info-row">
                  <span class="label">Formação Mínima:</span>
                  <span>{{liga?.formacaoMinima}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Tamanho Máximo do Elenco:</span>
                  <span>{{liga?.tamanhoMaximoElenco}}</span>
                </div>
                <div class="info-row">
                  <span class="label">Tempo de Escolha no Draft:</span>
                  <span>{{liga?.tempoEscolhaDraft}} segundos</span>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 20px;
      flex: 1;
    }
    .info-content, .config-content {
      padding: 20px;
    }
    .info-row {
      display: flex;
      margin-bottom: 10px;
    }
    .label {
      font-weight: 500;
      width: 200px;
    }
    table {
      width: 100%;
    }
  `]
})
export class LigaDetailComponent implements OnInit {
  liga: any;
  classificacao: any[] = [];
  colunasClassificacao = ['posicao', 'time', 'pontos', 'vitorias', 'empates', 'derrotas'];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    // TODO: Implementar chamada à API para buscar detalhes da liga
    this.liga = {
      id: id,
      nome: 'Liga Brasileira 2024',
      status: 'ativa',
      times: 8,
      maxTimes: 12,
      orcamentoInicial: 100,
      dataInicio: new Date('2024-03-01'),
      dataTermino: new Date('2024-12-31'),
      formacaoMinima: '4-3-3',
      tamanhoMaximoElenco: 18,
      tempoEscolhaDraft: 60
    };

    // Dados mockados da classificação
    this.classificacao = [
      { posicao: 1, time: 'Time A', pontos: 15, vitorias: 5, empates: 0, derrotas: 0 },
      { posicao: 2, time: 'Time B', pontos: 12, vitorias: 4, empates: 0, derrotas: 1 },
      { posicao: 3, time: 'Time C', pontos: 9, vitorias: 3, empates: 0, derrotas: 2 }
    ];
  }

  voltar() {
    this.router.navigate(['/ligas']);
  }
} 