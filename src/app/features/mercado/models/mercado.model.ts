export interface AtletaDisponivel {
  id: string;
  nome: string;
  posicao: 'GOL' | 'ZAG' | 'MEI' | 'ATA';
  valor: number;
  idade: number;
  nacionalidade: string;
  timeAtual: string;
  status: 'disponivel' | 'em_leilao' | 'vendido';
}

export interface Leilao {
  id: string;
  atletaId: string;
  valorInicial: number;
  valorAtual: number;
  lanceMinimo: number;
  dataInicio: Date;
  dataTermino: Date;
  status: 'em_andamento' | 'finalizado' | 'cancelado';
  ultimoLance?: {
    timeId: string;
    valor: number;
    data: Date;
  };
}

export interface Lance {
  id: string;
  leilaoId: string;
  timeId: string;
  valor: number;
  data: Date;
}

export interface PropostaTroca {
  id: string;
  timeOrigemId: string;
  timeDestinoId: string;
  atletasOrigem: string[];
  atletasDestino: string[];
  valor: number;
  status: 'pendente' | 'aceita' | 'recusada' | 'cancelada';
  dataCriacao: Date;
  dataResposta?: Date;
}

export interface ItemTroca {
  atletaId: string;
  valor: number;
}

export interface DetalheLeilao {
  leilao: Leilao;
  atleta: AtletaDisponivel;
  historicoLances: Lance[];
  tempoRestante: number;
}

export interface DetalheProposta {
  proposta: PropostaTroca;
  atletasOrigem: AtletaDisponivel[];
  atletasDestino: AtletaDisponivel[];
  valorTotal: number;
} 