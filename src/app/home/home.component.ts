import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { GoogleAuthService } from '../core/services/google-auth.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule, 
    RouterModule,
    NgIf,
    NgForOf,
    MatButtonModule
  ],
  template: `
    <div class="home-container">
      <div class="header">
        <h1>Fantasy Futebol</h1>
        <button mat-raised-button color="warn" (click)="logout()">
          Sair
        </button>
      </div>

      <div class="team-info" *ngIf="userTeam">
        <h2>Seu Time: {{ userTeam.name }}</h2>
      </div>
      
      <div class="tabs">
        <div class="tab-container">
          <a class="tab" routerLink="/home" routerLinkActive="active-tab" [routerLinkActiveOptions]="{exact: true}">
            Home
          </a>
          <a class="tab" routerLink="/mercado" routerLinkActive="active-tab">
            Mercado
          </a>
          <a class="tab" routerLink="/escalacao" routerLinkActive="active-tab">
            Escalação
          </a>
          <a class="tab" routerLink="/liga" routerLinkActive="active-tab">
            Liga
          </a>
          <a class="tab" routerLink="/draft" routerLinkActive="active-tab" *ngIf="isAdmin">
            Draft
          </a>
        </div>
      </div>
      
      <div class="card-container">
        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Home</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Bem-vindo ao Fantasy Futebol! Esta é a página inicial.</p>
            <p *ngIf="currentUser">Logado como: {{ currentUser.name }}</p>
            <p *ngIf="userTeam">Time: {{ userTeam.name }} (ID: {{ userTeam.id }})</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Mercado</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Compre e venda jogadores para o seu time.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Escalação</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Configure a escalação do seu time para a próxima rodada.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-header>
            <mat-card-title>Liga</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Veja sua posição na liga e acompanhe os times concorrentes.</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card" *ngIf="isAdmin">
          <mat-card-header>
            <mat-card-title>Draft</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Configure e gerencie o draft da temporada.</p>
            <p>Esta funcionalidade é exclusiva para administradores.</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: `
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .team-info {
      margin-bottom: 20px;
    }
    
    .tabs {
      margin-bottom: 20px;
    }
    
    .tab-container {
      display: flex;
      gap: 10px;
    }
    
    .tab {
      padding: 10px 20px;
      text-decoration: none;
      color: #666;
      border-radius: 4px;
      transition: background-color 0.3s;
    }
    
    .tab:hover {
      background-color: #f5f5f5;
    }
    
    .active-tab {
      background-color: #e0e0e0;
      color: #333;
    }
    
    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .dashboard-card {
      height: 100%;
    }
  `
})
export class HomeComponent implements OnInit {
  protected googleAuthService = inject(GoogleAuthService);
  protected authService = inject(AuthService);
  protected router = inject(Router);
  
  currentUser: any = null;
  userTeam: any = null;
  isAdmin = false;

  ngOnInit(): void {
    this.currentUser = this.googleAuthService.currentUser;
    this.isAdmin = this.googleAuthService.isAdmin();
    this.userTeam = this.googleAuthService.getUserTeam();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 