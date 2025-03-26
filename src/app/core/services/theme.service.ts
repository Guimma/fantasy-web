import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';
import { AppStateService } from './app-state.service';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private themeSubject = new BehaviorSubject<Theme>(this.getInitialTheme());

  constructor(
    private storageService: StorageService,
    private appStateService: AppStateService
  ) {
    this.observeSystemTheme();
  }

  private getInitialTheme(): Theme {
    const savedTheme = this.storageService.get<Theme>(this.THEME_KEY);
    if (savedTheme) return savedTheme;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private observeSystemTheme(): void {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      const savedTheme = this.storageService.get<Theme>(this.THEME_KEY);
      if (!savedTheme) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    this.storageService.set(this.THEME_KEY, theme);
    this.appStateService.setTheme(theme);
    this.applyTheme(theme);
  }

  toggleTheme(): void {
    const currentTheme = this.themeSubject.value;
    this.setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  isDarkTheme(): boolean {
    return this.themeSubject.value === 'dark';
  }

  private applyTheme(theme: Theme): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
  }
} 