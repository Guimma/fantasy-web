import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  UserProfile,
  ChangePasswordRequest,
  AuthState 
} from './models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_profile';

  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
  });

  constructor(private http: HttpClient) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      const user = JSON.parse(userStr) as UserProfile;
      this.authState.next({
        isAuthenticated: true,
        user,
        token,
        loading: false,
        error: null
      });
    }
  }

  private storeAuth(token: string, user: UserProfile): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearStoredAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  login(credentials: LoginRequest): Observable<TokenResponse> {
    this.authState.next({ ...this.authState.value, loading: true, error: null });
    
    return this.http.post<TokenResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        const user = {
          id: response.user_id,
          nome: response.user_name,
          email: response.user_email,
          role: response.user_role,
          dataCriacao: new Date(response.user_created_at)
        };
        
        this.storeAuth(response.access_token, user);
        this.authState.next({
          isAuthenticated: true,
          user,
          token: response.access_token,
          loading: false,
          error: null
        });
      })
    );
  }

  register(data: RegisterRequest): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.API_URL}/register`, data);
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.API_URL}/profile`);
  }

  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/change-password`, data);
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/logout`, {}).pipe(
      tap(() => {
        this.clearStoredAuth();
        this.authState.next({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
          error: null
        });
      })
    );
  }

  getAuthState(): Observable<AuthState> {
    return this.authState.asObservable();
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  getToken(): string | null {
    return this.authState.value.token;
  }

  getUser(): UserProfile | null {
    return this.authState.value.user;
  }
} 