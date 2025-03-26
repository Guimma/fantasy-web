import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private readonly API_URL = 'http://localhost:3000/api';
  private readonly TOKEN_KEY = 'auth_token';
  private platformId = inject(PLATFORM_ID);

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getHeaders(): HttpHeaders {
    let token = null;
    if (this.isBrowser) {
      token = localStorage.getItem(this.TOKEN_KEY);
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request';
          break;
        case 401:
          errorMessage = 'Unauthorized';
          // Handle unauthorized without calling AuthService
          if (this.isBrowser) {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem('user');
          }
          // We could emit an event here or use a different service
          break;
        case 403:
          errorMessage = 'Forbidden';
          break;
        case 404:
          errorMessage = 'Not Found';
          break;
        case 500:
          errorMessage = 'Internal Server Error';
          break;
        default:
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }

    this.notificationService.error(errorMessage);
    return throwError(() => error);
  }

  get<T>(url: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.API_URL}${url}`, {
      headers: this.getHeaders(),
      params
    }).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.API_URL}${url}`, body, {
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.API_URL}${url}`, body, {
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.API_URL}${url}`, {
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }

  patch<T>(url: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.API_URL}${url}`, body, {
      headers: this.getHeaders()
    }).pipe(
      retry(1),
      catchError(this.handleError.bind(this))
    );
  }
} 