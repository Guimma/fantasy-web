import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-team-name-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="team-name-editor">
      <div *ngIf="!isEditing" class="team-name-display">
        <h1>{{ teamName || 'Meu Time' }}</h1>
        <button mat-icon-button color="primary" (click)="startEditing()">
          <mat-icon>edit</mat-icon>
        </button>
      </div>
      
      <form *ngIf="isEditing" [formGroup]="teamNameForm" (ngSubmit)="saveName()" class="team-name-form">
        <mat-form-field appearance="outline">
          <mat-label>Nome do Time</mat-label>
          <input matInput formControlName="name" placeholder="Digite o nome do time">
          <mat-error *ngIf="teamNameForm.get('name')?.hasError('required')">
            Nome do time é obrigatório
          </mat-error>
          <mat-error *ngIf="teamNameForm.get('name')?.hasError('minlength')">
            Nome deve ter no mínimo 3 caracteres
          </mat-error>
        </mat-form-field>
        
        <div class="form-actions">
          <button mat-button type="button" (click)="cancelEditing()">Cancelar</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="teamNameForm.invalid">
            Salvar
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .team-name-editor {
      width: 100%;
    }
    
    .team-name-display {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }
    
    .team-name-display h1 {
      margin: 0;
      font-size: 28px;
      color: var(--primary-color);
    }
    
    .team-name-form {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }
    
    .team-name-form mat-form-field {
      min-width: 300px;
    }
    
    .form-actions {
      display: flex;
      gap: var(--spacing-sm);
    }
    
    @media (max-width: 768px) {
      .team-name-form {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
      }
      
      .team-name-form mat-form-field {
        width: 100%;
      }
    }
  `
})
export class TeamNameEditorComponent {
  @Input() teamName: string = '';
  @Input() isEditing: boolean = false;
  @Output() edit = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();
  
  teamNameForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)])
  });
  
  ngOnChanges(): void {
    if (this.isEditing) {
      this.teamNameForm.setValue({ name: this.teamName || '' });
    }
  }
  
  startEditing(): void {
    this.teamNameForm.setValue({ name: this.teamName || '' });
    this.edit.emit(true);
  }
  
  cancelEditing(): void {
    this.cancel.emit();
  }
  
  saveName(): void {
    if (this.teamNameForm.invalid) {
      return;
    }
    
    this.save.emit(this.teamNameForm.value.name || '');
  }
} 