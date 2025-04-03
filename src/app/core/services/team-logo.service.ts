import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TeamLogoService {
  private readonly basePath = 'assets/clubs/';
  private readonly defaultLogo = 'assets/clubs/default-team.png';
  private loggedMissingClubs = new Set<string>(); // Armazenar clubes já logados
  
  // Mapeamento de possíveis variações de nomes de clubes para suas siglas
  private readonly clubMappings: {[key: string]: string} = {
    'Atlético-MG': 'CAM',
    'Atletico-MG': 'CAM',
    'Atlético Mineiro': 'CAM',
    'Atletico Mineiro': 'CAM',
    'Atlético-GO': 'ACG',
    'Atletico-GO': 'ACG',
    'Atlético Goianiense': 'ACG',
    'Atletico Goianiense': 'ACG',
    'Athletico-PR': 'CAP',
    'Athletico Paranaense': 'CAP',
    'Atlético-PR': 'CAP',
    'Atletico-PR': 'CAP',
    'Bahia': 'BAH',
    'Botafogo': 'BOT',
    'Botafogo FR': 'BOT',
    'Corinthians': 'COR',
    'Coritiba': 'CFC',
    'Cruzeiro': 'CRU',
    'Cuiabá': 'CUI',
    'Cuiaba': 'CUI',
    'Flamengo': 'FLA',
    'Fluminense': 'FLU',
    'Fortaleza': 'FOR',
    'Grêmio': 'GRE',
    'Gremio': 'GRE',
    'Internacional': 'INT',
    'Juventude': 'JUV',
    'Náutico': 'NAU',
    'Nautico': 'NAU',
    'Palmeiras': 'PAL',
    'Red Bull Bragantino': 'RBB',
    'Bragantino': 'RBB',
    'RB Bragantino': 'RBB',
    'São Paulo': 'SAO',
    'Sao Paulo': 'SAO',
    'Vasco': 'VAS',
    'Vasco da Gama': 'VAS',
    'Vitória': 'VIT',
    'Vitoria': 'VIT',
    'Santos': 'SAN',
    'Ceará': 'CEA',
    'Ceara': 'CEA',
    'Sport': 'SPO',
    'Sport Recife': 'SPO',
    'Mirassol': 'MIR',
    'Goiás': 'GOI',
    'Goias': 'GOI',
    'América-MG': 'AME',
    'America-MG': 'AME',
    'América Mineiro': 'AME',
    'America Mineiro': 'AME',
    'Criciúma': 'CRI',
    'Criciuma': 'CRI',
    'Paraná': 'PAR',
    'Parana': 'PAR',
    'Avaí': 'AVA',
    'Avai': 'AVA',
    'CSA': 'CSA',
    'Chapecoense': 'CHA'
  };

  constructor() { }

  /**
   * Retorna o caminho para a logo do clube a partir do nome ou sigla do clube
   * @param club Nome ou sigla do clube
   * @returns Caminho para o arquivo da logo
   */
  getTeamLogoPath(club: string): string {
    if (!club) {
      return this.defaultLogo;
    }

    // Se for uma sigla de 3 letras, usa diretamente
    if (club.length === 3 && /^[A-Z]{3}$/.test(club)) {
      return `${this.basePath}${club}.png`;
    }

    // Tenta encontrar a sigla a partir do nome do clube
    const sigla = this.clubMappings[club.trim()];
    if (sigla) {
      return `${this.basePath}${sigla}.png`;
    }

    // Registrar o clube desconhecido apenas uma vez para evitar spam no console
    if (!this.loggedMissingClubs.has(club)) {
      console.warn(`Logo não encontrada para o clube: ${club}`);
      this.loggedMissingClubs.add(club);
    }
    
    return this.defaultLogo;
  }

  /**
   * Retorna a sigla do clube a partir do nome
   * @param club Nome do clube
   * @returns Sigla do clube (3 letras)
   */
  getTeamCode(club: string): string {
    if (!club) {
      return 'N/A';
    }

    // Se for uma sigla de 3 letras, retorna ela mesma
    if (club.length === 3 && /^[A-Z]{3}$/.test(club)) {
      return club;
    }

    // Tenta encontrar a sigla a partir do nome do clube
    const sigla = this.clubMappings[club.trim()];
    if (sigla) {
      return sigla;
    }

    // Se não encontrou, retorna as 3 primeiras letras em maiúsculo
    return club.substring(0, 3).toUpperCase();
  }
} 