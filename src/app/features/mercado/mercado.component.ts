import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../core/components/header/header.component';
import { FooterComponent } from '../../core/components/footer/footer.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <div class="main-content">
        <div class="content-container">
          <mat-card>
            <mat-card-content>
              <div class="coming-soon">
                <mat-icon>store</mat-icon>
                <h2>Mercado em Breve</h2>
                <p>A página de Mercado está em desenvolvimento e estará disponível em breve!</p>
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
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 120px 20px 20px 20px;
    }
    
    .content-container {
      max-width: 800px;
      width: 100%;
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
    
    .coming-soon h2 {
      margin-bottom: 16px;
      color: var(--primary-color);
    }
    
    .coming-soon p {
      font-size: 18px;
      color: var(--text-secondary);
    }
  `
})
export class MercadoComponent {} 