import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { GoogleAuthService } from '../../core/services/google-auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="access-denied-container">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar color="warn">block</mat-icon>
          <mat-card-title>Acesso Negado</mat-card-title>
          <mat-card-subtitle>Você não tem permissão para acessar esta página</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>Você está autenticado como <strong>{{ authService.currentUser?.name }}</strong> com o perfil <strong>{{ authService.currentUser?.role }}</strong>.</p>
          <p>O recurso que você está tentando acessar está disponível apenas para usuários com perfil de <strong>Administrador</strong>.</p>
          <p>Se você acredita que deveria ter acesso a este recurso, entre em contato com o administrador do sistema.</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" routerLink="/">
            <mat-icon>home</mat-icon> Voltar para a Página Inicial
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .access-denied-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
    }

    mat-card {
      max-width: 600px;
      width: 100%;
    }

    mat-card-content {
      padding: 20px 0;
    }

    mat-card-actions {
      display: flex;
      justify-content: flex-end;
    }
  `
})
export class AccessDeniedComponent {
  protected authService = inject(GoogleAuthService);
} 