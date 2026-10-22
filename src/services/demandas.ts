// ============================================================
// Arcoverde Conecta — Camada de Serviços e Integração Supabase
// ============================================================
// Conecta-se diretamente ao banco de dados PostgreSQL do Supabase.
// Garante persistência real, segurança de dados do cidadão e integridade.

import { createClient } from '@/lib/supabase/client';
import type { Demanda, DemandaStatus, DemandaCategoria, Setor, Profile, HistoricoAlteracao, Anexo } from '@/types';
import { calcularPrioridade } from '@/lib/priorizacao';
import {
  MOCK_DEMANDAS,
  MOCK_SETORES,
  MOCK_PROFILES,
  MOCK_CONFIGURACOES,
  type ConfiguracoesPrefeitura,
} from './mockData';

const supabase = createClient();

// Cache em memória — populado do Supabase na primeira leitura
let configuracoesCache: ConfiguracoesPrefeitura | null = null;

// --- Consultas de Demandas (Área Administrativa) ---

export interface FiltrosDemanda {
  status?: DemandaStatus;
  categoria?: DemandaCategoria;
  bairro?: string;
  setor_id?: string;
  prioridade_faixa?: string;
  busca?: string;
  pagina?: number;
  por_pagina?: number;
  data_inicio?: string;
  data_fim?: string;
}

export async function listarDemandas(filtros: FiltrosDemanda = {}) {
  const demoAuth = typeof document !== 'undefined' && document.cookie.includes('ac_demo_auth=true');
  if (demoAuth) {
    return { demandas: MOCK_DEMANDAS as Demanda[], total: MOCK_DEMANDAS.length };
  }
  // original code below
  const { pagina = 1, por_pagina = 20 } = filtros;
  const offset = (pagina - 1) * por_pagina;

  let query = supabase
    .from('demandas')
    .select('*, setor:setores(id, nome), responsavel:profiles(id, nome)', { count: 'exact' })
    .order('prioridade_pontuacao', { ascending: false })
    .range(offset, offset + por_pagina - 1);

  if (filtros.status) query = query.eq('status', filtros.status);
  if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
  if (filtros.bairro) query = query.eq('bairro', filtros.bairro);
  if (filtros.setor_id) query = query.eq('setor_id', filtros.setor_id);
  if (filtros.prioridade_faixa) query = query.eq('prioridade_faixa', filtros.prioridade_faixa);
  if (filtros.busca) {
    const q = filtros.busca.trim();
    query = query.or(`titulo.ilike.%${q}%,protocolo.ilike.%${q}%,endereco.ilike.%${q}%,bairro.ilike.%${q}%`);
  }
  if (filtros.data_inicio) {
    query = query.gte('created_at', filtros.data_inicio);
  }
  if (filtros.data_fim) {
    query = query.lte('created_at', `${filtros.data_fim}T23:59:59`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error('Erro ao listar demandas no Supabase:', error);
    throw error;
  }

  return {
    demandas: (data || []) as Demanda[],
    total: count ?? (data?.length || 0),
  };
}

export async function buscarDemanda(id: string): Promise<Demanda> {
  const { data, error } = await supabase
    .from('demandas')
    .select('*, setor:setores(id, nome), responsavel:profiles(id, nome)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Erro ao buscar demanda no Supabase:', error);
    throw error || new Error('Demanda não encontrada.');
  }

  return data as Demanda;
}

// --- Consulta Pública por Protocolo (Proteção Total de Dados Pessoais) ---

export interface DemandaPublicaDetalhe {
  id: string;
  protocolo: string;
  titulo: string;
  descricao: string;
  categoria: DemandaCategoria;
  status: DemandaStatus;
  prioridade_faixa: string;
  endereco: string;
  bairro: string;
  created_at: string;
  updated_at: string;
  historico?: {
    id: string;
    tipo: string;
    descricao: string;
    valor_novo: string | null;
    created_at: string;
  }[];
  anexos?: {
    id: string;
    nome_arquivo: string;
    url: string;
    tipo: string;
    created_at: string;
  }[];
}

