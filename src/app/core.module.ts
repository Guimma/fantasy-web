import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TeamLogoService } from './core/services/team-logo.service';
import { GoogleAuthInterceptor } from './core/interceptors/google-auth.interceptor';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  providers: [
    TeamLogoService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GoogleAuthInterceptor,
      multi: true
    }
  ],
  exports: []
})
export class CoreModule { }
