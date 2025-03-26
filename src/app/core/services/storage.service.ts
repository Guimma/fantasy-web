import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  set(key: string, value: any): void {
    if (!this.isBrowser) return;
    
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    
    try {
      const serializedValue = localStorage.getItem(key);
      return serializedValue ? JSON.parse(serializedValue) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  remove(key: string): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  clear(): void {
    if (!this.isBrowser) return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  getLength(): number {
    if (!this.isBrowser) return 0;
    return localStorage.length;
  }

  getKeys(): string[] {
    if (!this.isBrowser) return [];
    return Object.keys(localStorage);
  }

  getAll(): Record<string, any> {
    if (!this.isBrowser) return {};
    
    const result: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        result[key] = this.get(key);
      }
    }
    return result;
  }

  has(key: string): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem(key) !== null;
  }

  getString(key: string): string | null {
    const value = this.get<string>(key);
    return typeof value === 'string' ? value : null;
  }

  getNumber(key: string): number | null {
    const value = this.get<number>(key);
    return typeof value === 'number' ? value : null;
  }

  getBoolean(key: string): boolean | null {
    const value = this.get<boolean>(key);
    return typeof value === 'boolean' ? value : null;
  }

  getArray<T>(key: string): T[] | null {
    const value = this.get<T[]>(key);
    return Array.isArray(value) ? value : null;
  }

  getObject<T>(key: string): T | null {
    const value = this.get<T>(key);
    return value && typeof value === 'object' ? value : null;
  }
} 