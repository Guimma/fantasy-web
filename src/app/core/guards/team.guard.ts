import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';

export const teamGuard: CanActivateFn = (route, state) => {
  const authService = inject(GoogleAuthService);
  const router = inject(Router);

  // Verificar se o usuário está autenticado
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Verificar se o usuário já tem um time
  if (!authService.hasTeam()) {
    // Se não tiver time, redirecionar para a tela de criação de time
    return router.createUrlTree(['/create-team']);
  }

  // Se estiver autenticado e tiver um time, permitir o acesso
  return true;
}; 