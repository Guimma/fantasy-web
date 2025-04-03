import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, catchError, retry } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CorsProxyService {
  // List of public CORS proxies we can try
  private readonly CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://corsfit.vercel.app/api?url=',
    'https://cors-anywhere.herokuapp.com/'
  ];

  // Current proxy index
  private currentProxyIndex = 0;

  constructor(private http: HttpClient) {
    console.log('[CorsProxy] Initialized with proxy:', this.getCurrentProxy());
    
    // Output hostname to help with debugging
    console.log('[CorsProxy] Current hostname:', window.location.hostname);
    console.log('[CorsProxy] Is GitHub Pages:', window.location.hostname.includes('github.io'));
  }

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
    
    return this.http.get<T>(proxyUrl, options).pipe(
      retry(1), // Retry once before failing
      catchError(error => {
        console.error(`[CorsProxy] Error with proxy ${this.getCurrentProxy()}: ${error.message}`);
        console.error('[CorsProxy] Error details:', error);
        
        // If we fail, automatically rotate to next proxy
        if (this.CORS_PROXIES.length > 1) {
          this.rotateProxy();
          console.log(`[CorsProxy] Will try next request with: ${this.getCurrentProxy()}`);
        }
        
        return throwError(() => new Error(`Proxy request failed: ${error.message}`));
      })
    );
  }

  /**
   * Reset to the first proxy
   */
  public resetProxy(): void {
    this.currentProxyIndex = 0;
    console.log(`[CorsProxy] Reset to first proxy: ${this.getCurrentProxy()}`);
  }
} 