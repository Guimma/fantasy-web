import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(GoogleAuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page
  router.navigate(['/login']);
  return false;
}; 