import { Athlete } from '../../draft/models/draft.model';

/**
 * Interface que representa um registro de jogador em um time para uma rodada específica
 */
export interface TeamPlayerHistory {
  registroId: string;
  timeId: string;
  atletaId: string;
  cartolaId: string;
  statusTime: string;
  valorCompra: number;
  dataAquisicao: string;
  rodadaId: number;
  dataRegistro: string;
}

/**
 * Interface que representa o time completo de uma rodada específica
 */
export interface TeamRoundHistory {
  timeId: string;
  rodadaId: number;
  dataRegistro: string;
  formacao: string; // ID da formação utilizada na rodada (ex: '4-3-3', '4-4-2', etc.)
  jogadores: Athlete[];
}

/**
 * Interface que representa uma formação histórica de um time para uma rodada específica
 */
export interface FormacaoHistorica {
  registroId: string;
  timeId: string;
  rodadaId: number;
  idFormacao: string;
} 