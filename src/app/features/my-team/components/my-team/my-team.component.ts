import { Component, OnInit, OnDestroy, inject, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskSchedulerService } from '../../services/task-scheduler.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    RouterModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="my-team-container">
      <div class="team-header">
        <h1>
          <mat-icon>shield</mat-icon>
          Meu Time
        </h1>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-tab-group #tabGroup [selectedIndex]="selectedTab" (selectedIndexChange)="tabChanged($event)" animationDuration="300ms">
            <mat-tab label="Visão Geral">
              <app-my-team-overview></app-my-team-overview>
            </mat-tab>
            
            <mat-tab label="Escalação">
              <app-lineup></app-lineup>
            </mat-tab>
            
            <mat-tab label="Jogadores">
              <app-player-selection></app-player-selection>
            </mat-tab>
            
            <mat-tab label="Histórico">
              <app-team-history></app-team-history>
            </mat-tab>
            
            <mat-tab label="Tarefas" *ngIf="isAdmin">
              <app-team-tasks></app-team-tasks>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .my-team-container {
      padding: var(--spacing-md);
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .team-header {
      margin-bottom: var(--spacing-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .team-header h1 {
      font-size: 28px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--primary-color);
    }
    
    .team-header h1 mat-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
    }
    
    mat-card {
      margin-bottom: var(--spacing-md);
    }
    
    ::ng-deep .mat-mdc-tab-body-wrapper {
      padding: var(--spacing-md) 0;
    }
  `
})
export class MyTeamComponent implements OnInit, OnDestroy, AfterViewInit {
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private taskSchedulerService = inject(TaskSchedulerService);
  private googleAuthService = inject(GoogleAuthService);
  
  selectedTab = 0;
  isAdmin = false;
  private routeSubscription: Subscription | null = null;
  
  ngOnInit() {
    // Iniciar o serviço de agendamento de tarefas
    this.taskSchedulerService.startScheduler();
    
    // Verificar se o usuário é administrador
    this.isAdmin = this.googleAuthService.isAdmin();
    
    // Observar mudanças na rota para selecionar a aba correta
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tabIndex = parseInt(params['tab'], 10);
        if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex <= 4) {
          this.selectedTab = tabIndex;
        }
      }
    });
  }
  
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
  
  ngOnDestroy() {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }
  
  tabChanged(index: number) {
    this.selectedTab = index;
  }
} 