export async function buscarPorProtocolo(protocolo: string): Promise<DemandaPublicaDetalhe | null> {
  const protLimpo = protocolo.toUpperCase().trim();
  if (!protLimpo) return null;

  // Busca apenas dados não-confidenciais
  const { data, error } = await supabase
    .from('demandas')
    .select('id, protocolo, titulo, descricao, categoria, status, prioridade_faixa, endereco, bairro, created_at, updated_at')
    .eq('protocolo', protLimpo)
    .eq('publica', true)
    .single();

  if (error || !data) return null;

  // Busca histórico público da demanda
  const { data: histData } = await supabase
    .from('historico_alteracoes')
    .select('id, tipo, descricao, valor_novo, created_at')
    .eq('demanda_id', data.id)
    .eq('interno', false)
    .order('created_at', { ascending: true });

  // Busca anexos e fotos públicas da ocorrência
  const { data: anxData } = await supabase
    .from('anexos')
    .select('id, nome_arquivo, url, tipo, created_at')
    .eq('demanda_id', data.id);

  return {
    ...data,
    historico: histData || [],
    anexos: anxData || [],
  } as DemandaPublicaDetalhe;
}

// --- Criação de Demandas (Portal do Cidadão & Triagem) ---

export interface NovaDemandaInput {
  titulo: string;
  descricao: string;
  categoria: DemandaCategoria;
  endereco: string;
  bairro: string;
  latitude?: number;
  longitude?: number;
  nome_solicitante?: string;
  telefone_solicitante?: string;
  email_solicitante?: string;
  setor_id?: string;
  responsavel_id?: string;
  prazo?: string;
  risco_seguranca?: number;
  impacto_populacao?: number;
  agravamento?: number;
}

export async function criarDemanda(input: NovaDemandaInput): Promise<Demanda> {
  // Gerar protocolo via função SQL no servidor (evita colisão em concorrência)
  let protocolo: string | null = null;
  const { data: protocoloRpc, error: rpcError } = await supabase.rpc('gerar_protocolo');
  if (!rpcError && protocoloRpc) {
    protocolo = protocoloRpc;
  } else {
    if (rpcError) {
      console.warn('RPC gerar_protocolo indisponível no Supabase, usando cálculo sequencial:', rpcError.message);
    }
    const ano = new Date().getFullYear();
    const { count } = await supabase
      .from('demandas')
      .select('id', { count: 'exact', head: true });
    const seq = String((count || 0) + 1).padStart(5, '0');
    protocolo = `ARC-${ano}-${seq}`;
  }

  // Cálculo da pontuação de prioridade transparente
  const config = await obterConfiguracoes();
  const resultadoPrioridade = calcularPrioridade(
    {
      risco_seguranca: input.risco_seguranca || 0,
      impacto_populacao: input.impacto_populacao || 0,
      tempo_espera_dias: 0,
      agravamento: input.agravamento || 0,
    },
    config.pesos_priorizacao,
    config.faixas_prioridade
  );

  const novaDemanda = {
    protocolo,
    titulo: input.titulo.trim(),
    descricao: input.descricao.trim(),
    categoria: input.categoria,
    status: 'nova' as DemandaStatus,
    prioridade_pontuacao: resultadoPrioridade.pontuacao,
    prioridade_faixa: resultadoPrioridade.faixa,
    endereco: input.endereco.trim(),
    bairro: input.bairro.trim(),
    latitude: input.latitude || -8.4182,
    longitude: input.longitude || -37.0533,
    nome_solicitante: input.nome_solicitante?.trim() || null,
    telefone_solicitante: input.telefone_solicitante?.trim() || null,
    email_solicitante: input.email_solicitante?.trim() || null,
    setor_id: input.setor_id || null,
    responsavel_id: input.responsavel_id || null,
    prazo: input.prazo || null,
    risco_seguranca: input.risco_seguranca || 0,
    impacto_populacao: input.impacto_populacao || 0,
    agravamento: input.agravamento || 0,
    is_demo: false,
    publica: true,
  };

  const { data, error } = await supabase
    .from('demandas')
    .insert(novaDemanda)
    .select()
    .single();

  if (error || !data) {
    console.error('Falha ao persistir demanda no Supabase:', error);
    throw new Error(error?.message || 'Falha ao salvar demanda no banco de dados.');
  }

  // Registra movimentação inicial no histórico
  try {
    await supabase.from('historico_alteracoes').insert({
      demanda_id: data.id,
      tipo: 'status',
      descricao: 'Demanda protocolada no sistema de zeladoria urbana.',
      valor_novo: 'nova',
      interno: false,
    });
  } catch (histErr) {
    console.warn('Aviso ao registrar histórico inicial:', histErr);
  }

  return data as Demanda;
}

// --- Atualizações Administrativas ---

