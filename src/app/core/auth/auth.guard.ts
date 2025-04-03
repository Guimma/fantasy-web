import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private googleAuthService: GoogleAuthService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    // Primeiro verificar se o usuário está autenticado
    if (!this.authService.isAuthenticated()) {
      console.log('AuthGuard: Usuário não autenticado, redirecionando para login');
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Verificar papéis/roles necessários
    if (route.data['roles'] && !this.hasRequiredRole(route.data['roles'])) {
      console.log('AuthGuard: Usuário não tem o papel necessário, redirecionando para home');
      this.router.navigate(['/']);
      return false;
    }

    // Verificar se o token é válido e renovar se necessário
    return this.googleAuthService.checkTokenValidity().pipe(
      map(isValid => {
        if (isValid) {
          console.log('AuthGuard: Token válido, permitindo acesso');
          return true;
        } else {
          console.log('AuthGuard: Token inválido mesmo após tentativa de renovação');
          this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      }),
      catchError(() => {
        console.error('AuthGuard: Erro ao verificar token, redirecionando para login');
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      })
    );
  }

  private hasRequiredRole(roles: string[]): boolean {
    const userRole = this.authService.getUserRole();
    return roles.includes(userRole);
  }
} 