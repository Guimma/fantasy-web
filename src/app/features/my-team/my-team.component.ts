import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../core/components/header/header.component';
import { FooterComponent } from '../../core/components/footer/footer.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-my-team',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <div class="main-content">
        <div class="content-container">
          <div class="page-header">
            <h1>Meu Time</h1>
          </div>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Meu Time</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>Aqui você poderá gerenciar seu time, montar sua escalação e acompanhar seu desempenho no jogo.</p>
              
              <div class="coming-soon">
                <mat-icon>sports_soccer</mat-icon>
                <h3>Em Desenvolvimento</h3>
                <p>Estamos trabalhando para disponibilizar esta funcionalidade em breve!</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
      
      <app-footer></app-footer>
    </div>
  `,
  styles: `
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background-color: var(--background-color);
    }
    
    .main-content {
      flex: 1;
      padding: 120px 20px 20px 20px;
    }
    
    .content-container {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
    
    .page-header {
      margin-bottom: 20px;
    }
    
    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
    }
    
    .coming-soon mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      margin-bottom: 20px;
      color: var(--primary-color);
    }
    
    .coming-soon h3 {
      margin-bottom: 16px;
      color: var(--primary-color);
    }
  `
})
export class MyTeamComponent {} 