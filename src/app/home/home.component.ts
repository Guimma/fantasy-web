import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router, RouterModule } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { GoogleAuthService } from '../core/services/google-auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule, 
    RouterModule,
    NgIf,
    NgForOf
  ],
  template: `
    <div class="home-container">
      <h1>Fantasy Futebol</h1>

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

    h1 {
      text-align: center;
      margin-bottom: 30px;
      color: #3f51b5;
    }

    .team-info {
      text-align: center;
      margin-bottom: 20px;
    }

    .team-info h2 {
      color: #3f51b5;
      margin: 0;
    }

    .tabs {
      margin-bottom: 30px;
      border-bottom: 1px solid #ddd;
    }

    .tab-container {
      display: flex;
      justify-content: center;
    }

    .tab {
      padding: 12px 24px;
      color: #555;
      text-decoration: none;
      font-size: 16px;
      transition: all 0.3s ease;
    }

    .tab:hover {
      background-color: #f5f5f5;
      color: #3f51b5;
    }

    .active-tab {
      color: #3f51b5;
      border-bottom: 2px solid #3f51b5;
      font-weight: 500;
    }

    .card-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .dashboard-card {
      height: 100%;
    }

    mat-card-content {
      padding-top: 10px;
    }

    @media (max-width: 768px) {
      .tab {
        padding: 10px 15px;
        font-size: 14px;
      }
    }
  `
})
export class HomeComponent implements OnInit {
  protected authService = inject(GoogleAuthService);
  protected router = inject(Router);
  
  currentUser: any = null;
  userTeam: any = null;
  isAdmin = false;

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.isAdmin = this.authService.isAdmin();
    this.userTeam = this.authService.getUserTeam();
  }
} 