export async function atualizarDemanda(id: string, updates: Partial<Demanda>): Promise<Demanda> {
  // Recalcular prioridade se critérios tiverem sido alterados
  if (
    updates.risco_seguranca !== undefined ||
    updates.impacto_populacao !== undefined ||
    updates.agravamento !== undefined
  ) {
    const current = await buscarDemanda(id);
    const diasEmAberto = Math.max(
      0,
      Math.floor((Date.now() - new Date(current.created_at).getTime()) / (1000 * 60 * 60 * 24))
    );

    const config = await obterConfiguracoes();
    const recalculado = calcularPrioridade(
      {
        risco_seguranca: updates.risco_seguranca ?? current.risco_seguranca,
        impacto_populacao: updates.impacto_populacao ?? current.impacto_populacao,
        tempo_espera_dias: diasEmAberto,
        agravamento: updates.agravamento ?? current.agravamento,
      },
      config.pesos_priorizacao,
      config.faixas_prioridade
    );

    updates.prioridade_pontuacao = recalculado.pontuacao;
    updates.prioridade_faixa = recalculado.faixa;
  }

  const { data, error } = await supabase
    .from('demandas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Falha ao atualizar demanda no Supabase:', error);
    throw error || new Error('Não foi possível atualizar a demanda.');
  }

  return data as Demanda;
}

export async function atualizarStatus(
  id: string,
  novoStatus: DemandaStatus,
  justificativa: string
): Promise<Demanda> {
  const current = await buscarDemanda(id);
  const statusAnterior = current.status;

  const { data, error } = await supabase
    .from('demandas')
    .update({ status: novoStatus })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Falha ao atualizar status no Supabase:', error);
    throw error || new Error('Não foi possível alterar o status da demanda.');
  }

  // Registrar no histórico de movimentações com justificativa
  await supabase.from('historico_alteracoes').insert({
    demanda_id: id,
    tipo: 'status',
    descricao: justificativa || `Status alterado de ${statusAnterior} para ${novoStatus}.`,
    valor_anterior: statusAnterior,
    valor_novo: novoStatus,
    interno: false,
  });

  return data as Demanda;
}

// --- Histórico e Despachos Internos ---

export async function listarHistorico(demandaId: string): Promise<HistoricoAlteracao[]> {
  const { data, error } = await supabase
    .from('historico_alteracoes')
    .select('*, usuario:profiles(id, nome)')
    .eq('demanda_id', demandaId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao listar histórico no Supabase:', error);
    throw error;
  }

  return (data || []) as HistoricoAlteracao[];
}

export async function adicionarComentario(
  demandaId: string,
  descricao: string,
  interno: boolean = false
) {
  const { error } = await supabase.from('historico_alteracoes').insert({
    demanda_id: demandaId,
    tipo: 'comentario',
    descricao: descricao.trim(),
    interno,
  });

  if (error) {
    console.error('Erro ao adicionar comentário no Supabase:', error);
    throw error;
  }
}

// --- Anexos e Registros Fotográficos Comprobatórios ---

export async function listarAnexos(demandaId: string): Promise<Anexo[]> {
  try {
    const { data, error } = await supabase
      .from('anexos')
      .select('*')
      .eq('demanda_id', demandaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Aviso ao consultar anexos no Supabase:', error.message);
      return [];
    }

    return (data || []) as Anexo[];
  } catch (err) {
    console.warn('Erro ao listar anexos:', err);
    return [];
  }
}

