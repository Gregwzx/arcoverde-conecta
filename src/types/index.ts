// ============================================================
// Arcoverde Conecta — Tipos e Interfaces
// ============================================================

// --- Enums ---

export type DemandaStatus =
  | 'nova'
  | 'em_analise'
  | 'encaminhada'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada';

export type DemandaCategoria =
  | 'iluminacao_publica'
  | 'pavimentacao'
  | 'limpeza_urbana'
  | 'drenagem'
  | 'conservacao_espacos';

export type PrioridadeFaixa = 'critica' | 'alta' | 'media' | 'baixa';

export type UserRole = 'admin' | 'gestor' | 'servidor';

// --- Labels para exibição ---

export const STATUS_LABELS: Record<DemandaStatus, string> = {
  nova: 'Nova',
  em_analise: 'Em Análise',
  encaminhada: 'Encaminhada',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

export const STATUS_COLORS: Record<DemandaStatus, string> = {
  nova: 'bg-blue-100 text-blue-800',
  em_analise: 'bg-yellow-100 text-yellow-800',
  encaminhada: 'bg-purple-100 text-purple-800',
  em_andamento: 'bg-orange-100 text-orange-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
};

export const CATEGORIA_LABELS: Record<DemandaCategoria, string> = {
  iluminacao_publica: 'Iluminação Pública',
  pavimentacao: 'Pavimentação',
  limpeza_urbana: 'Limpeza Urbana',
  drenagem: 'Drenagem',
  conservacao_espacos: 'Conservação de Espaços Públicos',
};

export const CATEGORIA_ICONS: Record<DemandaCategoria, string> = {
  iluminacao_publica: 'Lightbulb',
  pavimentacao: 'Construction',
  limpeza_urbana: 'Trash2',
  drenagem: 'Droplets',
  conservacao_espacos: 'TreePine',
};

export const PRIORIDADE_LABELS: Record<PrioridadeFaixa, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const PRIORIDADE_COLORS: Record<PrioridadeFaixa, string> = {
  critica: 'bg-red-100 text-red-800 border-red-300',
  alta: 'bg-orange-100 text-orange-800 border-orange-300',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  baixa: 'bg-green-100 text-green-800 border-green-300',
};

// --- Interfaces de Banco ---

export interface Profile {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
  setor_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Setor {
  id: string;
  nome: string;
  descricao: string | null;
  responsavel_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Demanda {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: DemandaCategoria;
  status: DemandaStatus;
  prioridade_pontuacao: number;
  prioridade_faixa: PrioridadeFaixa;
  endereco: string;
  bairro: string;
  latitude: number | null;
  longitude: number | null;
  nome_solicitante: string | null;
  telefone_solicitante: string | null;
  email_solicitante: string | null;
  setor_id: string | null;
  responsavel_id: string | null;
  prazo: string | null;
  // Critérios de priorização
  risco_seguranca: number; // 0-10
  impacto_populacao: number; // 0-10
  agravamento: number; // 0-10
  is_demo: boolean;
  publica: boolean;
  created_at: string;
  updated_at: string;
  // Joins opcionais
  setor?: Setor;
  responsavel?: Profile;
}

export interface HistoricoAlteracao {
  id: string;
  demanda_id: string;
  usuario_id: string | null;
  tipo: 'status' | 'comentario' | 'atribuicao' | 'edicao' | 'prioridade';
  descricao: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  interno: boolean;
  created_at: string;
  usuario?: Profile;
}

export interface Anexo {
  id: string;
  demanda_id: string;
  nome_arquivo: string;
  url: string;
  tipo: string;
  tamanho: number;
  usuario_id: string | null;
  created_at: string;
}

// --- Critérios de Priorização ---

export interface PesoPriorizacao {
  risco_seguranca: number;
  impacto_populacao: number;
  tempo_espera: number;
  agravamento: number;
}

export const PESOS_PADRAO: PesoPriorizacao = {
  risco_seguranca: 0.35,
  impacto_populacao: 0.25,
  tempo_espera: 0.20,
  agravamento: 0.20,
};

export interface FaixaPrioridade {
  faixa: PrioridadeFaixa;
  min: number;
  max: number;
}

export const FAIXAS_PADRAO: FaixaPrioridade[] = [
  { faixa: 'critica', min: 76, max: 100 },
  { faixa: 'alta', min: 51, max: 75 },
  { faixa: 'media', min: 26, max: 50 },
  { faixa: 'baixa', min: 0, max: 25 },
];

// --- Dashboard Stats ---

export interface DashboardStats {
  total: number;
  novas: number;
  em_andamento: number;
  concluidas: number;
  por_categoria: { categoria: string; count: number }[];
  por_status: { status: string; count: number }[];
  por_bairro: { bairro: string; count: number }[];
  tendencia_mensal: { mes: string; count: number }[];
}
