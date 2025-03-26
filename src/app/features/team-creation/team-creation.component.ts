import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GoogleAuthService } from '../../core/services/google-auth.service';

@Component({
  selector: 'app-team-creation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="team-creation-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Crie seu time</mat-card-title>
          <mat-card-subtitle>
            Antes de continuar, você precisa criar um time para participar do Fantasy Futebol
          </mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="teamForm" (ngSubmit)="onSubmit()">
            <div class="form-field">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nome do Time</mat-label>
                <input matInput formControlName="teamName" placeholder="Ex: Leões do Tietê">
                <mat-error *ngIf="teamForm.get('teamName')?.hasError('required')">
                  Nome do time é obrigatório
                </mat-error>
                <mat-error *ngIf="teamForm.get('teamName')?.hasError('minlength')">
                  Nome do time deve ter pelo menos 3 caracteres
                </mat-error>
                <mat-error *ngIf="teamForm.get('teamName')?.hasError('maxlength')">
                  Nome do time deve ter no máximo 30 caracteres
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit" 
                [disabled]="teamForm.invalid || isCreating">
                <span *ngIf="!isCreating">Criar Time</span>
                <mat-spinner *ngIf="isCreating" diameter="24"></mat-spinner>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .team-creation-container {
      max-width: 500px;
      margin: 50px auto;
      padding: 0 20px;
    }
    
    .form-field {
      margin-bottom: 20px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
    
    mat-card-title {
      font-size: 24px;
      margin-bottom: 16px;
    }
    
    mat-card-subtitle {
      margin-bottom: 24px;
    }
    
    mat-spinner {
      margin: 0 auto;
    }
  `
})
export class TeamCreationComponent implements OnInit {
  teamForm: FormGroup;
  isCreating = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: GoogleAuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.teamForm = this.formBuilder.group({
      teamName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30)
      ]]
    });
  }

  ngOnInit(): void {
    // Verificar se o usuário já tem um time
    if (this.authService.hasTeam()) {
      // Se já tiver time, redirecionar para a página inicial
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (this.teamForm.invalid || this.isCreating) {
      return;
    }

    this.isCreating = true;
    const teamName = this.teamForm.get('teamName')?.value;

    this.authService.createTeam(teamName)
      .then(team => {
        console.log('Time criado:', team);
        this.snackBar.open(`Time "${team.name}" criado com sucesso!`, 'Fechar', {
          duration: 3000
        });
        // Redirecionar para a página inicial
        this.router.navigate(['/home']);
      })
      .catch(error => {
        console.error('Erro ao criar time:', error);
        this.snackBar.open('Erro ao criar time. Tente novamente.', 'Fechar', {
          duration: 5000
        });
      })
      .finally(() => {
        this.isCreating = false;
      });
  }
} 