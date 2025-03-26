import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from './notification.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(
    private notificationService: NotificationService,
    private appStateService: AppStateService
  ) {}

  handleError(error: HttpErrorResponse): void {
    this.appStateService.setLoading(false);
    this.appStateService.setError(error.message);

    if (error.error instanceof ErrorEvent) {
      // Erro do cliente
      this.notificationService.error('Erro ao processar a requisição');
    } else {
      // Erro do servidor
      switch (error.status) {
        case 400:
          this.notificationService.error('Dados inválidos');
          break;
        case 401:
          this.notificationService.error('Sessão expirada');
          break;
        case 403:
          this.notificationService.error('Acesso negado');
          break;
        case 404:
          this.notificationService.error('Recurso não encontrado');
          break;
        case 409:
          this.notificationService.error('Conflito de dados');
          break;
        case 422:
          this.notificationService.error('Dados inválidos');
          break;
        case 500:
          this.notificationService.error('Erro interno do servidor');
          break;
        default:
          this.notificationService.error('Erro desconhecido');
      }
    }

    console.error('Erro:', error);
  }

  clearError(): void {
    this.appStateService.setError(null);
  }
} 