export interface Liga {
  id: string;
  nome: string;
  status: 'ativa' | 'inativa' | 'em_draft' | 'finalizada';
  times: number;
  maxTimes: number;
  orcamentoInicial: number;
  dataInicio: Date;
  dataTermino: Date;
  formacaoMinima: string;
  tamanhoMaximoElenco: number;
  tempoEscolhaDraft: number;
}

export interface Classificacao {
  posicao: number;
  time: string;
  pontos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldoGols: number;
}

export interface EstatisticasLiga {
  totalJogos: number;
  mediaGolsPorJogo: number;
  totalGols: number;
  maiorGoleada: {
    mandante: string;
    visitante: string;
    placar: string;
  };
  artilheiros: {
    nome: string;
    time: string;
    gols: number;
  }[];
  assistentes: {
    nome: string;
    time: string;
    assistencias: number;
  }[];
}

export interface ConfiguracaoDraft {
  ordem: string[];
  tempoEscolha: number;
  status: 'aguardando' | 'em_andamento' | 'finalizado';
  rodadaAtual: number;
  timeAtual: string;
  proximaEscolha: Date;
}

export interface EscolhaDraft {
  timeId: string;
  atletaId: string;
  rodada: number;
  ordem: number;
} 