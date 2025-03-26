import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmButton: string;
  cancelButton: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelButton }}</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ data.confirmButton }}</button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content {
      min-width: 300px;
      padding: 20px 24px;
      margin: 0;
    }
    
    mat-dialog-actions {
      padding: 12px 24px 24px;
      margin-bottom: 0;
      justify-content: flex-end;
      gap: 8px;
    }

    h2[mat-dialog-title] {
      margin: 0;
      padding: 24px 24px 0;
    }

    button {
      margin-left: 8px;
    }
  `
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}
} 