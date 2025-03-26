import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamLogoService } from './core/services/team-logo.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    TeamLogoService
  ],
  exports: []
})
export class CoreModule { }
