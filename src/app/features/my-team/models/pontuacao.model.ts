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
  id: string;
  pontuacao: number;
  scout: Record<string, number>;
  nome?: string;
  apelido?: string;
  posicao?: string;
  posicao_abreviacao?: string;
  clube?: string;
  clube_abreviacao?: string;
}

export interface PontuacaoRodada {
  time_id: string;
  rodada_id: number;
  pontuacao_total: number;
  data_calculo: Date;
  atletas_pontuados: AtletaPontuado[];
}

export interface DetalhePontuacaoAtleta {
  atleta: Athlete;
  pontuacao: number;
  scout: Record<string, number>;
} 