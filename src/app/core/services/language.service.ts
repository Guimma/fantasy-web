import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from './storage.service';
import { AppStateService } from './app-state.service';

interface Language {
  code: string;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANGUAGE_KEY = 'language';
  private languageSubject = new BehaviorSubject<string>(this.getInitialLanguage());

  constructor(
    private translateService: TranslateService,
    private storageService: StorageService,
    private appStateService: AppStateService
  ) {
    this.initializeTranslateService();
  }

  private getInitialLanguage(): string {
    const savedLanguage = this.storageService.get<string>(this.LANGUAGE_KEY);
    if (savedLanguage) return savedLanguage;

    const browserLang = this.translateService.getBrowserLang();
    return browserLang || 'pt-BR';
  }

  private initializeTranslateService(): void {
    this.translateService.setDefaultLang('pt-BR');
    this.translateService.use(this.languageSubject.value);
  }

  setLanguage(language: string): void {
    this.languageSubject.next(language);
    this.storageService.set(this.LANGUAGE_KEY, language);
    this.appStateService.setLanguage(language);
    this.translateService.use(language);
  }

  translate(key: string, params?: any): Observable<string> {
    return this.translateService.get(key, params);
  }

  translateSync(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  onLanguageChange(): BehaviorSubject<string> {
    return this.languageSubject;
  }

  getAvailableLanguages(): Language[] {
    return [
      { code: 'pt-BR', label: 'Português' },
      { code: 'en', label: 'English' },
      { code: 'es', label: 'Español' }
    ];
  }
} 