import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';

export interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: string;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
  panelClass?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private readonly DEFAULT_DURATION = 5000;
  private readonly DEFAULT_POSITION = {
    horizontal: 'center' as const,
    vertical: 'bottom' as const
  };

  constructor(
    private snackBar: MatSnackBar
  ) {}

  show(message: string, type: NotificationType = 'info', duration: number = 3000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: [`notification-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  showError(error: any): void {
    if (typeof error === 'string') {
      this.error(error);
      return;
    }

    if (error.error?.message) {
      this.error(error.error.message);
      return;
    }

    if (error.message) {
      this.error(error.message);
      return;
    }

    this.error('An unexpected error occurred');
  }

  showSuccess(message: string): void {
    this.success(message);
  }

  showWarning(message: string): void {
    this.warning(message);
  }

  showInfo(message: string): void {
    this.info(message);
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  clearNotifications(): void {
    this.notifications.next([]);
  }
} 