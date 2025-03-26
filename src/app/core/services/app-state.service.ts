import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

export interface AppState {
  loading: boolean;
  error: string | null;
  user: any | null;
  theme: 'light' | 'dark';
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private readonly STATE_KEY = 'app_state';
  private stateSubject = new BehaviorSubject<AppState>(this.getInitialState());

  constructor(private storageService: StorageService) {
    this.loadState();
  }

  private getInitialState(): AppState {
    return {
      loading: false,
      error: null,
      user: null,
      theme: 'light',
      language: 'pt-BR'
    };
  }

  private loadState(): void {
    const savedState = this.storageService.get<AppState>(this.STATE_KEY);
    if (savedState) {
      this.stateSubject.next(savedState);
    }
  }

  private saveState(): void {
    this.storageService.set(this.STATE_KEY, this.stateSubject.value);
  }

  updateState(partialState: Partial<AppState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
    this.saveState();
  }

  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  setUser(user: any | null): void {
    this.updateState({ user });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.updateState({ theme });
  }

  setLanguage(language: string): void {
    this.updateState({ language });
  }

  resetState(): void {
    this.stateSubject.next(this.getInitialState());
    this.storageService.remove(this.STATE_KEY);
  }

  getState(): AppState {
    return this.stateSubject.value;
  }

  getState$(): BehaviorSubject<AppState> {
    return this.stateSubject;
  }
} 