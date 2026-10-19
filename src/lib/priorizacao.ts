// ============================================================
// Arcoverde Conecta — Sistema de Priorização Inteligente
// ============================================================
// Calcula pontuação de 0 a 100 com base em critérios ponderados.
// Os pesos e faixas são configuráveis e transparentes.

import {
  type PesoPriorizacao,
  type PrioridadeFaixa,
  type FaixaPrioridade,
  PESOS_PADRAO,
  FAIXAS_PADRAO,
} from '@/types';

interface CriteriosPriorizacao {
  risco_seguranca: number;   // 0–10: Risco de acidentes ou à saúde
  impacto_populacao: number; // 0–10: Quantidade de pessoas afetadas
  tempo_espera_dias: number; // Dias desde a abertura da demanda
  agravamento: number;       // 0–10: Tendência de piora sem intervenção
}

interface ResultadoPriorizacao {
  pontuacao: number;
  faixa: PrioridadeFaixa;
  detalhamento: {
    criterio: string;
    peso: number;
    valor: number;
    contribuicao: number;
    descricao: string;
  }[];
}

/**
 * Normaliza o tempo de espera para a escala 0–10.
 * Satura em 90 dias (atinge valor máximo).
 */
function normalizarTempoEspera(dias: number): number {
  const MAX_DIAS = 90;
  return Math.min(10, (dias / MAX_DIAS) * 10);
}

/**
 * Calcula a pontuação de prioridade de uma demanda.
 *
 * A fórmula é: Σ (peso_i × valor_i) × 10
 * Onde cada peso é normalizado para somar 1.0
 * e cada valor está na escala 0–10.
 */
export function calcularPrioridade(
  criterios: CriteriosPriorizacao,
  pesos: PesoPriorizacao = PESOS_PADRAO,
  faixas: FaixaPrioridade[] = FAIXAS_PADRAO
): ResultadoPriorizacao {
  const tempoNorm = normalizarTempoEspera(criterios.tempo_espera_dias);

  // Normaliza os pesos para somar 1.0
  const somaPesos =
    pesos.risco_seguranca +
    pesos.impacto_populacao +
    pesos.tempo_espera +
    pesos.agravamento;

  const pesosNorm = {
    risco_seguranca: pesos.risco_seguranca / somaPesos,
    impacto_populacao: pesos.impacto_populacao / somaPesos,
    tempo_espera: pesos.tempo_espera / somaPesos,
    agravamento: pesos.agravamento / somaPesos,
  };

  const contribs = [
    {
      criterio: 'Risco à Segurança',
      peso: pesosNorm.risco_seguranca,
      valor: criterios.risco_seguranca,
      contribuicao: pesosNorm.risco_seguranca * criterios.risco_seguranca * 10,
      descricao: descreverRisco(criterios.risco_seguranca),
    },
    {
      criterio: 'Impacto na População',
      peso: pesosNorm.impacto_populacao,
      valor: criterios.impacto_populacao,
      contribuicao: pesosNorm.impacto_populacao * criterios.impacto_populacao * 10,
      descricao: descreverImpacto(criterios.impacto_populacao),
    },
    {
      criterio: 'Tempo de Espera',
      peso: pesosNorm.tempo_espera,
      valor: tempoNorm,
      contribuicao: pesosNorm.tempo_espera * tempoNorm * 10,
      descricao: `${criterios.tempo_espera_dias} dia(s) em aberto`,
    },
    {
      criterio: 'Agravamento',
      peso: pesosNorm.agravamento,
      valor: criterios.agravamento,
      contribuicao: pesosNorm.agravamento * criterios.agravamento * 10,
      descricao: descreverAgravamento(criterios.agravamento),
    },
  ];

  const pontuacao = Math.round(
    contribs.reduce((acc, c) => acc + c.contribuicao, 0)
  );
  const pontuacaoFinal = Math.min(100, Math.max(0, pontuacao));

  const faixa = classificarFaixa(pontuacaoFinal, faixas);

  return { pontuacao: pontuacaoFinal, faixa, detalhamento: contribs };
}

function classificarFaixa(
  pontuacao: number,
  faixas: FaixaPrioridade[]
): PrioridadeFaixa {
  for (const f of faixas) {
    if (pontuacao >= f.min && pontuacao <= f.max) return f.faixa;
  }
  return 'baixa';
}

function descreverRisco(valor: number): string {
  if (valor >= 8) return 'Risco iminente de acidente ou dano grave';
  if (valor >= 5) return 'Risco moderado à segurança de pedestres/veículos';
  if (valor >= 3) return 'Risco baixo, mas requer atenção';
  return 'Sem risco imediato identificado';
}

function descreverImpacto(valor: number): string {
  if (valor >= 8) return 'Afeta grande número de moradores ou via principal';
  if (valor >= 5) return 'Afeta rua movimentada ou comunidade local';
  if (valor >= 3) return 'Afeta trecho específico ou poucos moradores';
  return 'Impacto localizado e restrito';
}

function descreverAgravamento(valor: number): string {
  if (valor >= 8) return 'Situação pode se agravar rapidamente sem intervenção';
  if (valor >= 5) return 'Tendência de piora progressiva';
  if (valor >= 3) return 'Possível deterioração a médio prazo';
  return 'Situação estável, sem tendência de agravamento';
}
