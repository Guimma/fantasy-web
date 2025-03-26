import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { GoogleAuthService } from '../services/google-auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(GoogleAuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  
  if (authService.isAdmin()) {
    return true;
  }
  
  return router.createUrlTree(['/access-denied']);
}; 