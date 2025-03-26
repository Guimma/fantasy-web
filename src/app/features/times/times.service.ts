import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Time, Atleta, Elenco, DetalheTime } from './models/time.model';

@Injectable({
  providedIn: 'root'
})
export class TimesService {
  private readonly API_URL = `${environment.apiUrl}/times`;

  constructor(private http: HttpClient) {}

  listarTimes(ligaId: string): Observable<Time[]> {
    return this.http.get<Time[]>(`${this.API_URL}?ligaId=${ligaId}`);
  }

  obterTime(id: string): Observable<Time> {
    return this.http.get<Time>(`${this.API_URL}/${id}`);
  }

  criarTime(time: Omit<Time, 'id' | 'dataCriacao'>): Observable<Time> {
    return this.http.post<Time>(this.API_URL, time);
  }

  atualizarTime(id: string, time: Partial<Time>): Observable<Time> {
    return this.http.put<Time>(`${this.API_URL}/${id}`, time);
  }

  excluirTime(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  obterElenco(id: string): Observable<Elenco> {
    return this.http.get<Elenco>(`${this.API_URL}/${id}/elenco`);
  }

  obterDetalhes(id: string): Observable<DetalheTime> {
    return this.http.get<DetalheTime>(`${this.API_URL}/${id}/detalhes`);
  }

  alterarFormacao(id: string, formacao: string): Observable<Time> {
    return this.http.put<Time>(`${this.API_URL}/${id}/formacao`, { formacao });
  }

  alterarStatusAtleta(timeId: string, atletaId: string, status: Atleta['status']): Observable<Atleta> {
    return this.http.put<Atleta>(`${this.API_URL}/${timeId}/atletas/${atletaId}/status`, { status });
  }

  transferirAtleta(timeId: string, atletaId: string, novoTimeId: string): Observable<Atleta> {
    return this.http.put<Atleta>(`${this.API_URL}/${timeId}/atletas/${atletaId}/transferir`, { novoTimeId });
  }
} 