export interface Time {
  id: string;
  nome: string;
  ligaId: string;
  donoId: string;
  orcamento: number;
  formacao: string;
  status: 'ativo' | 'inativo';
  dataCriacao: Date;
}

export interface Atleta {
  id: string;
  nome: string;
  posicao: 'GOL' | 'ZAG' | 'MEI' | 'ATA';
  valor: number;
  idade: number;
  nacionalidade: string;
  timeId: string;
  status: 'disponivel' | 'titular' | 'reserva' | 'lesionado';
  pontuacao: number;
  gols: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
}

export interface Elenco {
  titulares: Atleta[];
  reservas: Atleta[];
  totalJogadores: number;
  valorTotal: number;
  mediaIdade: number;
}

export interface DetalheTime {
  time: Time;
  elenco: Elenco;
  ultimasPartidas: {
    data: Date;
    adversario: string;
    resultado: string;
    pontuacao: number;
  }[];
  proximasPartidas: {
    data: Date;
    adversario: string;
    local: 'casa' | 'fora';
  }[];
  estatisticas: {
    vitorias: number;
    empates: number;
    derrotas: number;
    golsPro: number;
    golsContra: number;
    saldoGols: number;
    pontos: number;
  };
} 