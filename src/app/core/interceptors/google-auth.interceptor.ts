import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { GoogleAuthService } from '../services/google-auth.service';

@Injectable()
export class GoogleAuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: GoogleAuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Apenas intercepta chamadas para a API do Google Sheets
    if (this.isGoogleSheetsRequest(request)) {
      return next.handle(request).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            return this.handle401Error(request, next);
          }
          return throwError(() => error);
        })
      );
    }
    
    // Para outras chamadas, apenas passa adiante
    return next.handle(request);
  }

  private isGoogleSheetsRequest(request: HttpRequest<any>): boolean {
    return request.url.includes('sheets.googleapis.com');
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(token => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          
          // Clonar a requisição original e adicionar o novo token
          const clonedRequest = this.addToken(request, token);
          return next.handle(clonedRequest);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          // Se falhar ao renovar o token, limpar sessão e enviar para tela de login
          console.error('Falha ao renovar token:', error);
          // Aqui poderia redirecionar para a página de login ou exibir mensagem
          
          return throwError(() => error);
        })
      );
    } else {
      // Se uma renovação já estiver em andamento, aguardar e usar o novo token
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request, token!));
        })
      );
    }
  }

  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
} 