import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem('currentUser') || 'null'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  loginWithGoogle(googleToken: string): Observable<any> {
    return this.http.post(`${this.API_URL}/auth/google`, { token: googleToken });
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  hasAccessToSpreadsheet(): boolean {
    return this.currentUserValue?.hasSpreadsheetAccess || false;
  }

  getUserRole(): string {
    return this.currentUserValue?.role || 'user';
  }

  isAdmin(): boolean {
    return this.getUserRole() === 'admin';
  }

  isManager(): boolean {
    return this.getUserRole() === 'manager';
  }
} 