/**
 * Modelo de dados para representar as formações como retornadas da planilha.
 * A aba FormacoesPermitidas contém os dados das formações disponíveis.
 */

export interface SheetFormation {
  id: string;              // ID único da formação
  nome: string;            // Nome da formação (ex: "4-3-3")
  descricao: string;       // Descrição opcional da formação
  ativa: boolean;          // Indica se a formação está ativa
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
    descricao: '',
    ativa: false
  };

  // Se a linha não tem dados, retornar valores padrão
  if (!row || row.length === 0) {
    return defaultFormation;
  }

  // Extrair dados usando o mapeamento de cabeçalhos
  const formation: SheetFormation = {
    id: headerMap['id'] !== undefined ? String(row[headerMap['id']] || '') : '',
    nome: headerMap['nome'] !== undefined ? String(row[headerMap['nome']] || '') : '',
    descricao: headerMap['descricao'] !== undefined ? String(row[headerMap['descricao']] || '') : '',
    ativa: false
  };

  // Converter o valor de 'ativa' para booleano
  if (headerMap['ativa'] !== undefined) {
    const ativaValue = row[headerMap['ativa']];
    formation.ativa = 
      ativaValue === true || 
      ativaValue === 'true' || 
      ativaValue === '1' || 
      ativaValue === 1 ||
      String(ativaValue).toLowerCase() === 'sim' ||
      String(ativaValue).toLowerCase() === 's';
  }

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

    // Adicionando aliases comuns para os cabeçalhos
    if (normalizedHeader.includes('id') || normalizedHeader.includes('código') || normalizedHeader.includes('codigo')) {
      headerMap['id'] = index;
    }

    if (normalizedHeader.includes('nome') || normalizedHeader.includes('name')) {
      headerMap['nome'] = index;
    }

    if (normalizedHeader.includes('descricao') || normalizedHeader.includes('descrição') || normalizedHeader.includes('description')) {
      headerMap['descricao'] = index;
    }

    if (normalizedHeader.includes('ativa') || normalizedHeader.includes('ativo') || normalizedHeader.includes('status') || normalizedHeader.includes('active')) {
      headerMap['ativa'] = index;
    }
  });

  return headerMap;
} 