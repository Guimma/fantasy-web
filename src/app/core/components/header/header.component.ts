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
import { ThemeService } from '../../theme/theme.service';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
    NgIf,
    ClipboardModule,
    MatSnackBarModule
  ],
  template: `
    <mat-toolbar class="header-toolbar">
      <div class="header-content">
        <div class="header-left">
          <button mat-icon-button [matMenuTriggerFor]="navMenu" class="nav-menu-button">
            <mat-icon class="menu-icon">menu</mat-icon>
          </button>
          <mat-menu #navMenu="matMenu" class="primary-menu">
            <a mat-menu-item routerLink="/home" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}" class="primary-menu-item">
              <mat-icon>home</mat-icon>
              <span>Home</span>
            </a>
            <a mat-menu-item routerLink="/mercado" routerLinkActive="active-link" class="primary-menu-item">
              <mat-icon>shopping_cart</mat-icon>
              <span>Mercado</span>
            </a>
            <a mat-menu-item routerLink="/meu-time" routerLinkActive="active-link" class="primary-menu-item">
              <mat-icon>sports_soccer</mat-icon>
              <span>Meu Time</span>
            </a>
            <a mat-menu-item routerLink="/times" routerLinkActive="active-link" class="primary-menu-item">
              <mat-icon>emoji_events</mat-icon>
              <span>Liga</span>
            </a>
            <a mat-menu-item routerLink="/draft" routerLinkActive="active-link" *ngIf="isAdmin" class="primary-menu-item">
              <mat-icon>view_list</mat-icon>
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
              <div class="user-id-section">
                <div class="id-label">ID do usuário:</div>
                <div class="menu-user-id" title="Clique para copiar o ID" 
                    [cdkCopyToClipboard]="currentUser?.id || ''"
                    (click)="copyUserId()"
                    role="button">
                  <mat-icon class="id-icon">fingerprint</mat-icon>
                  <span class="id-value">{{ currentUser?.id }}</span>
                  <mat-icon class="copy-icon">content_copy</mat-icon>
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
      background-color: var(--primary-color);
      color: white;
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
      color: white;
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
      filter: brightness(0) invert(1); /* Make logo white */
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
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      transition: background-color 0.2s, box-shadow 0.2s;
      min-width: 0;
      max-width: 100%;
      height: auto;
      cursor: pointer;
      box-sizing: border-box;
      width: fit-content;
    }

    .user-button-container:hover {
      background-color: rgba(255, 255, 255, 0.2);
      box-shadow: var(--shadow-sm);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: var(--secondary-color);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }

    .user-photo {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .user-name-container {
      overflow: hidden;
      max-width: 150px;
    }

    .user-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
      font-size: 14px;
      color: white;
    }

    .menu-header {
      padding: 16px 16px 8px;
    }

    .menu-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .menu-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: var(--secondary-color);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .menu-photo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .menu-user-details {
      overflow: hidden;
    }

    .menu-user-name {
      font-weight: 500;
      font-size: 14px;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .menu-user-email {
      font-size: 12px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }

    .menu-user-role {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .role-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .user-id-section {
      padding: 8px 16px 12px;
    }

    .id-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 4px;
      font-weight: 500;
    }

    .menu-user-id {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--text-secondary);
      background-color: rgba(0, 0, 0, 0.04);
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .menu-user-id:hover {
      background-color: rgba(0, 0, 0, 0.08);
    }

    .menu-user-id:active {
      background-color: rgba(0, 0, 0, 0.12);
    }

    .id-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--accent-color, var(--secondary-color));
    }

    .id-value {
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 120px;
    }

    .copy-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      margin-left: auto;
      color: var(--accent-color, var(--secondary-color));
      opacity: 0.7;
    }

    .menu-user-id:hover .copy-icon {
      opacity: 1;
    }

    /* Estilo para links ativos no menu */
    .active-link {
      background-color: rgba(0, 0, 0, 0.04);
    }

    /* Media queries para responsividade */
    @media (max-width: 768px) {
      .user-name-container {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .header-content {
        padding: 0 var(--spacing-md);
      }
      
      .logo-image {
        height: 60px;
      }
    }

    .menu-icon {
      color: var(--accent-color) !important;
    }
  `
})
export class HeaderComponent {
  protected googleAuthService = inject(GoogleAuthService);
  protected authService = inject(AuthService);
  protected router = inject(Router);
  protected themeService = inject(ThemeService);
  protected clipboard = inject(ClipboardModule);
  protected snackBar = inject(MatSnackBar);

  currentUser = this.googleAuthService.currentUser;
  isAdmin = this.googleAuthService.isAdmin();

  handleLogoError(event: any): void {
    // Fallback para um texto caso a imagem não carregue
    event.target.src = '';
    event.target.alt = 'Fantasy Futebol';
    event.target.style.fontSize = '24px';
    event.target.style.fontWeight = 'bold';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser?.name) return '?';
    
    const nameParts = this.currentUser.name.split(' ');
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  }

  copyUserId(): void {
    console.log('ID do usuário copiado:', this.currentUser?.id);
    this.snackBar.open('ID do usuário copiado com sucesso!', 'Fechar', { duration: 3000 });
  }
} 