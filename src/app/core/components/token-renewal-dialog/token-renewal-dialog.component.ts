import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { GoogleAuthService } from '../../services/google-auth.service';
import { tokenRenewalNeeded } from '../../interceptors/google-auth.interceptor';

@Component({
  selector: 'app-token-renewal-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div *ngIf="showRenewal" class="token-renewal-banner">
      <div class="message">
        <mat-icon>warning</mat-icon>
        <span>{{ message }}</span>
      </div>
      <div class="actions">
        <button mat-raised-button color="primary" [disabled]="isRenewing" (click)="renewToken()">
          <mat-icon>{{ isRenewing ? 'hourglass_empty' : 'refresh' }}</mat-icon>
          {{ isRenewing ? 'Renovando...' : 'Renovar Sessão' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .token-renewal-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background-color: #f8d7da;
      color: #721c24;
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
    }

    .message {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  `
})
export class TokenRenewalDialogComponent implements OnInit, OnDestroy {
  showRenewal = false;
  isRenewing = false;
  message = 'Sua sessão expirou. Por favor, renove sua autenticação para continuar.';
  private subscription: Subscription = new Subscription();

  constructor(private authService: GoogleAuthService) {}

  ngOnInit() {
    // Inscrever para escutar eventos de renovação de token
    this.subscription.add(
      tokenRenewalNeeded.subscribe(() => {
        console.log('TokenRenewalDialog: Recebido evento de necessidade de renovação de token');
        this.showRenewal = true;
        this.message = 'Sua sessão expirou. Por favor, renove sua autenticação para continuar.';
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  renewToken() {
    if (this.isRenewing) return;

    this.isRenewing = true;
    console.log('TokenRenewalDialog: Iniciando renovação manual de token');

    // Chamar o método de signIn que vai abrir o popup
    this.authService.signIn()
      .then(() => {
        console.log('TokenRenewalDialog: Token renovado com sucesso');
        this.isRenewing = false;
        this.showRenewal = false;
        
        // Recarregar apenas se necessário, para melhor experiência
        const needsReload = this.checkIfNeedsReload();
        if (needsReload) {
          window.location.reload();
        }
      })
      .catch(error => {
        console.error('TokenRenewalDialog: Erro ao renovar token', error);
        this.isRenewing = false;
        
        // Ajustar a mensagem baseada no tipo de erro
        if (error.toString().includes('popup')) {
          this.message = 'O popup de autenticação foi bloqueado. Permita popups para este site e tente novamente.';
        } else if (error.toString().includes('canceled')) {
          this.message = 'Você cancelou o login. Por favor, tente novamente para continuar usando o aplicativo.';
        } else {
          this.message = 'Erro ao renovar sua sessão. Por favor, tente novamente ou recarregue a página.';
        }
      });
  }

  private checkIfNeedsReload(): boolean {
    // Verificar se estamos em uma página que precisa ser recarregada
    // Normalmente, páginas com muitos dados ou que fazem muitas chamadas à API
    const currentPath = window.location.pathname;
    return currentPath.includes('/draft') || 
           currentPath.includes('/admin') || 
           currentPath.includes('/team');
  }
} 