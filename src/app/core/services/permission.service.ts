import { Injectable } from '@angular/core';
import { AuthService } from '../../features/auth/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type Permission = 
  | 'create_liga'
  | 'edit_liga'
  | 'delete_liga'
  | 'manage_users'
  | 'manage_teams'
  | 'manage_players'
  | 'manage_market'
  | 'manage_draft'
  | 'view_reports';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private readonly ADMIN_PERMISSIONS: Permission[] = [
    'create_liga',
    'edit_liga',
    'delete_liga',
    'manage_users',
    'manage_teams',
    'manage_players',
    'manage_market',
    'manage_draft',
    'view_reports'
  ];

  private readonly USER_PERMISSIONS: Permission[] = [
    'create_liga',
    'edit_liga',
    'manage_teams',
    'manage_players',
    'manage_market',
    'manage_draft',
    'view_reports'
  ];

  constructor(private authService: AuthService) {}

  hasPermission(permission: Permission): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      map(state => {
        if (!state.user) {
          return false;
        }

        const permissions = state.user.role === 'admin' 
          ? this.ADMIN_PERMISSIONS 
          : this.USER_PERMISSIONS;

        return permissions.includes(permission);
      })
    );
  }

  hasAnyPermission(permissions: Permission[]): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      map(state => {
        if (!state.user) {
          return false;
        }

        const userPermissions = state.user.role === 'admin' 
          ? this.ADMIN_PERMISSIONS 
          : this.USER_PERMISSIONS;

        return permissions.some(permission => userPermissions.includes(permission));
      })
    );
  }

  hasAllPermissions(permissions: Permission[]): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      map(state => {
        if (!state.user) {
          return false;
        }

        const userPermissions = state.user.role === 'admin' 
          ? this.ADMIN_PERMISSIONS 
          : this.USER_PERMISSIONS;

        return permissions.every(permission => userPermissions.includes(permission));
      })
    );
  }

  isAdmin(): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      map(state => state.user?.role === 'admin')
    );
  }

  getUserPermissions(): Observable<Permission[]> {
    return this.authService.getAuthState().pipe(
      map(state => {
        if (!state.user) {
          return [];
        }

        return state.user.role === 'admin' 
          ? this.ADMIN_PERMISSIONS 
          : this.USER_PERMISSIONS;
      })
    );
  }
} 