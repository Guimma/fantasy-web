import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-google-login',
  template: `
    <div id="googleBtn"></div>
  `,
  styles: [`
    #googleBtn {
      display: inline-block;
    }
  `]
})
export class GoogleLoginComponent implements OnInit {
  constructor(private authService: AuthService) {}

  ngOnInit() {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.handleCredentialResponse.bind(this)
    });

    google.accounts.id.renderButton(
      document.getElementById('googleBtn'),
      { theme: 'outline', size: 'large' }
    );
  }

  private handleCredentialResponse(response: any) {
    if (response.credential) {
      this.authService.loginWithGoogle(response.credential).subscribe({
        next: (user) => {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.authService.currentUserSubject.next(user);
        },
        error: (error) => {
          console.error('Erro no login:', error);
        }
      });
    }
  }
} 