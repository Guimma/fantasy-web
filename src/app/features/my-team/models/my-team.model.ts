import { Athlete } from '../../draft/models/draft.model';

export interface MyTeam {
  id: string;
  name: string;
  formation: string;
  players: MyTeamPlayer[];
  lineup: LineupPlayer[];
  userId: string;
  ligaId: string;
  saldo: number;
  pontuacaoTotal: number;
  pontuacaoUltimaRodada: number;
  colocacao: number;
}

export interface MyTeamPlayer extends Athlete {
  inLineup: boolean;
  position?: string; // Posição no campo: 'goleiro', 'zagueiro', 'lateral', 'meio-campo', 'atacante', 'tecnico'
}

export interface LineupPlayer {
  athleteId: string;
  position: string; // Posição no campo: 'GOL1', 'ZAG1', 'ZAG2', 'LAT1', 'LAT2', 'MEI1', 'MEI2', 'MEI3', 'ATA1', 'ATA2', 'ATA3', 'TEC'
  x: number; // Posição X no campo (0-100)
  y: number; // Posição Y no campo (0-100)
}

export interface Formation {
  id: string;
  name: string; // Ex: "4-3-3", "4-4-2", etc.
  defenders: number;
  midfielders: number;
  forwards: number;
  positions: FormationPosition[];
}

export interface FormationPosition {
  id: string; // GOL1, ZAG1, ZAG2, etc.
  type: string; // GOL, ZAG, LAT, MEI, ATA, TEC
  x: number; // Posição X no campo (0-100)
  y: number; // Posição Y no campo (0-100)
}

export const FORMATIONS: Formation[] = [
  {
    id: 'F001',
    name: '4-3-3',
    defenders: 4,
    midfielders: 3,
    forwards: 3,
    positions: [
      { id: 'GOL1', type: 'GOL', x: 50, y: 95 },
      { id: 'ZAG1', type: 'ZAG', x: 30, y: 75 },
      { id: 'ZAG2', type: 'ZAG', x: 70, y: 75 },
      { id: 'LAT1', type: 'LAT', x: 10, y: 65 },
      { id: 'LAT2', type: 'LAT', x: 90, y: 65 },
      { id: 'MEI1', type: 'MEI', x: 30, y: 50 },
      { id: 'MEI2', type: 'MEI', x: 50, y: 55 },
      { id: 'MEI3', type: 'MEI', x: 70, y: 50 },
      { id: 'ATA1', type: 'ATA', x: 20, y: 25 },
      { id: 'ATA2', type: 'ATA', x: 50, y: 20 },
      { id: 'ATA3', type: 'ATA', x: 80, y: 25 },
      { id: 'TEC', type: 'TEC', x: 10, y: 5 }
    ]
  },
  {
    id: 'F002',
    name: '4-4-2',
    defenders: 4,
    midfielders: 4,
    forwards: 2,
    positions: [
      { id: 'GOL1', type: 'GOL', x: 50, y: 95 },
      { id: 'ZAG1', type: 'ZAG', x: 30, y: 75 },
      { id: 'ZAG2', type: 'ZAG', x: 70, y: 75 },
      { id: 'LAT1', type: 'LAT', x: 10, y: 65 },
      { id: 'LAT2', type: 'LAT', x: 90, y: 65 },
      { id: 'MEI1', type: 'MEI', x: 20, y: 50 },
      { id: 'MEI2', type: 'MEI', x: 40, y: 45 },
      { id: 'MEI3', type: 'MEI', x: 60, y: 45 },
      { id: 'MEI4', type: 'MEI', x: 80, y: 50 },
      { id: 'ATA1', type: 'ATA', x: 35, y: 25 },
      { id: 'ATA2', type: 'ATA', x: 65, y: 25 },
      { id: 'TEC', type: 'TEC', x: 10, y: 5 }
    ]
  },
  {
    id: 'F003',
    name: '3-5-2',
    defenders: 3,
    midfielders: 5,
    forwards: 2,
    positions: [
      { id: 'GOL1', type: 'GOL', x: 50, y: 95 },
      { id: 'ZAG1', type: 'ZAG', x: 30, y: 75 },
      { id: 'ZAG2', type: 'ZAG', x: 50, y: 80 },
      { id: 'ZAG3', type: 'ZAG', x: 70, y: 75 },
      { id: 'MEI1', type: 'MEI', x: 15, y: 60 },
      { id: 'MEI2', type: 'MEI', x: 35, y: 50 },
      { id: 'MEI3', type: 'MEI', x: 50, y: 55 },
      { id: 'MEI4', type: 'MEI', x: 65, y: 50 },
      { id: 'MEI5', type: 'MEI', x: 85, y: 60 },
      { id: 'ATA1', type: 'ATA', x: 35, y: 25 },
      { id: 'ATA2', type: 'ATA', x: 65, y: 25 },
      { id: 'TEC', type: 'TEC', x: 10, y: 5 }
    ]
  },
  {
    id: 'F004',
    name: '3-4-3',
    defenders: 3,
    midfielders: 4,
    forwards: 3,
    positions: [
      { id: 'GOL1', type: 'GOL', x: 50, y: 95 },
      { id: 'ZAG1', type: 'ZAG', x: 30, y: 75 },
      { id: 'ZAG2', type: 'ZAG', x: 50, y: 80 },
      { id: 'ZAG3', type: 'ZAG', x: 70, y: 75 },
      { id: 'MEI1', type: 'MEI', x: 20, y: 55 },
      { id: 'MEI2', type: 'MEI', x: 40, y: 50 },
      { id: 'MEI3', type: 'MEI', x: 60, y: 50 },
      { id: 'MEI4', type: 'MEI', x: 80, y: 55 },
      { id: 'ATA1', type: 'ATA', x: 25, y: 25 },
      { id: 'ATA2', type: 'ATA', x: 50, y: 20 },
      { id: 'ATA3', type: 'ATA', x: 75, y: 25 },
      { id: 'TEC', type: 'TEC', x: 10, y: 5 }
    ]
  },
  {
    id: 'F005',
    name: '5-3-2',
    defenders: 5,
    midfielders: 3,
    forwards: 2,
    positions: [
      { id: 'GOL1', type: 'GOL', x: 50, y: 95 },
      { id: 'ZAG1', type: 'ZAG', x: 30, y: 75 },
      { id: 'ZAG2', type: 'ZAG', x: 50, y: 80 },
      { id: 'ZAG3', type: 'ZAG', x: 70, y: 75 },
      { id: 'LAT1', type: 'LAT', x: 10, y: 65 },
      { id: 'LAT2', type: 'LAT', x: 90, y: 65 },
      { id: 'MEI1', type: 'MEI', x: 30, y: 50 },
      { id: 'MEI2', type: 'MEI', x: 50, y: 45 },
      { id: 'MEI3', type: 'MEI', x: 70, y: 50 },
      { id: 'ATA1', type: 'ATA', x: 35, y: 25 },
      { id: 'ATA2', type: 'ATA', x: 65, y: 25 },
      { id: 'TEC', type: 'TEC', x: 10, y: 5 }
    ]
  }
]; 