export async function adicionarAnexo(input: {
  demanda_id: string;
  nome_arquivo: string;
  url: string;
  tipo: string;
  tamanho?: number;
}): Promise<Anexo> {
  const { data, error } = await supabase
    .from('anexos')
    .insert({
      demanda_id: input.demanda_id,
      nome_arquivo: input.nome_arquivo.trim(),
      url: input.url.trim(),
      tipo: input.tipo,
      tamanho: input.tamanho || 0,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao salvar anexo no Supabase:', error);
    throw error || new Error('Não foi possível salvar o anexo.');
  }

  return data as Anexo;
}

// --- Estatísticas Oficiais do Supabase ---

export async function obterEstatisticas() {
  const { data, error } = await supabase
    .from('demandas')
    .select('status, categoria, bairro, created_at, prioridade_faixa');

  if (error) {
    console.error('Erro ao consultar estatísticas no Supabase:', error);
    throw error;
  }

  const demandas = data || [];
  const total = demandas.length;
  const novas = demandas.filter((d) => d.status === 'nova').length;
  const em_andamento = demandas.filter(
    (d) => d.status === 'em_andamento' || d.status === 'em_analise' || d.status === 'encaminhada'
  ).length;
  const concluidas = demandas.filter((d) => d.status === 'concluida').length;
  const criticas = demandas.filter((d) => d.prioridade_faixa === 'critica').length;

  // Agrupamento por Categoria
  const catMap = new Map<string, number>();
  demandas.forEach((d) => catMap.set(d.categoria, (catMap.get(d.categoria) || 0) + 1));
  const por_categoria = Array.from(catMap.entries()).map(([categoria, count]) => ({
    categoria,
    count,
  }));

  // Agrupamento por Status
  const statusMap = new Map<string, number>();
  demandas.forEach((d) => statusMap.set(d.status, (statusMap.get(d.status) || 0) + 1));
  const por_status = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  // Agrupamento por Bairro
  const bairroMap = new Map<string, number>();
  demandas.forEach((d) => bairroMap.set(d.bairro, (bairroMap.get(d.bairro) || 0) + 1));
  const por_bairro = Array.from(bairroMap.entries())
    .map(([bairro, count]) => ({ bairro, count }))
    .sort((a, b) => b.count - a.count);

  // Tendência dos últimos 6 meses
  const meses: { mes: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mesLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const mNum = d.getMonth();
    const yNum = d.getFullYear();
    const count = demandas.filter((dem) => {
      const cd = new Date(dem.created_at);
      return cd.getMonth() === mNum && cd.getFullYear() === yNum;
    }).length;
    meses.push({ mes: mesLabel, count });
  }

  return {
    total,
    novas,
    em_andamento,
    concluidas,
    criticas,
    por_categoria,
    por_status,
    por_bairro,
    tendencia_mensal: meses,
  };
}

// --- Setores / Secretarias (CRUD) ---

export async function listarSetores(): Promise<Setor[]> {
  const demoAuth = typeof document !== 'undefined' && document.cookie.includes('ac_demo_auth=true');
  if (demoAuth) {
    return MOCK_SETORES as Setor[];
  }
  const { data, error } = await supabase
    .from('setores')
    .select('*')
    .order('nome');

  if (error) {
    console.error('Erro ao listar setores no Supabase:', error);
    throw error;
  }

  return (data || []) as Setor[];
}

export async function criarSetor(nome: string, descricao?: string, responsavel_id?: string | null): Promise<Setor> {
  const { data, error } = await supabase
    .from('setores')
    .insert({
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      responsavel_id: responsavel_id || null,
      ativo: true,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao criar setor no Supabase:', error);
    throw error || new Error('Falha ao cadastrar setor.');
  }

  return data as Setor;
}

export async function atualizarSetor(
  id: string,
  updates: { nome?: string; descricao?: string; responsavel_id?: string | null; ativo?: boolean }
): Promise<Setor> {
  const { data, error } = await supabase
    .from('setores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao atualizar setor no Supabase:', error);
    throw error || new Error('Falha ao atualizar setor.');
  }

  return data as Setor;
}

export async function excluirDemanda(id: string): Promise<void> {
  const { error } = await supabase.from('demandas').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir demanda no Supabase:', error);
    throw error;
  }
}

export async function excluirSetor(id: string): Promise<void> {
  const { error } = await supabase.from('setores').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir setor no Supabase:', error);
    throw error;
  }
}

// --- Usuários e Perfis Institucionais (CRUD) ---

export async function listarPerfis(): Promise<Profile[]> {
  const demoAuth = typeof document !== 'undefined' && document.cookie.includes('ac_demo_auth=true');
  if (demoAuth) {
    return MOCK_PROFILES as Profile[];
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*, setor:setores!profiles_setor_id_fkey(id, nome)')
    .order('nome');

  if (error) {
    console.error('Erro ao listar perfis no Supabase:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
    throw error;
  }

  return (data || []) as Profile[];
}

export async function criarPerfil(input: {
  nome: string;
  email: string;
  role: 'admin' | 'gestor' | 'servidor';
  setor_id?: string | null;
}): Promise<Profile> {
  // Chama API Route segura que usa service_role para criar no Supabase Auth
  const response = await fetch('/api/usuarios/criar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nome: input.nome.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      setor_id: input.setor_id || null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Não foi possível cadastrar o usuário.');
  }

  return data as Profile;
}

export async function atualizarPerfil(
  id: string,
  updates: Partial<Pick<Profile, 'nome' | 'email' | 'role' | 'setor_id' | 'ativo'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao atualizar perfil no Supabase:', error);
    throw error || new Error('Não foi possível atualizar o perfil.');
  }

  return data as Profile;
}

export async function excluirPerfil(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir perfil no Supabase:', error);
    throw error;
  }
}

