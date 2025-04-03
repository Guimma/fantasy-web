import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-liga-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="container">
      <div class="header">
        <button mat-icon-button color="primary" routerLink="/ligas">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ liga?.nome }}</h1>
      </div>

      <div class="details-container">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Informações da Liga</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <div class="label">Status</div>
                <div class="value">
                  <mat-chip-list>
                    <mat-chip [color]="liga?.status === 'ativa' ? 'primary' : 'warn'" selected>
                      {{ liga?.status }}
                    </mat-chip>
                  </mat-chip-list>
                </div>
              </div>
              <div class="info-item">
                <div class="label">Times</div>
                <div class="value">{{ liga?.times }}/{{ liga?.maxTimes }}</div>
              </div>
              <div class="info-item">
                <div class="label">Formação Mínima</div>
                <div class="value">{{ liga?.formacaoMinima }}</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Times Participantes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="timesParticipantes">
              <!-- Posição Column -->
              <ng-container matColumnDef="posicao">
                <th mat-header-cell *matHeaderCellDef> Pos </th>
                <td mat-cell *matCellDef="let time; let i = index"> {{ i + 1 }} </td>
              </ng-container>

              <!-- Nome Column -->
              <ng-container matColumnDef="nome">
                <th mat-header-cell *matHeaderCellDef> Time </th>
                <td mat-cell *matCellDef="let time"> {{ time.nome }} </td>
              </ng-container>

              <!-- Pontos Column -->
              <ng-container matColumnDef="pontos">
                <th mat-header-cell *matHeaderCellDef> Pontos </th>
                <td mat-cell *matCellDef="let time"> {{ time.pontos }} </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .container {
      padding: 16px;
    }
    
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .header h1 {
      margin: 0 0 0 16px;
    }
    
    .details-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .label {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 16px;
      font-weight: 500;
    }
    
    table {
      width: 100%;
    }
  `
})
export class LigaDetailComponent implements OnInit {
  liga: any = null;
  timesParticipantes: any[] = [];
  displayedColumns: string[] = ['posicao', 'nome', 'pontos'];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const ligaId = this.route.snapshot.paramMap.get('id');
    // TODO: Implementar chamada à API para buscar detalhes da liga
    this.liga = {
      id: ligaId,
      nome: 'Liga Brasileira 2024',
      status: 'ativa',
      times: 8,
      maxTimes: 12,
      formacaoMinima: '4-3-3'
    };

    this.timesParticipantes = [
      { id: 1, nome: 'Flamengo FC', pontos: 120 },
      { id: 2, nome: 'Palmeiras United', pontos: 115 },
      { id: 3, nome: 'São Paulo Stars', pontos: 100 },
      { id: 4, nome: 'Cruzeiro Legends', pontos: 90 },
      { id: 5, nome: 'Atlético Strikers', pontos: 85 },
      { id: 6, nome: 'Botafogo Warriors', pontos: 80 },
      { id: 7, nome: 'Santos Sailors', pontos: 75 },
      { id: 8, nome: 'Vasco Vikings', pontos: 70 }
    ];
  }
} 