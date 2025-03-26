import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  AtletaDisponivel, 
  Leilao, 
  Lance, 
  PropostaTroca, 
  ItemTroca,
  DetalheLeilao,
  DetalheProposta 
} from './models/mercado.model';

@Injectable({
  providedIn: 'root'
})
export class MercadoService {
  private readonly API_URL = `${environment.apiUrl}/mercado`;

  constructor(private http: HttpClient) {}

  listarAtletasDisponiveis(): Observable<AtletaDisponivel[]> {
    return this.http.get<AtletaDisponivel[]>(`${this.API_URL}/atletas`);
  }

  obterAtletaDisponivel(id: string): Observable<AtletaDisponivel> {
    return this.http.get<AtletaDisponivel>(`${this.API_URL}/atletas/${id}`);
  }

  listarLeiloesAtivos(): Observable<Leilao[]> {
    return this.http.get<Leilao[]>(`${this.API_URL}/leiloes`);
  }

  obterLeilao(id: string): Observable<DetalheLeilao> {
    return this.http.get<DetalheLeilao>(`${this.API_URL}/leiloes/${id}`);
  }

  criarLeilao(atletaId: string, valorInicial: number, lanceMinimo: number): Observable<Leilao> {
    return this.http.post<Leilao>(`${this.API_URL}/leiloes`, {
      atletaId,
      valorInicial,
      lanceMinimo
    });
  }

  realizarLance(leilaoId: string, valor: number): Observable<Lance> {
    return this.http.post<Lance>(`${this.API_URL}/leiloes/${leilaoId}/lances`, { valor });
  }

  listarPropostasRecebidas(timeId: string): Observable<PropostaTroca[]> {
    return this.http.get<PropostaTroca[]>(`${this.API_URL}/propostas/recebidas/${timeId}`);
  }

  listarPropostasEnviadas(timeId: string): Observable<PropostaTroca[]> {
    return this.http.get<PropostaTroca[]>(`${this.API_URL}/propostas/enviadas/${timeId}`);
  }

  obterProposta(id: string): Observable<DetalheProposta> {
    return this.http.get<DetalheProposta>(`${this.API_URL}/propostas/${id}`);
  }

  criarProposta(
    timeOrigemId: string,
    timeDestinoId: string,
    atletasOrigem: ItemTroca[],
    atletasDestino: ItemTroca[]
  ): Observable<PropostaTroca> {
    return this.http.post<PropostaTroca>(`${this.API_URL}/propostas`, {
      timeOrigemId,
      timeDestinoId,
      atletasOrigem,
      atletasDestino
    });
  }

  responderProposta(id: string, aceitar: boolean): Observable<PropostaTroca> {
    return this.http.put<PropostaTroca>(`${this.API_URL}/propostas/${id}/responder`, { aceitar });
  }

  cancelarProposta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/propostas/${id}`);
  }

  liberarAtleta(atletaId: string): Observable<AtletaDisponivel> {
    return this.http.put<AtletaDisponivel>(`${this.API_URL}/atletas/${atletaId}/liberar`, {});
  }
} 