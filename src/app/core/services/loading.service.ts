import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingStack = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);

  constructor() {}

  show(): void {
    this.loadingStack++;
    this.updateLoadingState();
  }

  hide(): void {
    if (this.loadingStack > 0) {
      this.loadingStack--;
      this.updateLoadingState();
    }
  }

  reset(): void {
    this.loadingStack = 0;
    this.updateLoadingState();
  }

  isLoading(): boolean {
    return this.loadingStack > 0;
  }

  onLoadingChange(): BehaviorSubject<boolean> {
    return this.loadingSubject;
  }

  withLoading<T>(promise: Promise<T>): Promise<T> {
    this.show();
    return promise.finally(() => this.hide());
  }

  private updateLoadingState(): void {
    this.loadingSubject.next(this.isLoading());
  }
} 