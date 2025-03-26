import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Liga, Classificacao, EstatisticasLiga, ConfiguracaoDraft, EscolhaDraft } from './models/liga.model';

@Injectable({
  providedIn: 'root'
})
export class LigasService {
  private readonly API_URL = `${environment.apiUrl}/ligas`;

  constructor(private http: HttpClient) {}

  listarLigas(): Observable<Liga[]> {
    return this.http.get<Liga[]>(this.API_URL);
  }

  obterLiga(id: string): Observable<Liga> {
    return this.http.get<Liga>(`${this.API_URL}/${id}`);
  }

  criarLiga(liga: Omit<Liga, 'id'>): Observable<Liga> {
    return this.http.post<Liga>(this.API_URL, liga);
  }

  atualizarLiga(id: string, liga: Partial<Liga>): Observable<Liga> {
    return this.http.put<Liga>(`${this.API_URL}/${id}`, liga);
  }

  excluirLiga(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  obterClassificacao(id: string): Observable<Classificacao[]> {
    return this.http.get<Classificacao[]>(`${this.API_URL}/${id}/classificacao`);
  }

  obterEstatisticas(id: string): Observable<EstatisticasLiga> {
    return this.http.get<EstatisticasLiga>(`${this.API_URL}/${id}/estatisticas`);
  }

  iniciarDraft(id: string): Observable<ConfiguracaoDraft> {
    return this.http.post<ConfiguracaoDraft>(`${this.API_URL}/${id}/draft/iniciar`, {});
  }

  finalizarDraft(id: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${id}/draft/finalizar`, {});
  }

  obterStatusDraft(id: string): Observable<ConfiguracaoDraft> {
    return this.http.get<ConfiguracaoDraft>(`${this.API_URL}/${id}/draft/status`);
  }

  definirOrdemDraft(id: string, ordem: string[]): Observable<ConfiguracaoDraft> {
    return this.http.post<ConfiguracaoDraft>(`${this.API_URL}/${id}/draft/ordem`, { ordem });
  }

  realizarEscolhaDraft(id: string, escolha: EscolhaDraft): Observable<ConfiguracaoDraft> {
    return this.http.post<ConfiguracaoDraft>(`${this.API_URL}/${id}/draft/escolher`, escolha);
  }
} 