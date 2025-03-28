import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(GoogleAuthService);
  const router = inject(Router);

  // Verificar se existe um usuário autenticado
  if (!authService.isAuthenticated()) {
    console.log('authGuard: Usuário não autenticado, redirecionando para login');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Verificar se o token é válido e renovar se necessário
  return authService.checkTokenValidity().pipe(
    map(isValid => {
      if (isValid) {
        console.log('authGuard: Token válido, permitindo acesso');
        return true;
      } else {
        console.log('authGuard: Token inválido mesmo após tentativa de renovação');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    }),
    catchError(() => {
      console.error('authGuard: Erro ao verificar token, redirecionando para login');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
}; 