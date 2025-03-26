import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';
import { NotificationService } from '../services/notification.service';

export const authAdminGuard: CanActivateFn = () => {
  const authService = inject(GoogleAuthService);
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  if (authService.isAuthenticated()) {
    if (authService.isAdmin()) {
      return true;
    } else {
      // Usuário está autenticado, mas não é administrador
      notificationService.error('Acesso negado. Você precisa ser administrador para acessar esta página.');
      router.navigate(['/access-denied']);
      return false;
    }
  }

  // Não está autenticado, redirecionar para login
  router.navigate(['/login']);
  return false;
}; 