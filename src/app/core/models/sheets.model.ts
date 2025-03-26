// Modelos para a aba "Times"
export interface Team {
  id: string;
  name: string;
  owner: string;
  budget: number;
  points: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Jogadores"
export interface Player {
  id: string;
  name: string;
  position: 'GOL' | 'LAT' | 'ZAG' | 'MEI' | 'ATA' | 'TEC';
  club: string;
  price: number;
  status: 'DISPONÍVEL' | 'VENDIDO' | 'LESIONADO' | 'SUSPENSO';
  teamId?: string; // ID do time que possui o jogador
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Escalações"
export interface Lineup {
  id: string;
  teamId: string;
  round: number;
  formation: string; // Ex: "4-4-2"
  players: {
    position: string;
    playerId: string;
    isCaptain: boolean;
    isViceCaptain: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Rodadas"
export interface Round {
  id: string;
  number: number;
  status: 'NÃO_INICIADA' | 'EM_ANDAMENTO' | 'FINALIZADA';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Pontuações"
export interface Scoring {
  id: string;
  playerId: string;
  roundId: string;
  points: number;
  details: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    ownGoals: number;
    missedPenalties: number;
    savedPenalties: number;
    cleanSheet: boolean;
    // Adicione outros detalhes conforme necessário
  };
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Transações"
export interface Transaction {
  id: string;
  type: 'COMPRA' | 'VENDA';
  playerId: string;
  fromTeamId?: string;
  toTeamId: string;
  price: number;
  roundId: string;
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA';
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Configurações"
export interface Settings {
  id: string;
  key: string;
  value: any;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Draft"
export interface Draft {
  id: string;
  status: 'NÃO_INICIADO' | 'EM_ANDAMENTO' | 'FINALIZADO';
  startDate: string;
  endDate?: string;
  currentRound: number;
  currentTeamId?: string;
  order: {
    teamId: string;
    round: number;
    order: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Draft_Config"
export interface DraftConfig {
  id: string;
  draftId: string;
  pickTime: number; // Tempo em segundos para cada escolha
  requiredPositions: {
    totalPlayers: number;    // 18 total players
    starters: number;        // 11 starters
    reserves: number;        // 6 reserves
    requiredCoach: number;   // 1 required coach
  };
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Draft_Order"
export interface DraftOrder {
  id: string;
  draftId: string;
  teamId: string;
  round: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Draft_Status"
export interface DraftStatus {
  id: string;
  draftId: string;
  status: 'NÃO_INICIADO' | 'EM_ANDAMENTO' | 'FINALIZADO';
  currentTeamId?: string;
  currentRound: number;
  currentOrderIndex: number;
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Draft_Team"
export interface DraftTeam {
  id: string;
  draftId: string;
  teamId: string;
  players: string[]; // Array de IDs dos jogadores
  createdAt: string;
  updatedAt: string;
}

// Modelos para a aba "Draft_Player_Assignment"
export interface DraftPlayerAssignment {
  id: string;
  draftId: string;
  teamId: string;
  playerId: string;
  round: number;
  pickOrder: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
} 