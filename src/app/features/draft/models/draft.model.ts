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
  nome: string;
  posicao: string;
  clube: string;
  status: string;
  foto_url?: string;
}

export interface PlayerAssignment {
  teamId: string;
  athleteId: string;
  round: number;
  pickOrder: number;
  timestamp: string;
} 