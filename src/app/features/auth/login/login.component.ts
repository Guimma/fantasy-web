import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Fantasy Futebol</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Faça login com sua conta Google para acessar o Fantasy Futebol</p>
          <app-google-login></app-google-login>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    mat-card {
      max-width: 400px;
      text-align: center;
    }
    mat-card-header {
      justify-content: center;
    }
    mat-card-content {
      padding: 20px;
    }
  `]
})
export class LoginComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }
} 