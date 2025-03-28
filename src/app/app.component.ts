import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TokenRenewalDialogComponent } from './core/components/token-renewal-dialog/token-renewal-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TokenRenewalDialogComponent
  ],
  template: `
    <app-token-renewal-dialog></app-token-renewal-dialog>
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {}
