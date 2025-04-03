import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CorsProxyService {
  // List of public CORS proxies we can try
  private readonly CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://corsfit.vercel.app/api?url=',
    'https://api.allorigins.win/raw?url='
  ];

  // Current proxy index
  private currentProxyIndex = 0;

  constructor(private http: HttpClient) {}

  /**
   * Get the current proxy URL
   */
  private getCurrentProxy(): string {
    return this.CORS_PROXIES[this.currentProxyIndex];
  }

  /**
   * Rotate to the next proxy if available
   */
  public rotateProxy(): void {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.CORS_PROXIES.length;
    console.log(`[CorsProxy] Switched to proxy: ${this.getCurrentProxy()}`);
  }

  /**
   * Fetch data through a CORS proxy
   */
  public get<T>(url: string, options?: {
    headers?: HttpHeaders;
    params?: HttpParams;
  }): Observable<T> {
    const proxyUrl = `${this.getCurrentProxy()}${encodeURIComponent(url)}`;
    console.log(`[CorsProxy] Proxying request to: ${url} via ${this.getCurrentProxy()}`);
    
    return this.http.get<T>(proxyUrl, options);
  }

  /**
   * Reset to the first proxy
   */
  public resetProxy(): void {
    this.currentProxyIndex = 0;
  }
} 