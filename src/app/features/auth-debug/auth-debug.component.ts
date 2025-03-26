import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GoogleAuthService, GoogleUser } from '../../core/services/google-auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatDividerModule, 
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Diagnóstico de Autenticação</mat-card-title>
        <mat-card-subtitle>Ferramenta para verificar a autenticação e acesso à planilha</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <h3>Usuário atual</h3>
        <div *ngIf="currentUser; else noUser">
          <table>
            <tr>
              <td><strong>Nome:</strong></td>
              <td>{{ currentUser.name }}</td>
            </tr>
            <tr>
              <td><strong>Email:</strong></td>
              <td>{{ currentUser.email }}</td>
            </tr>
            <tr>
              <td><strong>Perfil:</strong></td>
              <td>{{ currentUser.role || 'Não definido' }}</td>
            </tr>
          </table>
          
          <img *ngIf="currentUser.picture" [src]="currentUser.picture" alt="Foto do usuário" style="width: 100px; height: 100px; border-radius: 50%;">
        </div>
        
        <ng-template #noUser>
          <p>Nenhum usuário autenticado</p>
        </ng-template>
        
        <mat-divider class="my-3"></mat-divider>
        
        <h3>Acesso à planilha</h3>
        <div *ngIf="isCheckingAccess" class="center">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Verificando acesso...</p>
        </div>
        
        <div *ngIf="!isCheckingAccess">
          <p *ngIf="hasSheetAccess === true" class="success">
            ✅ Acesso à planilha confirmado
          </p>
          <p *ngIf="hasSheetAccess === false" class="error">
            ❌ Sem acesso à planilha
          </p>
        </div>

        <mat-divider class="my-3"></mat-divider>
        
        <h3>Dados da planilha</h3>
        <div *ngIf="isLoadingSheetData" class="center">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Carregando dados da planilha...</p>
        </div>
        
        <div *ngIf="!isLoadingSheetData && sheetData.length > 0">
          <table class="sheet-data">
            <thead>
              <tr>
                <th *ngFor="let header of sheetData[0]">{{ header }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of sheetData.slice(1)">
                <td *ngFor="let cell of row">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="checkSheetAccess()" [disabled]="isCheckingAccess || !currentUser">
          Verificar acesso à planilha
        </button>
        <button mat-raised-button color="accent" (click)="loadSheetData()" [disabled]="isLoadingSheetData || !currentUser">
          Carregar dados da planilha
        </button>
        <button mat-button (click)="signIn()" *ngIf="!currentUser">Entrar</button>
        <button mat-button (click)="signOut()" *ngIf="currentUser">Sair</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    mat-card {
      max-width: 800px;
      margin: 20px auto;
    }
    table {
      width: 100%;
      margin-bottom: 20px;
    }
    table td {
      padding: 8px;
    }
    .my-3 {
      margin-top: 20px;
      margin-bottom: 20px;
    }
    .center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 20px 0;
    }
    .success {
      color: green;
      font-weight: bold;
    }
    .error {
      color: red;
      font-weight: bold;
    }
    .sheet-data {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .sheet-data th, .sheet-data td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    .sheet-data th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .sheet-data tr:nth-child(even) {
      background-color: #f9f9f9;
    }
  `]
})
export class AuthDebugComponent implements OnInit {
  currentUser: GoogleUser | null = null;
  hasSheetAccess: boolean | null = null;
  isCheckingAccess = false;
  isLoadingSheetData = false;
  sheetData: string[][] = [];
  private readonly SHEET_ID = '1n3FjgSy19YCHZhsRA3HR0d92o3yAHhLBjYwEHSYJwjI';
  private readonly USERS_RANGE = 'Usuarios!A:F';

  constructor(
    private authService: GoogleAuthService,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Observar alterações no usuário atual
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      this.hasSheetAccess = null; // Resetar status de acesso quando o usuário muda
      this.sheetData = []; // Limpar dados da planilha quando o usuário muda
    });
  }

  signIn(): void {
    this.authService.signIn()
      .then(() => {
        this.snackBar.open('Login realizado com sucesso', 'Fechar', {
          duration: 3000
        });
      })
      .catch(error => {
        console.error('Erro no login:', error);
        this.snackBar.open('Erro no login: ' + error, 'Fechar', {
          duration: 5000
        });
      });
  }

  signOut(): void {
    this.authService.signOut();
    this.snackBar.open('Logout realizado com sucesso', 'Fechar', {
      duration: 3000
    });
  }

  checkSheetAccess(): void {
    if (!this.currentUser) {
      this.snackBar.open('Você precisa estar autenticado', 'Fechar', {
        duration: 3000
      });
      return;
    }

    this.isCheckingAccess = true;
    this.hasSheetAccess = null;

    this.authService.verifySheetAccess().subscribe({
      next: (hasAccess) => {
        this.hasSheetAccess = hasAccess;
        this.isCheckingAccess = false;
        
        if (hasAccess) {
          this.snackBar.open('Acesso à planilha confirmado', 'Fechar', {
            duration: 3000
          });
        } else {
          this.snackBar.open('Sem acesso à planilha', 'Fechar', {
            duration: 5000
          });
        }
      },
      error: (error) => {
        console.error('Erro ao verificar acesso:', error);
        this.isCheckingAccess = false;
        this.hasSheetAccess = false;
        
        this.snackBar.open('Erro ao verificar acesso: ' + error, 'Fechar', {
          duration: 5000
        });
      }
    });
  }

  loadSheetData(): void {
    if (!this.currentUser) {
      this.snackBar.open('Você precisa estar autenticado', 'Fechar', {
        duration: 3000
      });
      return;
    }

    this.isLoadingSheetData = true;
    this.sheetData = [];

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.SHEET_ID}/values/${this.USERS_RANGE}`;
    const headers = { 
      'Authorization': `Bearer ${this.currentUser.accessToken}`,
      'Content-Type': 'application/json'
    };

    this.http.get<{values: string[][]}>(url, { headers }).subscribe({
      next: (response: any) => {
        console.log('Dados da planilha:', response);
        if (response.values && response.values.length > 0) {
          this.sheetData = response.values;
          this.snackBar.open('Dados carregados com sucesso', 'Fechar', {
            duration: 3000
          });
        } else {
          this.snackBar.open('Planilha vazia ou sem dados', 'Fechar', {
            duration: 3000
          });
        }
        this.isLoadingSheetData = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados da planilha:', error);
        this.isLoadingSheetData = false;
        
        this.snackBar.open('Erro ao carregar dados: ' + error.error?.error?.message || error.message, 'Fechar', {
          duration: 5000
        });
      }
    });
  }
} 