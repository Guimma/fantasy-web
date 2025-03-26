import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { DraftOrder, DraftTeam } from '../../models/draft.model';

@Component({
  selector: 'app-draft-order',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatListModule
  ],
  template: `
    <mat-card class="order-card">
      <mat-card-header>
        <mat-card-title>Ordem do Draft</mat-card-title>
      </mat-card-header>
      
      <mat-card-content>
        <div class="order-container">
          <mat-list dense>
            <div *ngFor="let entry of orderedEntries; let i = index">
              <mat-list-item [class.current-pick]="i === currentOrderIndex">
                <mat-icon matListItemIcon *ngIf="i === currentOrderIndex">play_arrow</mat-icon>
                <div matListItemTitle class="order-item">
                  <span class="order-number">{{ i + 1 }}</span>
                  <span class="order-team">{{ getTeamName(entry.teamId) }}</span>
                  <span class="order-round">R{{ entry.round }}</span>
                </div>
              </mat-list-item>
              <mat-divider *ngIf="i < orderedEntries.length - 1"></mat-divider>
            </div>
          </mat-list>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .order-card {
      width: 100%;
      max-height: 400px;
      overflow: auto;
    }
    
    .order-container {
      max-height: 320px;
      overflow-y: auto;
    }
    
    .current-pick {
      background-color: #f0f4ff;
      border-left: 4px solid #3f51b5;
    }
    
    .order-item {
      display: flex;
      align-items: center;
    }
    
    .order-number {
      width: 30px;
      font-weight: 500;
    }
    
    .order-team {
      flex-grow: 1;
    }
    
    .order-round {
      font-size: 12px;
      color: #666;
      background-color: #eee;
      padding: 2px 8px;
      border-radius: 12px;
      margin-left: 8px;
    }
  `
})
export class DraftOrderComponent {
  @Input() draftOrder: DraftOrder[] = [];
  @Input() currentOrderIndex = -1;
  
  private teamNames: Map<string, string> = new Map();
  
  get orderedEntries(): DraftOrder[] {
    return this.draftOrder.slice(0, 24); // Mostrar só as próximas 24 escolhas
  }
  
  getTeamName(teamId: string): string {
    return this.teamNames.get(teamId) || `Time ${teamId}`;
  }
  
  @Input() set teams(teams: DraftTeam[]) {
    this.teamNames.clear();
    if (teams) {
      teams.forEach(team => {
        this.teamNames.set(team.id, team.name);
      });
    }
  }
} 