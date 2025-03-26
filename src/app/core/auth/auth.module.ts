import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { GoogleLoginComponent } from './google-login/google-login.component';

@NgModule({
  declarations: [
    GoogleLoginComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    AuthService,
    AuthGuard
  ],
  exports: [
    GoogleLoginComponent
  ]
})
export class AuthModule { } 