import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { DraftTeam, DraftConfig } from '../../models/draft.model';

@Component({
  selector: 'app-draft-config',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatListModule, MatIconModule],
  template: `
    <mat-card class="config-card">
      <mat-card-header>
        <mat-card-title>Configuração do Draft</mat-card-title>
        <mat-icon>settings</mat-icon>
      </mat-card-header>
      <mat-card-content>
        <mat-list>
          <mat-list-item>
            <span matListItemTitle>Tempo por Escolha</span>
            <span matListItemLine>{{ config.pickTime }} segundos</span>
          </mat-list-item>
          <mat-list-item>
            <span matListItemTitle>Total de Jogadores</span>
            <span matListItemLine>{{ config.requiredPositions.totalPlayers }} jogadores</span>
          </mat-list-item>
          <mat-list-item>
            <span matListItemTitle>Titulares</span>
            <span matListItemLine>{{ config.requiredPositions.starters }} jogadores</span>
          </mat-list-item>
          <mat-list-item>
            <span matListItemTitle>Reservas</span>
            <span matListItemLine>{{ config.requiredPositions.reserves }} jogadores</span>
          </mat-list-item>
          <mat-list-item>
            <span matListItemTitle>Técnico</span>
            <span matListItemLine>{{ config.requiredPositions.requiredCoach }} técnico</span>
          </mat-list-item>
        </mat-list>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .config-card {
      margin: 16px;
      max-width: 400px;
    }
    mat-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    mat-list-item {
      height: 48px;
    }
  `]
})
export class DraftConfigComponent {
  @Input() teams: DraftTeam[] = [];
  @Input() config!: DraftConfig;
} 