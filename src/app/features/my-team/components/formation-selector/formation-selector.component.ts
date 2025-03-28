import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Formation } from '../../models/my-team.model';

@Component({
  selector: 'app-formation-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <div class="formation-selector">
      <mat-form-field appearance="outline">
        <mat-label>Formação</mat-label>
        <mat-select [(value)]="selectedFormation" (selectionChange)="onFormationChange($event.value)">
          <mat-option *ngFor="let formation of formations" [value]="formation.id">
            {{ formation.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: `
    .formation-selector {
      width: 100%;
    }
  `
})
export class FormationSelectorComponent {
  @Input() formations: Formation[] = [];
  @Input() selectedFormation: string = '';
  @Output() formationChanged = new EventEmitter<string>();
  
  onFormationChange(formationId: string): void {
    this.formationChanged.emit(formationId);
  }
} 