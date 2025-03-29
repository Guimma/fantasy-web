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
            <h2><mat-icon>shield</mat-icon> {{ randomTeamGreeting }} {{ userTeam.name }}</h2>
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
      background-color: var(--light-color);
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
      font-size: 28px;
      font-weight: 700;
    }
    
    .team-info h2 mat-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
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
      background-color: var(--accent-color, var(--secondary-color));
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
  randomTeamGreeting: string = '';

  // Lista de frases de boas-vindas para o time
  private teamGreetings: string[] = [
    "Bem-vindo de volta",
    "🌍 O maior time do mundo é o seu:",
    "🎩 Senhoras e senhores, eis o gigante",
    "👑 Salve o",
    "🏆 Avisem que o campeão será",
    "💀 Trema mundo, chegou o poderoso",
    "👑 A lenda continua:",
    "💰 Façam suas apostas no favorito:",
    "👹 O terror dos adversários:",
    "🏆 Direto do olimpo dos campeões:",
    "💪 O invencível, o imbatível:",
    "🔰 Não é time, é seleção:",
    "😨 Mais temido que a sogra:",
    "🏆 Melhor que café na segunda-feira:",
    "👹 O pesadelo dos rivais:",
    "👑 Até os deuses aplaudem o",
    "🕒 1 minuto de silêncio para o",
    "👶 O pequeno",
    "🙌 A torcida ainda acredita no"
  ];

  ngOnInit(): void {
    this.currentUser = this.googleAuthService.currentUser;
    this.isAdmin = this.googleAuthService.isAdmin();
    this.userTeam = this.googleAuthService.getUserTeam();
    this.randomTeamGreeting = this.getRandomTeamGreeting();
  }

  // Método para obter uma frase aleatória de boas-vindas
  private getRandomTeamGreeting(): string {
    const randomIndex = Math.floor(Math.random() * this.teamGreetings.length);
    return this.teamGreetings[randomIndex];
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