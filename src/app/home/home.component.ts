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
    MatRippleModule
  ],
  template: `
    <div class="home-container">
      <div class="header">
        <div class="logo-container">
          <mat-icon class="logo-icon">sports_soccer</mat-icon>
          <h1>Fantasy Futebol</h1>
        </div>
        
        <div class="user-menu">
          <div class="user-button-container" [matMenuTriggerFor]="userMenu">
            <div class="user-avatar" *ngIf="!currentUser?.photoURL">
              {{ getUserInitials() }}
            </div>
            <img *ngIf="currentUser?.photoURL" [src]="currentUser.photoURL" class="user-photo" alt="Foto do usuário">
            <div class="user-name-container">
              <span class="user-name">{{ currentUser?.name || 'Usuário' }}</span>
            </div>
            <mat-icon>arrow_drop_down</mat-icon>
          </div>
          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="menu-header">
              <div class="menu-user-info">
                <div class="menu-avatar" *ngIf="!currentUser?.photoURL">
                  {{ getUserInitials() }}
                </div>
                <img *ngIf="currentUser?.photoURL" [src]="currentUser.photoURL" class="menu-photo" alt="Foto do usuário">
                <div class="menu-user-details">
                  <div class="menu-user-name">{{ currentUser?.name }}</div>
                  <div class="menu-user-email">{{ currentUser?.email }}</div>
                </div>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Sair</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <div class="team-info" *ngIf="userTeam">
        <h2><mat-icon>shield</mat-icon> Seu Time: {{ userTeam.name }}</h2>
      </div>
      
      <div class="tabs">
        <div class="tab-container">
          <a class="tab" routerLink="/home" routerLinkActive="active-tab" [routerLinkActiveOptions]="{exact: true}">
            <mat-icon>home</mat-icon>
            <span>Home</span>
          </a>
          <a class="tab" routerLink="/mercado" routerLinkActive="active-tab">
            <mat-icon>shopping_cart</mat-icon>
            <span>Mercado</span>
          </a>
          <a class="tab" routerLink="/escalacao" routerLinkActive="active-tab">
            <mat-icon>format_list_numbered</mat-icon>
            <span>Escalação</span>
          </a>
          <a class="tab" routerLink="/liga" routerLinkActive="active-tab">
            <mat-icon>emoji_events</mat-icon>
            <span>Liga</span>
          </a>
          <a class="tab" routerLink="/draft" routerLinkActive="active-tab" *ngIf="isAdmin">
            <mat-icon>view_list</mat-icon>
            <span>Draft</span>
          </a>
        </div>
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

        <mat-card class="dashboard-card disabled-card" matTooltip="Em breve">
          <div class="card-icon-container">
            <mat-icon class="card-icon">format_list_numbered</mat-icon>
          </div>
          <mat-card-header>
            <mat-card-title>Escalação</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Configure a escalação do seu time para a próxima rodada.</p>
            <div class="coming-soon-label">Em breve</div>
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

    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-xl);
      background-color: var(--background-color);
      min-height: 100vh;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-lg);
      padding-bottom: var(--spacing-md);
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .logo-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      color: var(--primary-color);
    }

    h1 {
      margin: 0;
      font-size: 28px;
      color: var(--primary-color);
      font-weight: 600;
    }

    .user-menu {
      position: relative;
    }
    
    .user-button-container {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 6px 12px 6px 6px;
      border-radius: 24px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background-color: white;
      transition: background-color 0.2s, box-shadow 0.2s;
      min-width: 200px;
      max-width: 320px;
      height: auto;
      cursor: pointer;
    }
    
    .user-button-container:hover {
      background-color: #f5f5f5;
      box-shadow: var(--shadow-sm);
    }

    .user-avatar, .menu-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
    }

    .menu-avatar {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }

    .user-photo, .menu-photo {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    .menu-photo {
      width: 40px;
      height: 40px;
    }

    .user-name-container {
      flex: 1;
      overflow: hidden;
      padding-left: 8px;
      text-align: left;
    }

    .user-name {
      display: block;
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 14px;
      line-height: normal;
      text-align: left;
    }

    .menu-header {
      padding: var(--spacing-md);
      min-width: 280px;
    }

    .menu-user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .menu-user-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .menu-user-name {
      font-weight: 500;
      font-size: 16px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-user-email {
      font-size: 14px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    
    .tabs {
      margin-bottom: var(--spacing-lg);
    }
    
    .tab-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
      background-color: white;
      padding: var(--spacing-sm);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
    }
    
    .tab {
      padding: var(--spacing-md) var(--spacing-lg);
      text-decoration: none;
      color: var(--text-secondary);
      border-radius: var(--border-radius);
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .tab:hover {
      background-color: #f5f5f5;
      color: var(--text-primary);
    }
    
    .active-tab {
      background-color: var(--primary-color);
      color: white;
    }

    .active-tab mat-icon {
      color: white;
    }
    
    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--spacing-lg);
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
      .card-container {
        grid-template-columns: 1fr;
      }

      .tab-container {
        flex-direction: column;
      }

      .logo-container h1 {
        font-size: 20px;
      }

      .user-button-container {
        min-width: auto;
      }

      .user-name {
        display: none;
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