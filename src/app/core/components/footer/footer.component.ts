import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatIconModule, RouterModule, NgIf],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <div class="footer-logo">
            <a routerLink="/home" class="logo-link">
              <img src="assets/images/logo.png" alt="Brasileirão Fantasy Game" class="footer-logo-image" (error)="handleLogoError($event)">
            </a>
            <div class="logo-text-container" *ngIf="!showFallbackLogo">
              <span class="logo-text">Brasileirão Fantasy Game</span>
            </div>
            <div class="fallback-logo" *ngIf="showFallbackLogo">
              <mat-icon class="logo-icon">sports_soccer</mat-icon>
              <span class="logo-text">Brasileirão Fantasy Game</span>
            </div>
          </div>
          <p class="footer-description">
            A plataforma definitiva para gerenciar seu time de futebol virtual.
            Compita com amigos, faça transferências e acompanhe o desempenho do seu time.
          </p>
        </div>

        <div class="footer-section">
          <h3>Links Rápidos</h3>
          <nav class="footer-nav">
            <a routerLink="/home">Home</a>
            <a routerLink="/mercado">Mercado</a>
            <a routerLink="/meu-time">Meu Time</a>
            <a routerLink="/ligas">Liga</a>
            <a routerLink="/draft">Draft</a>
          </nav>
        </div>

        <div class="footer-section">
          <h3>Contato</h3>
          <div class="contact-info">
            <a href="mailto:lucas@campregher.com" class="contact-link">
              <mat-icon>email</mat-icon>
              <span>lucas&#64;campregher.com</span>
            </a>
            <a href="https://github.com/Guimma/" target="_blank" class="contact-link">
              <mat-icon>code</mat-icon>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} Brasileirão Fantasy Game. Todos os direitos reservados.</p>
      </div>
    </footer>
  `,
  styles: `
    /* Usar variáveis globais definidas em styles.scss */
    .footer {
      background-color: var(--primary-color);
      color: white;
      padding: var(--spacing-xl) 0 var(--spacing-md);
      margin-top: auto;
      box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-md);
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: var(--spacing-xl);
      box-sizing: border-box;
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex-direction: row;
      margin-bottom: var(--spacing-md);
    }

    .logo-link {
      display: block;
      text-decoration: none;
    }

    .logo-text-container {
      display: flex;
      align-items: center;
    }

    .footer-logo-image {
      height: 60px;
      width: auto;
      object-fit: contain;
      filter: brightness(0) invert(1); /* Make logo white */
    }

    .fallback-logo {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .logo-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: var(--secondary-color);
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    .footer-description {
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.6;
      margin: 0;
    }

    h3 {
      color: var(--secondary-color);
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .footer-nav {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .footer-nav a {
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .footer-nav a:hover {
      color: var(--secondary-color);
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .contact-link {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .contact-link:hover {
      color: var(--secondary-color);
    }

    .contact-link mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .footer-bottom {
      max-width: 1200px;
      margin: var(--spacing-xl) auto 0;
      padding: var(--spacing-md);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      text-align: center;
    }

    .footer-bottom p {
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      margin: 0;
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr 1fr;
      }

      .footer-section:first-child {
        grid-column: span 2;
      }
    }

    @media (max-width: 576px) {
      .footer-content {
        grid-template-columns: 1fr;
      }

      .footer-section:first-child {
        grid-column: span 1;
      }
    }
  `
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  showFallbackLogo = false;
  
  handleLogoError(event: any): void {
    console.warn('Logo não encontrado em assets/images/logo.png');
    event.target.style.display = 'none';
    this.showFallbackLogo = true;
  }
} 