import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { LoadingService } from './loading.service';

export interface Liga {
  id: number;
  nome: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  status: 'ativa' | 'encerrada' | 'cancelada';
  maxParticipantes: number;
  valorInscricao: number;
  premioPrimeiro: number;
  premioSegundo: number;
  premioTerceiro: number;
  regras: string;
  criadorId: number;
  participantes: number[];
  classificacao: Classificacao[];
  estatisticas: EstatisticasLiga;
  configuracaoDraft: ConfiguracaoDraft;
  escolhasDraft: EscolhaDraft[];
  createdAt: string;
  updatedAt: string;
}

export interface Classificacao {
  posicao: number;
  participanteId: number;
  pontos: number;
  vitorias: number;
  derrotas: number;
  empates: number;
  pontosMarcados: number;
  pontosSofridos: number;
  saldoPontos: number;
}

export interface EstatisticasLiga {
  totalParticipantes: number;
  totalJogos: number;
  mediaPontosPorJogo: number;
  maiorPontuacao: number;
  menorPontuacao: number;
  mediaPontosPorParticipante: number;
}

export interface ConfiguracaoDraft {
  dataInicio: string;
  dataFim: string;
  ordemDraft: number[];
  tempoPorEscolha: number;
  status: 'pendente' | 'emAndamento' | 'concluido';
}

export interface EscolhaDraft {
  participanteId: number;
  jogadorId: number;
  ordem: number;
  dataEscolha: string;
}

@Injectable({
  providedIn: 'root'
})
export class LigaService {
  constructor(
    private httpService: HttpService,
    private notificationService: NotificationService
  ) {}

  listarLigas(): Observable<Liga[]> {
    return this.httpService.get<Liga[]>('/ligas').pipe(
      tap(() => this.notificationService.success('ligas.listed'))
    );
  }

  obterLiga(id: number): Observable<Liga> {
    return this.httpService.get<Liga>(`/ligas/${id}`).pipe(
      tap(() => this.notificationService.success('ligas.retrieved'))
    );
  }

  criarLiga(liga: Omit<Liga, 'id' | 'createdAt' | 'updatedAt'>): Observable<Liga> {
    return this.httpService.post<Liga>('/ligas', liga).pipe(
      tap(() => this.notificationService.success('ligas.created'))
    );
  }

  atualizarLiga(id: number, liga: Partial<Liga>): Observable<Liga> {
    return this.httpService.put<Liga>(`/ligas/${id}`, liga).pipe(
      tap(() => this.notificationService.success('ligas.updated'))
    );
  }

  excluirLiga(id: number): Observable<void> {
    return this.httpService.delete<void>(`/ligas/${id}`).pipe(
      tap(() => this.notificationService.success('ligas.deleted'))
    );
  }

  participarLiga(id: number): Observable<Liga> {
    return this.httpService.post<Liga>(`/ligas/${id}/participar`).pipe(
      tap(() => this.notificationService.success('ligas.joined'))
    );
  }

  sairLiga(id: number): Observable<Liga> {
    return this.httpService.post<Liga>(`/ligas/${id}/sair`).pipe(
      tap(() => this.notificationService.success('ligas.left'))
    );
  }

  iniciarDraft(id: number): Observable<Liga> {
    return this.httpService.post<Liga>(`/ligas/${id}/draft/iniciar`).pipe(
      tap(() => this.notificationService.success('ligas.draftStarted'))
    );
  }

  realizarEscolhaDraft(id: number, jogadorId: number): Observable<Liga> {
    return this.httpService.post<Liga>(`/ligas/${id}/draft/escolher`, { jogadorId }).pipe(
      tap(() => this.notificationService.success('ligas.draftChoiceMade'))
    );
  }

  finalizarDraft(id: number): Observable<Liga> {
    return this.httpService.post<Liga>(`/ligas/${id}/draft/finalizar`).pipe(
      tap(() => this.notificationService.success('ligas.draftFinished'))
    );
  }

  obterClassificacao(id: number): Observable<Classificacao[]> {
    return this.httpService.get<Classificacao[]>(`/ligas/${id}/classificacao`).pipe(
      tap(() => this.notificationService.success('ligas.classificationRetrieved'))
    );
  }

  obterEstatisticas(id: number): Observable<EstatisticasLiga> {
    return this.httpService.get<EstatisticasLiga>(`/ligas/${id}/estatisticas`).pipe(
      tap(() => this.notificationService.success('ligas.statisticsRetrieved'))
    );
  }

  obterConfiguracaoDraft(id: number): Observable<ConfiguracaoDraft> {
    return this.httpService.get<ConfiguracaoDraft>(`/ligas/${id}/draft/configuracao`).pipe(
      tap(() => this.notificationService.success('ligas.draftConfigRetrieved'))
    );
  }

  obterEscolhasDraft(id: number): Observable<EscolhaDraft[]> {
    return this.httpService.get<EscolhaDraft[]>(`/ligas/${id}/draft/escolhas`).pipe(
      tap(() => this.notificationService.success('ligas.draftChoicesRetrieved'))
    );
  }
} 