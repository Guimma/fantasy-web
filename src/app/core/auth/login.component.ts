import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { GoogleAuthService } from '../services/google-auth.service';
import { NotificationService } from '../services/notification.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    NgIf
  ],
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Sign In</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Sign in with your Google account to access Fantasy App.</p>
          <p *ngIf="errorMessage" class="error-message">{{ errorMessage }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="loginWithGoogle()" [disabled]="isLoading">
            <mat-icon>login</mat-icon> Sign in with Google
          </button>
        </mat-card-actions>
        <div *ngIf="isLoading" class="spinner-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      </mat-card>
    </div>
  `,
  styles: `
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    mat-card {
      max-width: 400px;
      width: 100%;
      padding: 20px;
    }
    mat-card-actions {
      display: flex;
      justify-content: center;
    }
    .spinner-container {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
    .error-message {
      color: #f44336;
      margin-top: 16px;
      text-align: center;
    }
  `
})
export class LoginComponent {
  private router = inject(Router);
  private googleAuthService = inject(GoogleAuthService);
  private notificationService = inject(NotificationService);
  
  isLoading = false;
  errorMessage = '';

  async loginWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Sign in with Google
      await this.googleAuthService.signIn();
      
      // Validate sheet access
      const hasAccess = await this.googleAuthService.validateSheetAccess();
      
      if (hasAccess) {
        this.notificationService.success('Successfully signed in!');
        this.router.navigate(['/']);
      } else {
        this.errorMessage = 'You do not have access to the required Google Sheet. Make sure your Google account has access to the sheet and try again.';
        this.notificationService.error(this.errorMessage);
        // Don't sign out immediately to allow the user to see the error
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Set a more detailed error message
      if (typeof error === 'string') {
        this.errorMessage = error;
      } else if (error?.error?.error?.message) {
        this.errorMessage = `Error: ${error.error.error.message}`;
      } else if (error?.message) {
        this.errorMessage = `Error: ${error.message}`;
      } else {
        this.errorMessage = 'Failed to sign in with Google. Please try again.';
      }
      
      this.notificationService.error(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }
} 