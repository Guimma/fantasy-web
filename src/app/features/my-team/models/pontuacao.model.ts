import { Athlete } from '../../draft/models/draft.model';

export interface Rodada {
  id: number;
  nome: string;
  inicio: Date;
  fim: Date;
  status: 'em_andamento' | 'finalizada' | 'futura';
}

export interface AtletaPontuado {
  atleta_id: string;
  cartola_id: string;  // ID do atleta na API do Cartola
  nome: string;
  apelido: string;
  foto_url?: string;
  posicao: string;
  posicaoAbreviacao: string;
  clube: string;
  clubeAbreviacao: string;
  pontuacao: number;
  scout: Record<string, number>;
  entrou_em_campo?: boolean;
  consideradoNaCalculacao?: boolean;
}

export interface DetalhePontuacaoAtleta {
  rodada_id?: number; // Opcional para compatibilidade com o retorno existente
  atleta: Athlete;
  pontuacao: number;
  scout: Record<string, number>;
  entrou_em_campo?: boolean; // Indica se o jogador entrou em campo na partida
  consideradoNaCalculacao?: boolean; // Indica se o jogador foi considerado no cálculo da pontuação total
}

export interface PontuacaoRodada {
  time_id: string;
  rodada_id: number;
  pontuacao_total: number;
  data_calculo: Date;
  atletas_pontuados: AtletaPontuado[];
} 