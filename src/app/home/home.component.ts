import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { GoogleAuthService } from '../core/services/google-auth.service';
import { AuthService } from '../core/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatRippleModule } from '@angular/material/core';
import { HeaderComponent } from '../core/components/header/header.component';
import { FooterComponent } from '../core/components/footer/footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule, 
    RouterModule,
    NgIf,
    NgForOf,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatRippleModule,
    HeaderComponent,
    FooterComponent
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>
      
      <main class="main-content">
        <div class="home-container">
          <div class="team-info" *ngIf="userTeam">
            <h2><mat-icon>shield</mat-icon> Seu Time: {{ userTeam.name }}</h2>
          </div>
          
          <div class="card-container">
            <mat-card class="dashboard-card clickable-card" matRipple [routerLink]="['/home']">
              <div class="card-icon-container">
                <mat-icon class="card-icon">home</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Home</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Bem-vindo ao Fantasy Futebol! Esta é a página inicial.</p>
                <p *ngIf="userTeam">Time: {{ userTeam.name }}</p>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card disabled-card" matTooltip="Em breve">
              <div class="card-icon-container">
                <mat-icon class="card-icon">shopping_cart</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Mercado</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Compre e venda jogadores para o seu time.</p>
                <div class="coming-soon-label">Em breve</div>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card clickable-card" matRipple [routerLink]="['/meu-time']">
              <div class="card-icon-container">
                <mat-icon class="card-icon">sports_soccer</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Meu Time</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Configure a escalação do seu time para a próxima rodada.</p>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card disabled-card" matTooltip="Em breve">
              <div class="card-icon-container">
                <mat-icon class="card-icon">emoji_events</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Liga</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Veja sua posição na liga e acompanhe os times concorrentes.</p>
                <div class="coming-soon-label">Em breve</div>
              </mat-card-content>
            </mat-card>

            <mat-card class="dashboard-card clickable-card" matRipple [routerLink]="['/draft']" *ngIf="isAdmin">
              <div class="card-icon-container">
                <mat-icon class="card-icon">view_list</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>Draft</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>Configure e gerencie o draft da temporada.</p>
                <p>Esta funcionalidade é exclusiva para administradores.</p>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </main>

      <app-footer></app-footer>
    </div>
  `,
  styles: `
    :host {
      --primary-color: #3f51b5;
      --primary-light: #f5f7ff;
      --secondary-color: #ff4081;
      --background-color: #f0f2f5;
      --card-background: white;
      --disabled-background: rgba(0,0,0,0.03);
      --text-primary: #333;
      --text-secondary: #666;
      --border-radius: 8px;
      --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
      --shadow-md: 0 4px 8px rgba(0,0,0,0.12);
      --shadow-lg: 0 8px 16px rgba(0,0,0,0.16);
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 16px;
      --spacing-lg: 24px;
      --spacing-xl: 32px;
    }

    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: var(--background-color);
    }

    .main-content {
      flex: 1;
      padding-top: 96px;
      width: 100%;
      box-sizing: border-box;
    }

    .home-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-md);
      box-sizing: border-box;
    }

    .team-info {
      margin-bottom: var(--spacing-lg);
      background-color: var(--primary-light);
      padding: var(--spacing-md);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
    }

    .team-info h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: var(--primary-color);
    }
    
    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--spacing-lg);
      width: 100%;
      box-sizing: border-box;
    }
    
    .dashboard-card {
      height: 100%;
      position: relative;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-md);
      transition: transform 0.3s, box-shadow 0.3s;
      overflow: hidden;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .clickable-card {
      cursor: pointer;
    }

    .clickable-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }

    .disabled-card {
      opacity: 0.7;
      background-color: var(--disabled-background);
    }

    .card-icon-container {
      display: flex;
      justify-content: center;
      margin-top: var(--spacing-lg);
    }

    .card-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: var(--primary-color);
    }

    mat-card-header {
      padding: var(--spacing-md) var(--spacing-md) 0;
    }

    mat-card-content {
      padding: var(--spacing-md) !important;
    }

    .coming-soon-label {
      position: absolute;
      bottom: var(--spacing-md);
      right: var(--spacing-md);
      background-color: var(--secondary-color);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .home-container {
        padding: var(--spacing-sm);
      }

      .card-container {
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
      }
    }

    // Font classes
    .dm-sans {
      font-family: "DM Sans", sans-serif;
      font-optical-sizing: auto;
      font-style: normal;
    }

    .dm-sans-italic {
      font-family: "DM Sans", sans-serif;
      font-optical-sizing: auto;
      font-style: italic;
    }

    // Global styles
    html, body {
      height: 100%;
      margin: 0;
      font-family: "DM Sans", sans-serif;
      font-optical-sizing: auto;
      font-style: normal;
    }

    .mat-typography {
      font: 400 14px/20px "DM Sans", sans-serif;
      letter-spacing: normal;
    }
  `
})
export class HomeComponent implements OnInit {
  protected googleAuthService = inject(GoogleAuthService);
  protected authService = inject(AuthService);
  protected router = inject(Router);
  
  currentUser: any = null;
  userTeam: any = null;
  isAdmin = false;

  ngOnInit(): void {
    this.currentUser = this.googleAuthService.currentUser;
    this.isAdmin = this.googleAuthService.isAdmin();
    this.userTeam = this.googleAuthService.getUserTeam();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return '?';
    
    const nameParts = this.currentUser.name.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  }
} 