// --- Demandas Públicas e Bairros Disponíveis ---

export async function listarDemandasPublicas(filtros: {
  categoria?: string;
  bairro?: string;
  status?: string;
} = {}) {
  let query = supabase
    .from('demandas')
    .select('id, protocolo, titulo, descricao, categoria, status, prioridade_faixa, endereco, bairro, latitude, longitude, created_at, updated_at')
    .eq('publica', true)
    .order('created_at', { ascending: false });

  if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
  if (filtros.bairro) query = query.eq('bairro', filtros.bairro);
  if (filtros.status) query = query.eq('status', filtros.status);

  const { data, error } = await query;
  if (error) {
    console.error('Erro ao listar demandas públicas no Supabase:', error);
    throw error;
  }

  return data || [];
}

export async function listarBairros(): Promise<string[]> {
  const { data, error } = await supabase
    .from('demandas')
    .select('bairro');

  if (error || !data || data.length === 0) {
    // Lista canônica de bairros de Arcoverde caso o banco ainda não tenha registros
    return [
      'Centro',
      'São Cristóvão',
      'Boa Vista',
      'São Geraldo',
      'Cohab 1',
      'Cohab 2',
      'Tamboril',
      'Sucupira',
      'Pôr do Sol',
      'Coronel Siqueira Campos',
    ].sort();
  }

  const unique = [...new Set(data.map((d) => d.bairro).filter(Boolean))].sort();
  return unique;
}

// --- Configurações da Prefeitura & Priorização ---

export async function obterConfiguracoes(): Promise<ConfiguracoesPrefeitura> {
  // Retornar cache em memória se disponível
  if (configuracoesCache) return configuracoesCache;

  // Tentar localStorage no navegador
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem('ac_config');
      if (cached) {
        configuracoesCache = JSON.parse(cached);
      }
    } catch {
      // Ignorar erro
    }
  }

  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('dados')
      .eq('id', 'default')
      .single();

    if (!error && data?.dados) {
      configuracoesCache = data.dados as ConfiguracoesPrefeitura;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ac_config', JSON.stringify(configuracoesCache));
        } catch {}
      }
      return configuracoesCache;
    }
  } catch {
    // Banco pode não ter a tabela ainda — usar padrão ou cache local
  }

  if (!configuracoesCache) {
    configuracoesCache = { ...MOCK_CONFIGURACOES };
  }
  return configuracoesCache;
}

export async function salvarConfiguracoes(
  novas: Partial<ConfiguracoesPrefeitura>
): Promise<ConfiguracoesPrefeitura> {
  const atuais = await obterConfiguracoes();
  const merged: ConfiguracoesPrefeitura = { ...atuais, ...novas };

  // Atualizar cache em memória e localStorage imediatamente
  configuracoesCache = merged;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ac_config', JSON.stringify(merged));
    } catch {
      // Ignorar erro de localStorage
    }
  }

  try {
    const { error } = await supabase
      .from('configuracoes')
      .upsert({ id: 'default', dados: merged }, { onConflict: 'id' });

    if (error) {
      console.warn('Aviso ao sincronizar configurações no Supabase:', error.message);
    }
  } catch (err) {
    console.warn('Aviso ao persistir configurações no Supabase:', err);
  }

  return configuracoesCache;
}

// --- Povoar Dados de Demonstração DIRETAMENTE no Supabase (Para Avaliação) ---

export async function semearDadosDemonstracao(): Promise<{ inseridos: number }> {
  // 1. Inserir Setores
  for (const s of MOCK_SETORES) {
    await supabase.from('setores').upsert({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      ativo: s.ativo,
    });
  }

  // 2. Inserir Demandas demonstrativas no Supabase
  let inseridos = 0;
  for (const d of MOCK_DEMANDAS) {
    const { error } = await supabase.from('demandas').upsert({
      id: d.id,
      protocolo: d.protocolo,
      titulo: d.titulo,
      descricao: d.descricao,
      categoria: d.categoria,
      status: d.status,
      prioridade_pontuacao: d.prioridade_pontuacao,
      prioridade_faixa: d.prioridade_faixa,
      endereco: d.endereco,
      bairro: d.bairro,
      latitude: d.latitude,
      longitude: d.longitude,
      setor_id: d.setor_id,
      risco_seguranca: d.risco_seguranca,
      impacto_populacao: d.impacto_populacao,
      agravamento: d.agravamento,
      is_demo: true,
      publica: true,
      created_at: d.created_at,
    });
    if (!error) inseridos++;
  }

  return { inseridos };
}
