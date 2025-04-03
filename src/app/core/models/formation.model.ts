// Modelo para a aba "FormacoesPermitidas"
export interface Formation {
  id: string;
  name: string; // Ex: "4-3-3", "4-4-2", etc.
  description: string;
  active: boolean;
  defenders: number;
  midfielders: number;
  forwards: number;
  positions: FormationPosition[];
  createdAt?: string;
  updatedAt?: string;
}

// Modelo para as posições dentro de uma formação
export interface FormationPosition {
  id: string; // GOL1, ZAG1, ZAG2, etc.
  type: string; // GOL, ZAG, LAT, MEI, ATA, TEC
  x: number; // Posição X no campo (0-100)
  y: number; // Posição Y no campo (0-100)
}

// Modelo para os dados brutos da planilha com as colunas reais
export interface SheetFormation {
  id: string;               // id_formacao
  nome: string;             // nome
  qtd_goleiros: number;     // qtd_goleiros
  qtd_laterais: number;     // qtd_laterais
  qtd_zagueiros: number;    // qtd_zagueiros
  qtd_meias: number;        // qtd_meias
  qtd_atacantes: number;    // qtd_atacantes
  qtd_tecnicos: number;     // qtd_tecnicos
  ativa?: boolean;          // Campo para compatibilidade com código existente
}

/**
 * Método para converter uma linha de dados da planilha em um objeto SheetFormation
 * @param row Linha de dados da planilha
 * @param headerMap Mapeamento dos índices das colunas
 * @returns Objeto SheetFormation
 */
export function mapRowToSheetFormation(
  row: any[], 
  headerMap: { [key: string]: number }
): SheetFormation {
  // Valores padrão
  const defaultFormation: SheetFormation = {
    id: '',
    nome: '',
    qtd_goleiros: 1,
    qtd_laterais: 2,
    qtd_zagueiros: 2,
    qtd_meias: 4,
    qtd_atacantes: 2,
    qtd_tecnicos: 1
  };

  // Se a linha não tem dados, retornar valores padrão
  if (!row || row.length === 0) {
    return defaultFormation;
  }

  // Extrair dados usando o mapeamento de cabeçalhos
  const formation: SheetFormation = {
    id: headerMap['id_formacao'] !== undefined ? String(row[headerMap['id_formacao']] || '') : '',
    nome: headerMap['nome'] !== undefined ? String(row[headerMap['nome']] || '') : '',
    qtd_goleiros: headerMap['qtd_goleiros'] !== undefined ? parseInt(row[headerMap['qtd_goleiros']] || '1', 10) : 1,
    qtd_laterais: headerMap['qtd_laterais'] !== undefined ? parseInt(row[headerMap['qtd_laterais']] || '2', 10) : 2,
    qtd_zagueiros: headerMap['qtd_zagueiros'] !== undefined ? parseInt(row[headerMap['qtd_zagueiros']] || '2', 10) : 2,
    qtd_meias: headerMap['qtd_meias'] !== undefined ? parseInt(row[headerMap['qtd_meias']] || '4', 10) : 4,
    qtd_atacantes: headerMap['qtd_atacantes'] !== undefined ? parseInt(row[headerMap['qtd_atacantes']] || '2', 10) : 2,
    qtd_tecnicos: headerMap['qtd_tecnicos'] !== undefined ? parseInt(row[headerMap['qtd_tecnicos']] || '1', 10) : 1,
    ativa: true // Por padrão, consideramos ativas todas as formações na planilha
  };

  return formation;
}

/**
 * Método para criar um mapeamento dos cabeçalhos da planilha
 * @param headers Linha de cabeçalhos da planilha
 * @returns Mapeamento de cabeçalhos para índices
 */
export function createHeaderMap(headers: string[]): { [key: string]: number } {
  const headerMap: { [key: string]: number } = {};

  headers.forEach((header, index) => {
    const normalizedHeader = String(header).toLowerCase().trim();
    headerMap[normalizedHeader] = index;
  });

  return headerMap;
}

/**
 * Método para calcular o número total de defensores a partir das quantidades detalhadas
 * @param formation Formação da planilha
 * @returns Número total de defensores (laterais + zagueiros)
 */
export function calculateDefenders(formation: SheetFormation): number {
  return formation.qtd_laterais + formation.qtd_zagueiros;
}

/**
 * Método para analisar o nome da formação e extrair o número de jogadores por posição
 * @param formationName Nome da formação (ex: "4-3-3")
 * @returns Objeto com o número de defensores, meio-campistas e atacantes
 */
export function parseFormationNumbers(formationName: string): { defenders: number, midfielders: number, forwards: number } {
  // Valores padrão
  const defaultNumbers = {
    defenders: 4,
    midfielders: 3,
    forwards: 3
  };

  // Tentar extrair os números do formato X-Y-Z
  const formationPattern = /(\d+)-(\d+)-(\d+)/;
  const match = formationName?.match(formationPattern);

  if (match && match.length >= 4) {
    return {
      defenders: parseInt(match[1], 10),
      midfielders: parseInt(match[2], 10),
      forwards: parseInt(match[3], 10)
    };
  }

  return defaultNumbers;
}

// Lista de formações pré-definidas com posições
export const DEFAULT_FORMATIONS: Formation[] = [
  {
    id: 'F001',
    name: '4-3-3',
    description: 'Formação 4-3-3 clássica',
    active: true,
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
    description: 'Formação 4-4-2 tradicional',
    active: true,
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
    description: 'Formação 3-5-2 com três zagueiros',
    active: true,
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
    description: 'Formação 3-4-3 ofensiva',
    active: true,
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
    description: 'Formação 5-3-2 defensiva',
    active: true,
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