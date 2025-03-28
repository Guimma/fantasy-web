import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of, timer, Subject } from 'rxjs';
import { catchError, switchMap, filter, take, finalize, timeout, tap, retryWhen, delayWhen, mergeMap } from 'rxjs/operators';
import { GoogleAuthService } from '../services/google-auth.service';
import { Router } from '@angular/router';

// Evento global para notificar quando um token precisa ser renovado manualmente
export const tokenRenewalNeeded = new Subject<void>();

@Injectable()
export class GoogleAuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private maxRetries = 2;

  constructor(
    private authService: GoogleAuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Apenas intercepta chamadas para a API do Google Sheets
    if (this.isGoogleSheetsRequest(request)) {
      console.log('GoogleAuthInterceptor: Interceptando requisição para Google Sheets', request.url);
      
      return next.handle(request).pipe(
        // Adiciona timeout de 30 segundos para todas as requisições
        timeout(30000),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            console.log('GoogleAuthInterceptor: Erro 401 detectado, tentando renovar token');
            return this.handle401Error(request, next);
          } else if (error.status === 403) {
            console.error('GoogleAuthInterceptor: Erro 403 - Permissão negada');
            // Usar console.error em vez de MatSnackBar
            console.error('Você não tem permissão para acessar este recurso');
            return throwError(() => error);
          } else if (error.status === 0 || (error as any).name?.includes('Timeout')) {
            console.error('GoogleAuthInterceptor: Erro de conexão ou timeout', error);
            // Usar console.error em vez de MatSnackBar
            console.error('Problemas de conexão. Verifique sua internet e tente novamente.');
            return throwError(() => error);
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
      console.log('GoogleAuthInterceptor: Iniciando processo de renovação de token');
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap(token => {
          console.log('GoogleAuthInterceptor: Token renovado com sucesso');
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          
          // Notificar via console
          console.log('Token atualizado com sucesso');
          
          // Clonar a requisição original e adicionar o novo token
          const clonedRequest = this.addToken(request, token);
          return next.handle(clonedRequest).pipe(
            // Implementar retry com backoff exponencial para tentativas após refresh do token
            retryWhen(errors => errors.pipe(
              mergeMap((error, index) => {
                if (index < this.maxRetries && error.status !== 401) {
                  const delay = Math.pow(2, index) * 1000;
                  console.log(`Tentando novamente em ${delay}ms - tentativa ${index + 1}`);
                  return timer(delay);
                }
                return throwError(() => error);
              })
            ))
          );
        }),
        catchError((error) => {
          console.error('GoogleAuthInterceptor: Falha ao renovar token', error);
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          
          // Em vez de redirecionar para página de login, emitir um evento para o aplicativo mostrar um diálogo de renovação
          // Este evento pode ser capturado por componentes para mostrar um botão de renovação
          console.log('GoogleAuthInterceptor: Emitindo evento para renovação manual de token');
          tokenRenewalNeeded.next();
          
          // Retornar um erro específico que pode ser tratado pela aplicação
          return throwError(() => new Error('TOKEN_RENEWAL_NEEDED'));
        }),
        finalize(() => {
          // Garantir que o flag seja resetado em qualquer caso
          this.isRefreshing = false;
        })
      );
    } else {
      console.log('GoogleAuthInterceptor: Processo de renovação já em andamento, aguardando');
      // Se uma renovação já estiver em andamento, aguardar e usar o novo token
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          console.log('GoogleAuthInterceptor: Usando token renovado para requisição pendente');
          return next.handle(this.addToken(request, token!));
        }),
        // Se o tempo de espera for muito longo, emitir evento para renovação manual
        timeout(10000),
        catchError(error => {
          console.error('GoogleAuthInterceptor: Timeout ao aguardar renovação do token', error);
          // Notificar a aplicação da necessidade de renovação manual
          tokenRenewalNeeded.next();
          return throwError(() => new Error('TOKEN_RENEWAL_NEEDED'));
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