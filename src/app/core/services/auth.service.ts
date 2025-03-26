import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';
import { AppStateService } from './app-state.service';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private appStateService: AppStateService
  ) {
    this.loadUser();
  }

  private loadUser(): void {
    const user = this.storageService.get<User>('user');
    if (user) {
      this.userSubject.next(user);
      this.appStateService.setUser(user);
    }
  }

  login(credentials: LoginRequest): Promise<void> {
    return firstValueFrom(this.httpService.post<LoginResponse>('/auth/login', credentials))
      .then(response => {
        this.storageService.set(this.TOKEN_KEY, response.token);
        this.storageService.set('user', response.user);
        this.userSubject.next(response.user);
        this.appStateService.setUser(response.user);
        this.notificationService.success('Login successful');
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  register(data: RegisterRequest): Promise<void> {
    return firstValueFrom(this.httpService.post<void>('/auth/register', data))
      .then(() => {
        this.notificationService.success('Registration successful');
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  logout(): void {
    this.storageService.remove(this.TOKEN_KEY);
    this.storageService.remove('user');
    this.userSubject.next(null);
    this.appStateService.setUser(null);
    this.notificationService.success('Logout successful');
  }

  isAuthenticated(): boolean {
    return !!this.storageService.get(this.TOKEN_KEY);
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isManager(): boolean {
    return this.hasRole('manager');
  }

  isUser(): boolean {
    return this.hasRole('user');
  }

  hasRole(role: string): boolean {
    const user = this.userSubject.value;
    return user?.roles.includes(role) || false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some(role => this.hasRole(role));
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every(role => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    const user = this.userSubject.value;
    return user?.permissions.includes(permission) || false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  refreshToken(): Promise<void> {
    return firstValueFrom(this.httpService.post<{ token: string }>('/auth/refresh-token', {}))
      .then(response => {
        this.storageService.set(this.TOKEN_KEY, response.token);
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return firstValueFrom(this.httpService.post<void>('/auth/change-password', {
      currentPassword,
      newPassword
    }))
      .then(() => {
        this.notificationService.success('Password changed successfully');
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  forgotPassword(email: string): Promise<void> {
    return firstValueFrom(this.httpService.post<void>('/auth/forgot-password', { email }))
      .then(() => {
        this.notificationService.success('Password reset instructions sent to your email');
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }

  resetPassword(token: string, newPassword: string): Promise<void> {
    return firstValueFrom(this.httpService.post<void>('/auth/reset-password', {
      token,
      newPassword
    }))
      .then(() => {
        this.notificationService.success('Password reset successfully');
      })
      .catch(error => {
        this.notificationService.showError(error);
        throw error;
      });
  }
} 