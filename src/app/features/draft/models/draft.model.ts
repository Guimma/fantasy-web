export type DraftStatus = 'not_started' | 'in_progress' | 'finished';

export interface DraftTeam {
  id: string;
  name: string;
  players: Athlete[];
  ligaId: string;
  userId: string;
}

export interface DraftOrder {
  teamId: string;
  round: number;
  order: number;
}

export interface DraftOrderData {
  order: DraftOrder[];
  currentRound: number;
  currentIndex: number;
}

export interface DraftConfig {
  draftId: string;
  pickTime: number;
  requiredPositions: {
    totalPlayers: number;    // 18 total players
    starters: number;        // 11 starters
    reserves: number;        // 6 reserves
    requiredCoach: number;   // 1 required coach
  };
}

export interface Athlete {
  id: string;
  idCartola: string;
  slug: string;          // Campo para o ID no formato ATL_PPP13J
  slugVariants?: string[]; // Diferentes variantes de slug para comparação
  nome: string;
  apelido: string;
  foto_url?: string;
  posicao: string;
  posicaoAbreviacao: string;
  clube: string;
  clubeAbreviacao: string;
  preco: number;
  mediaPontos: number;
  jogos: number;
  status: string;
  pontuacao?: number;    // Pontuação do jogador na rodada atual
  ultimaAtualizacao?: string;
  dataCriacao?: string;
}

export interface PlayerAssignment {
  teamId: string;
  athleteId: string;
  round: number;
  pickOrder: number;
  timestamp: string;
} 