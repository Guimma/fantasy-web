import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorageService } from './storage.service';

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly CACHE_PREFIX = 'cache_';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private storageService: StorageService) {}

  set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): void {
    const item: CacheItem<T> = {
      value,
      timestamp: Date.now()
    };

    this.storageService.set(this.getCacheKey(key), item);
    setTimeout(() => this.remove(key), ttl);
  }

  get<T>(key: string): T | null {
    const item = this.storageService.get<CacheItem<T>>(this.getCacheKey(key));
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.DEFAULT_TTL;
    if (isExpired) {
      this.remove(key);
      return null;
    }

    return item.value;
  }

  getOrSet<T>(key: string, dataFn: () => Observable<T>, ttl: number = this.DEFAULT_TTL): Observable<T> {
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      return of(cachedData);
    }

    return dataFn().pipe(
      tap(data => this.set(key, data, ttl))
    );
  }

  remove(key: string): void {
    this.storageService.remove(this.getCacheKey(key));
  }

  clear(): void {
    const keys = this.storageService.getKeys();
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        this.storageService.remove(key);
      }
    });
  }

  private getCacheKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private isExpired<T>(cacheItem: CacheItem<T>): boolean {
    return Date.now() - cacheItem.timestamp > cacheItem.ttl;
  }

  // Métodos específicos para tipos comuns
  getString(key: string): string | null {
    return this.get<string>(key);
  }

  getNumber(key: string): number | null {
    return this.get<number>(key);
  }

  getBoolean(key: string): boolean | null {
    return this.get<boolean>(key);
  }

  getArray<T>(key: string): T[] | null {
    return this.get<T[]>(key);
  }

  getObject<T>(key: string): T | null {
    return this.get<T>(key);
  }
} 