import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { GoogleAuthService } from '../../services/google-auth.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    RouterModule,
    NgIf
  ],
  template: `
    <mat-toolbar class="header-toolbar">
      <div class="header-content">
        <div class="header-left">
          <button mat-icon-button [matMenuTriggerFor]="navMenu" class="nav-menu-button" color="primary">
            <mat-icon>menu</mat-icon>
          </button>
          <mat-menu #navMenu="matMenu" class="primary-menu">
            <a mat-menu-item routerLink="/home" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}" class="primary-menu-item">
              <mat-icon color="primary">home</mat-icon>
              <span>Home</span>
            </a>
            <a mat-menu-item routerLink="/mercado" routerLinkActive="active-link" class="primary-menu-item">
              <mat-icon color="primary">shopping_cart</mat-icon>
              <span>Mercado</span>
            </a>
            <a mat-menu-item routerLink="/meu-time" routerLinkActive="active-link" class="primary-menu-item">
              <mat-icon color="primary">sports_soccer</mat-icon>
              <span>Meu Time</span>
            </a>
            <a mat-menu-item routerLink="/times" routerLinkActive="active-link" class="primary-menu-item">
              <mat-icon color="primary">emoji_events</mat-icon>
              <span>Liga</span>
            </a>
            <a mat-menu-item routerLink="/draft" routerLinkActive="active-link" *ngIf="isAdmin" class="primary-menu-item">
              <mat-icon color="primary">view_list</mat-icon>
              <span>Draft</span>
            </a>
          </mat-menu>
        </div>

        <a routerLink="/home" class="logo-link">
          <img src="assets/images/logo.png" alt="Brasileirão Fantasy Game" class="logo-image" (error)="handleLogoError($event)">
        </a>

        <div class="header-right">
          <div class="user-menu">
            <div class="user-button-container" [matMenuTriggerFor]="userMenu">
              <div class="user-avatar" *ngIf="!currentUser?.picture">
                {{ getUserInitials() }}
              </div>
              <img *ngIf="currentUser?.picture" [src]="currentUser?.picture" class="user-photo" alt="Foto do usuário">
              <div class="user-name-container">
                <span class="user-name">{{ currentUser?.name || 'Usuário' }}</span>
              </div>
              <mat-icon>arrow_drop_down</mat-icon>
            </div>
            <mat-menu #userMenu="matMenu" xPosition="before">
              <div class="menu-header">
                <div class="menu-user-info">
                  <div class="menu-avatar" *ngIf="!currentUser?.picture">
                    {{ getUserInitials() }}
                  </div>
                  <img *ngIf="currentUser?.picture" [src]="currentUser?.picture" class="menu-photo" alt="Foto do usuário">
                  <div class="menu-user-details">
                    <div class="menu-user-name">{{ currentUser?.name }}</div>
                    <div class="menu-user-email">{{ currentUser?.email }}</div>
                    <div class="menu-user-role">
                      <mat-icon class="role-icon">admin_panel_settings</mat-icon>
                      <span>{{ currentUser?.role === 'admin' ? 'Administrador' : 'Usuário' }}</span>
                    </div>
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
      </div>
    </mat-toolbar>
  `,
  styles: `
    /* Usar variáveis globais definidas em styles.scss */
    .header-toolbar {
      background-color: white;
      box-shadow: var(--shadow-sm);
      height: 100px;
      padding: 0;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      margin-bottom: var(--spacing-xl);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--spacing-xl);
      box-sizing: border-box;
      position: relative;
    }

    .header-left {
      display: flex;
      align-items: center;
      z-index: 2;
    }

    .nav-menu-button {
      margin-right: var(--spacing-sm);
      color: var(--primary-color);
    }

    .nav-menu-button mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .logo-link {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      height: 100%;
      z-index: 1;
      padding: var(--spacing-md);
    }

    .logo-image {
      height: 80px;
      width: auto;
      object-fit: contain;
    }

    .header-right {
      display: flex;
      align-items: center;
      z-index: 2;
    }

    .user-menu {
      position: relative;
      width: 100%;
      display: flex;
      justify-content: flex-end;
    }

    .user-button-container {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 8px 16px 8px 8px;
      border-radius: 24px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      background-color: white;
      transition: background-color 0.2s, box-shadow 0.2s;
      min-width: 0;
      max-width: 100%;
      height: auto;
      cursor: pointer;
      box-sizing: border-box;
      width: fit-content;
    }

    .user-button-container:hover {
      background-color: var(--primary-light);
      box-shadow: var(--shadow-sm);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 14px;
      flex-shrink: 0;
    }

    .user-photo {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .user-name-container {
      flex: 1;
      overflow: hidden;
      padding-left: var(--spacing-sm);
      text-align: left;
      min-width: 0;
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
      padding: 16px;
      min-width: 280px;
      max-width: 100%;
      box-sizing: border-box;
    }

    .menu-user-info {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .menu-user-details {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      gap: 4px;
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
      color: rgba(0, 0, 0, 0.6);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-user-role {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--primary-color);
      margin-top: 4px;
    }

    .role-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .menu-avatar {
      width: 48px;
      height: 48px;
      font-size: 18px;
      flex-shrink: 0;
      background-color: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .menu-photo {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary-light);
    }

    mat-divider {
      margin: 4px 0;
    }

    button[mat-menu-item] {
      height: 40px;
      line-height: 40px;
    }

    button[mat-menu-item] mat-icon {
      margin-right: 16px;
    }

    @media (max-width: 768px) {
      .header-toolbar {
        height: 80px;
      }

      .header-content {
        padding: 0 var(--spacing-sm);
      }

      .logo-image {
        height: 60px;
      }

      .user-button-container {
        padding: 6px;
      }

      .user-name {
        display: none;
      }

      .menu-header {
        min-width: 240px;
      }
    }

    :host ::ng-deep {
      // Usando um seletor direto e mais específico com !important 
      .mdc-list-item__primary-text {
        color: var(--primary-color) !important;
      }
      
      .mat-mdc-menu-item .mat-icon {
        color: var(--primary-color) !important;
      }
      
      .mat-mdc-menu-item {
        &:hover {
          background-color: var(--primary-light);
        }
      }
      
      .mat-mdc-menu-item.active-link {
        background-color: var(--primary-light);
      }
    }
  `
})
export class HeaderComponent {
  protected googleAuthService = inject(GoogleAuthService);
  protected authService = inject(AuthService);
  protected router = inject(Router);
  
  currentUser = this.googleAuthService.currentUser;
  isAdmin = this.googleAuthService.isAdmin();

  handleLogoError(event: any): void {
    console.warn('Logo não encontrado em assets/images/logo.png');
    event.target.style.display = 'none';
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