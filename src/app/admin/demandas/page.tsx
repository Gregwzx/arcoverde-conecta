'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Eye, Edit3, ChevronLeft, ChevronRight,
  MapPin, Calendar, User, Building2, AlertTriangle, Clock,
  CheckCircle2, XCircle, MessageSquare, History, ArrowUpDown,
  Lightbulb, Construction, Trash2, Droplets, TreePine, X, Send,
  ChevronDown, RefreshCw, Target, ClipboardList, Paperclip, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { PageHeader, Badge, EmptyState, StatCard, StatCardSkeleton, ConfirmDialog, CopyButton } from '@/components/ui/Shared';
import { Modal } from '@/components/ui/Modal';
import {
  listarDemandas, buscarDemanda, criarDemanda, atualizarDemanda, atualizarStatus,
  listarHistorico, adicionarComentario, listarAnexos, adicionarAnexo,
  listarSetores, listarPerfis, listarBairros,
  type FiltrosDemanda, type NovaDemandaInput
} from '@/services/demandas';
import { calcularPrioridade } from '@/lib/priorizacao';
import {
  STATUS_LABELS, STATUS_COLORS, CATEGORIA_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS,
  type DemandaStatus, type DemandaCategoria, type PrioridadeFaixa, type Demanda, type Setor, type Profile, type HistoricoAlteracao, type Anexo
} from '@/types';

const CATEGORIA_ICON_MAP: Record<string, React.ElementType> = {
  iluminacao_publica: Lightbulb,
  pavimentacao: Construction,
  limpeza_urbana: Trash2,
  drenagem: Droplets,
  conservacao_espacos: TreePine,
};

const STATUS_FLOW: DemandaStatus[] = ['nova', 'em_analise', 'encaminhada', 'em_andamento', 'concluida'];

export default function DemandasPage() {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [perfis, setPerfis] = useState<Profile[]>([]);
  const [bairros, setBairros] = useState<string[]>([]);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosDemanda>({ pagina: 1, por_pagina: 15 });
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Modais
  const [modalNova, setModalNova] = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [demandaSelecionada, setDemandaSelecionada] = useState<Demanda | null>(null);
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [tabDetalhe, setTabDetalhe] = useState<'info' | 'historico' | 'prioridade' | 'anexos'>('info');
  const [novoAnexoNome, setNovoAnexoNome] = useState('');
  const [novoAnexoUrl, setNovoAnexoUrl] = useState('');
  const [novoAnexoTipo, setNovoAnexoTipo] = useState('image/jpeg');
  const [salvandoAnexo, setSalvandoAnexo] = useState(false);

  // Formulários
  const [formNova, setFormNova] = useState<NovaDemandaInput>({
    titulo: '', descricao: '', categoria: '' as DemandaCategoria,
    endereco: '', bairro: '',
    risco_seguranca: 5, impacto_populacao: 5, agravamento: 5,
  });
  const [comentario, setComentario] = useState('');
  const [comentarioInterno, setComentarioInterno] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroFormNova, setErroFormNova] = useState<string | null>(null);
  const [erroFormEditar, setErroFormEditar] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{ aberto: boolean; status: DemandaStatus; descricao: string }>({
    aberto: false, status: 'nova', descricao: ''
  });

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [result, setoresData, perfisData, bairrosData] = await Promise.all([
        listarDemandas({ ...filtros, busca }),
        listarSetores(),
        listarPerfis().catch(() => []),
        listarBairros(),
      ]);
      setDemandas(result.demandas);
      setTotal(result.total);
      setSetores(setoresData);
      setPerfis(perfisData);
      setBairros(bairrosData);
    } catch (err) {
      console.error('Erro ao carregar demandas:', err);
    } finally {
      setLoading(false);
    }
  }, [filtros, busca]);

  useEffect(() => {
    const id = setTimeout(() => { carregarDados(); }, 0);
    return () => clearTimeout(id);
  }, [carregarDados]);

  const totalPaginas = Math.ceil(total / (filtros.por_pagina || 15)) || 1;

  const abrirDetalhe = async (demanda: Demanda) => {
    setDemandaSelecionada(demanda);
    setTabDetalhe('info');
    setModalDetalhe(true);
    setNovoAnexoNome('');
    setNovoAnexoUrl('');
    try {
      const [hist, anx] = await Promise.all([
        listarHistorico(demanda.id),
        listarAnexos(demanda.id),
      ]);
      setHistorico(hist);
      setAnexos(anx);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdicionarAnexo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demandaSelecionada || !novoAnexoNome.trim() || !novoAnexoUrl.trim()) return;
    setSalvandoAnexo(true);
    try {
      const anx = await adicionarAnexo({
        demanda_id: demandaSelecionada.id,
        nome_arquivo: novoAnexoNome.trim(),
        url: novoAnexoUrl.trim(),
        tipo: novoAnexoTipo,
      });
      setAnexos((prev) => [anx, ...prev]);
      setNovoAnexoNome('');
      setNovoAnexoUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setSalvandoAnexo(false);
    }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErroFormNova(null);
    try {
      await criarDemanda(formNova);
      setModalNova(false);
      setFormNova({
        titulo: '', descricao: '', categoria: '' as DemandaCategoria, endereco: '', bairro: '',
        risco_seguranca: 5, impacto_populacao: 5, agravamento: 5
      });
      carregarDados();
    } catch (err: unknown) {
      console.error(err);
      setErroFormNova(err instanceof Error ? err.message : 'Falha ao cadastrar demanda.');
    } finally {
      setEnviando(false);
    }
  };

  const handleSalvarEdicao = async () => {
    if (!demandaSelecionada) return;
    setEnviando(true);
    setErroFormEditar(null);
    try {
      await atualizarDemanda(demandaSelecionada.id, demandaSelecionada);
      setModalEditar(false);
      carregarDados();
    } catch (err: unknown) {
      console.error(err);
      setErroFormEditar(err instanceof Error ? err.message : 'Falha ao atualizar dados da demanda.');
    } finally {
      setEnviando(false);
    }
  };

  const handleMudarStatus = async () => {
    if (!demandaSelecionada) return;
    setEnviando(true);
    try {
      const updated = await atualizarStatus(
        demandaSelecionada.id,
        confirmStatus.status,
        confirmStatus.descricao || `Status alterado para ${STATUS_LABELS[confirmStatus.status]}`
      );
      setDemandaSelecionada({ ...demandaSelecionada, status: updated.status });
      setConfirmStatus({ aberto: false, status: 'nova', descricao: '' });
      const hist = await listarHistorico(demandaSelecionada.id);
      setHistorico(hist);
      carregarDados();
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  const handleComentario = async () => {
    if (!comentario.trim() || !demandaSelecionada) return;
    try {
      await adicionarComentario(demandaSelecionada.id, comentario, comentarioInterno);
      setComentario('');
      const hist = await listarHistorico(demandaSelecionada.id);
      setHistorico(hist);
    } catch (err) {
      console.error(err);
    }
  };

  // Preview da prioridade calculada pelo algoritmo de Arcoverde
  const previewPrioridade = calcularPrioridade({
    risco_seguranca: formNova.risco_seguranca || 0,
    impacto_populacao: formNova.impacto_populacao || 0,
    tempo_espera_dias: 0,
    agravamento: formNova.agravamento || 0,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestão de Demandas e Triagem"
        description="Fila operacional organizada com algoritmo multicritério de priorização de Arcoverde"
        badge={`${total} registrada(s)`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm text-xs gap-1.5" onClick={carregarDados} title="Recarregar">
              <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>Atualizar</span>
            </button>
            <button className="btn btn-primary btn-sm text-xs gap-1.5 shadow-sm" onClick={() => setModalNova(true)}>
              <Plus size={14} />
              <span>Cadastrar Demanda</span>
            </button>
          </div>
        }
      />

      {/* Barra de Pesquisa e Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-10 text-xs"
            placeholder="Buscar por protocolo, título, bairro ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setFiltros({ ...filtros, busca, pagina: 1 })}
          />
        </div>
        <button
          className={`btn btn-secondary btn-sm text-xs gap-1.5 ${mostrarFiltros ? 'border-blue-500 text-blue-700 bg-blue-50/40' : ''}`}
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          <Filter size={14} />
          <span>Filtros Avançados</span>
          {(filtros.status || filtros.categoria || filtros.bairro || filtros.prioridade_faixa) && (
            <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
          )}
        </button>
      </div>

      {/* Painel de Filtros Avançados */}
      {mostrarFiltros && (
        <div className="card p-4 bg-slate-50/70 border-slate-200 animate-fade-in space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status da Demanda</label>
              <select
                className="input text-xs"
                value={filtros.status || ''}
                onChange={(e) => setFiltros({ ...filtros, status: (e.target.value as DemandaStatus) || undefined, pagina: 1 })}
              >
                <option value="">Todos os status</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria de Serviço</label>
              <select
                className="input text-xs"
                value={filtros.categoria || ''}
                onChange={(e) => setFiltros({ ...filtros, categoria: (e.target.value as DemandaCategoria) || undefined, pagina: 1 })}
              >
                <option value="">Todas as categorias</option>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro de Arcoverde</label>
              <select
                className="input text-xs"
                value={filtros.bairro || ''}
                onChange={(e) => setFiltros({ ...filtros, bairro: e.target.value || undefined, pagina: 1 })}
              >
                <option value="">Todos os bairros</option>
                {bairros.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Faixa de Prioridade</label>
              <select
                className="input text-xs"
                value={filtros.prioridade_faixa || ''}
                onChange={(e) => setFiltros({ ...filtros, prioridade_faixa: e.target.value || undefined, pagina: 1 })}
              >
                <option value="">Todas as prioridades</option>
                {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              className="btn btn-ghost btn-sm text-xs text-slate-500 hover:text-slate-800 gap-1"
              onClick={() => {
                setFiltros({ pagina: 1, por_pagina: 15 });
                setBusca('');
              }}
            >
              <X size={13} /> Limpar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Demandas */}
      {loading ? (
        <div className="space-y-2">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-14 animate-shimmer rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : demandas.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma demanda encontrada"
          description="Ajuste os filtros de busca ou cadastre uma nova ocorrência no sistema."
          action={
            <button className="btn btn-primary btn-sm text-xs" onClick={() => setModalNova(true)}>
              Cadastrar Nova Demanda
            </button>
          }
        />
      ) : (
        <>
          {/* Visualização Mobile: Cards Otimizados */}
          <div className="block md:hidden space-y-3">
            {demandas.map((d) => {
              const CatIcon = CATEGORIA_ICON_MAP[d.categoria] || AlertTriangle;
              return (
                <div
                  key={d.id}
                  className="card p-4 space-y-3 active:bg-slate-50/80 transition-colors border-slate-200 cursor-pointer"
                  onClick={() => abrirDetalhe(d)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {d.protocolo}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${PRIORIDADE_COLORS[d.prioridade_faixa]}`}>
                        <span className="font-mono font-bold mr-1">{d.prioridade_pontuacao}</span>
                        <span>• {PRIORIDADE_LABELS[d.prioridade_faixa]}</span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
                      {d.titulo}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span className="truncate">{d.endereco ? `${d.endereco} — ${d.bairro}` : d.bairro}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
                    <span className="flex items-center gap-1 text-[11px] text-slate-600">
                      <CatIcon size={13} className="text-blue-600 shrink-0" />
                      <span className="truncate max-w-[130px]">{CATEGORIA_LABELS[d.categoria] || d.categoria}</span>
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-secondary btn-sm text-[11px] py-1 px-2.5"
                        onClick={() => abrirDetalhe(d)}
                      >
                        <Eye size={13} /> Ver
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-[11px] py-1 px-2 text-slate-500 hover:text-slate-800"
                        onClick={() => {
                          setDemandaSelecionada(d);
                          setModalEditar(true);
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visualização Desktop: Tabela Analítica Completa */}
          <div className="hidden md:block table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Assunto da Demanda</th>
                  <th>Categoria</th>
                  <th>Bairro</th>
                  <th>Prioridade (Score)</th>
                  <th>Status</th>
                  <th>Secretaria / Órgão</th>
                  <th>Abertura</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {demandas.map((d) => {
                  const CatIcon = CATEGORIA_ICON_MAP[d.categoria] || AlertTriangle;
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/80 cursor-pointer text-xs"
                      onClick={() => abrirDetalhe(d)}
                    >
                      <td className="font-mono font-bold text-blue-700 whitespace-nowrap">
                        {d.protocolo}
                      </td>
                      <td className="max-w-[220px]">
                        <p className="font-semibold text-slate-900 truncate">{d.titulo}</p>
                        <p className="text-[11px] text-slate-400 truncate">{d.endereco}</p>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <CatIcon size={14} className="text-slate-400 shrink-0" />
                          <span>{CATEGORIA_LABELS[d.categoria] || d.categoria}</span>
                        </span>
                      </td>
                      <td className="text-slate-700 whitespace-nowrap">{d.bairro}</td>
                      <td className="whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${PRIORIDADE_COLORS[d.prioridade_faixa]}`}>
                          <span className="font-mono font-bold mr-1">{d.prioridade_pontuacao}</span>
                          <span>• {PRIORIDADE_LABELS[d.prioridade_faixa]}</span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[d.status]}`}>
                          {STATUS_LABELS[d.status]}
                        </span>
                      </td>
                      <td className="text-slate-600 whitespace-nowrap">
                        {d.setor?.nome || <span className="text-slate-400 italic">Não vinculado</span>}
                      </td>
                      <td className="text-slate-500 whitespace-nowrap tabular-nums">
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn btn-ghost btn-sm p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => abrirDetalhe(d)}
                            title="Visualizar detalhes"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            onClick={() => {
                              setDemandaSelecionada(d);
                              setModalEditar(true);
                            }}
                            title="Editar ocorrência"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <p>
              Exibindo {((filtros.pagina || 1) - 1) * (filtros.por_pagina || 15) + 1}–
              {Math.min((filtros.pagina || 1) * (filtros.por_pagina || 15), total)} de {total} solicitações
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm text-xs px-2.5"
                disabled={(filtros.pagina || 1) <= 1}
                onClick={() => setFiltros({ ...filtros, pagina: (filtros.pagina || 1) - 1 })}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span className="font-medium text-slate-800 px-1">
                Página {filtros.pagina || 1} de {totalPaginas}
              </span>
              <button
                className="btn btn-secondary btn-sm text-xs px-2.5"
                disabled={(filtros.pagina || 1) >= totalPaginas}
                onClick={() => setFiltros({ ...filtros, pagina: (filtros.pagina || 1) + 1 })}
              >
                Próxima <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL: Nova Demanda */}
      <Modal open={modalNova} onClose={() => setModalNova(false)} title="Cadastrar Nova Solicitação de Serviço" size="lg">
        <form onSubmit={handleCriar} className="space-y-5">
          {erroFormNova && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{erroFormNova}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Título da Demanda *</label>
              <input
                className="input text-xs"
                placeholder="Ex.: Reparo emergencial na galeria pluvial"
                value={formNova.titulo}
                onChange={(e) => setFormNova({ ...formNova, titulo: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria *</label>
              <select
                className="input text-xs"
                value={formNova.categoria}
                onChange={(e) => setFormNova({ ...formNova, categoria: e.target.value as DemandaCategoria })}
                required
              >
                <option value="">Selecione o tipo</option>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Secretaria / Órgão Responsável</label>
              <select
                className="input text-xs"
                value={formNova.setor_id || ''}
                onChange={(e) => setFormNova({ ...formNova, setor_id: e.target.value || undefined })}
              >
                <option value="">Encaminhamento automático</option>
                {setores.map((s) => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição Detalhada *</label>
              <textarea
                className="input text-xs"
                rows={3}
                placeholder="Detalhes técnicos, histórico de reclamações e referências no local..."
                value={formNova.descricao}
                onChange={(e) => setFormNova({ ...formNova, descricao: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Endereço Completo *</label>
              <input
                className="input text-xs"
                placeholder="Rua, número ou referência"
                value={formNova.endereco}
                onChange={(e) => setFormNova({ ...formNova, endereco: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bairro de Arcoverde *</label>
              <input
                className="input text-xs"
                placeholder="Ex.: Centro, São Cristóvão..."
                value={formNova.bairro}
                onChange={(e) => setFormNova({ ...formNova, bairro: e.target.value })}
                list="bairros-admin-list"
                required
              />
              <datalist id="bairros-admin-list">
                {bairros.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Matriz de Priorização em Tempo Real */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Target size={14} className="text-blue-600" />
                Matriz de Priorização Multicritério
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">Algoritmo Arcoverde</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                { key: 'risco_seguranca', label: 'Risco à Segurança' },
                { key: 'impacto_populacao', label: 'Impacto na População' },
                { key: 'agravamento', label: 'Risco de Agravamento' },
              ].map(({ key, label }) => {
                const val = (formNova as unknown as Record<string, number>)[key] || 0;
                return (
                  <div key={key} className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-medium text-slate-700">{label}</span>
                      <span className="font-mono font-bold text-xs text-blue-700">{val}/10</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={val}
                      onChange={(e) => setFormNova({ ...formNova, [key]: parseInt(e.target.value) })}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${PRIORIDADE_COLORS[previewPrioridade.faixa]}`}>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base">{previewPrioridade.pontuacao} pts</span>
                <span>• Prioridade {PRIORIDADE_LABELS[previewPrioridade.faixa]}</span>
              </div>
              <span className="text-[11px] opacity-80">Calculado automaticamente com base nos pesos municipais</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" className="btn btn-secondary text-xs" onClick={() => setModalNova(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-medium shadow-sm" disabled={enviando}>
              {enviando ? 'Gravando Demanda...' : 'Cadastrar Demanda'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Detalhe da Demanda */}
      <Modal open={modalDetalhe} onClose={() => setModalDetalhe(false)} title={`Protocolo ${demandaSelecionada?.protocolo || ''}`} size="lg">
        {demandaSelecionada && (
          <div className="space-y-5">
            {/* Abas com rolagem horizontal touch no mobile */}
            <div className="flex border-b border-slate-200 gap-2 sm:gap-4 text-xs overflow-x-auto no-scrollbar">
              {[
                { key: 'info', label: 'Visão Geral & Despachos', icon: Eye },
                { key: 'historico', label: 'Tramitação & Histórico', icon: History },
                { key: 'prioridade', label: 'Cálculo da Prioridade', icon: Target },
                { key: 'anexos', label: `Fotos & Anexos (${anexos.length})`, icon: Paperclip },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`flex items-center gap-1.5 pb-2.5 font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap ${
                    tabDetalhe === key
                      ? 'border-blue-600 text-blue-700 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                  onClick={() => setTabDetalhe(key as typeof tabDetalhe)}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {tabDetalhe === 'info' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[demandaSelecionada.status]}`}>
                    {STATUS_LABELS[demandaSelecionada.status]}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${PRIORIDADE_COLORS[demandaSelecionada.prioridade_faixa]}`}>
                    Score: {demandaSelecionada.prioridade_pontuacao} — {PRIORIDADE_LABELS[demandaSelecionada.prioridade_faixa]}
                  </span>
                  {demandaSelecionada.is_demo && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium">
                      Demonstração
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{demandaSelecionada.titulo}</h3>
                  <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {demandaSelecionada.descricao}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span><strong>Endereço:</strong> {demandaSelecionada.endereco}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span><strong>Bairro:</strong> {demandaSelecionada.bairro}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building2 size={14} className="text-slate-400 shrink-0" />
                    <span><strong>Secretaria:</strong> {demandaSelecionada.setor?.nome || 'Não vinculada'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span><strong>Responsável:</strong> {demandaSelecionada.responsavel?.nome || 'Não atribuído'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <span><strong>Data de Abertura:</strong> {new Date(demandaSelecionada.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Clock size={14} className="text-slate-400 shrink-0" />
                    <span><strong>Prazo Operacional:</strong> {demandaSelecionada.prazo ? new Date(demandaSelecionada.prazo).toLocaleDateString('pt-BR') : 'Conforme SLA padrão'}</span>
                  </div>
                </div>

                {/* Alterar Status com Feedback Claro */}
                <div className="border-t border-slate-200 pt-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                    Alteração de Status da Demanda
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FLOW.filter((s) => s !== demandaSelecionada.status).map((s) => (
                      <button
                        key={s}
                        className={`btn btn-sm text-xs font-medium border ${STATUS_COLORS[s]}`}
                        onClick={() => setConfirmStatus({ aberto: true, status: s, descricao: '' })}
                      >
                        Mudar para {STATUS_LABELS[s]}
                      </button>
                    ))}
                    {demandaSelecionada.status !== 'cancelada' && (
                      <button
                        className="btn btn-sm text-xs bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        onClick={() => setConfirmStatus({ aberto: true, status: 'cancelada', descricao: '' })}
                      >
                        Cancelar Demanda
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Histórico */}
            {tabDetalhe === 'historico' && (
              <div className="space-y-4 animate-fade-in text-xs">
                {historico.length === 0 ? (
                  <p className="text-slate-400 text-center py-8">Nenhum despacho ou comentário registrado até o momento.</p>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {historico.map((h) => (
                      <div
                        key={h.id}
                        className={`p-3 rounded-xl border ${h.interno ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 capitalize">{h.tipo.replace('_', ' ')}</span>
                          {h.interno && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-semibold">
                              Interno
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 ml-auto font-mono">
                            {new Date(h.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{h.descricao}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar Despacho / Comentário */}
                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                    Novo Despacho ou Anotação Operacional
                  </h4>
                  <textarea
                    className="input text-xs mb-2"
                    rows={2}
                    placeholder="Descreva as providências adotadas pela equipe ou encaminhamentos..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={comentarioInterno}
                        onChange={(e) => setComentarioInterno(e.target.checked)}
                        className="accent-blue-600"
                      />
                      <span>Anotação interna (visível somente a servidores)</span>
                    </label>
                    <button className="btn btn-primary btn-sm text-xs gap-1" onClick={handleComentario} disabled={!comentario.trim()}>
                      <Send size={13} /> Registrar Despacho
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Prioridade */}
            {tabDetalhe === 'prioridade' && (
              <div className="space-y-4 animate-fade-in text-xs">
                <div className={`p-4 rounded-xl border text-center ${PRIORIDADE_COLORS[demandaSelecionada.prioridade_faixa]}`}>
                  <p className="text-3xl font-mono font-bold">{demandaSelecionada.prioridade_pontuacao}</p>
                  <p className="text-xs font-semibold mt-0.5">Faixa de Prioridade: {PRIORIDADE_LABELS[demandaSelecionada.prioridade_faixa]}</p>
                </div>

                {(() => {
                   // eslint-disable-next-line react-hooks/purity
                   const diasAberto = Math.floor((Date.now() - new Date(demandaSelecionada.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  const resultado = calcularPrioridade({
                    risco_seguranca: demandaSelecionada.risco_seguranca,
                    impacto_populacao: demandaSelecionada.impacto_populacao,
                    tempo_espera_dias: diasAberto,
                    agravamento: demandaSelecionada.agravamento,
                  });
                  return (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Decomposição dos Fatores de Ponderação
                      </h4>
                      {resultado.detalhamento.map((d) => (
                        <div key={d.criterio} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800">{d.criterio}</span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              Peso: {(d.peso * 100).toFixed(0)}% • Nota: {d.valor.toFixed(1)}/10
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${(d.valor / 10) * 100}%` }} />
                            </div>
                            <span className="font-mono font-bold text-blue-700 w-10 text-right">+{d.contribuicao.toFixed(0)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{d.descricao}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Tab: Anexos e Fotos */}
            {tabDetalhe === 'anexos' && (
              <div className="space-y-4 animate-fade-in text-xs">
                {anexos.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 space-y-1">
                    <ImageIcon size={24} className="mx-auto text-slate-400 mb-1" />
                    <p className="font-semibold text-slate-700">Nenhum anexo ou foto vinculada</p>
                    <p className="text-[11px] text-slate-400">Adicione registros fotográficos ou comprovantes operacionais desta demanda abaixo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {anexos.map((anx) => (
                      <div key={anx.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-3 hover:border-blue-300 transition-colors">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          {anx.tipo.startsWith('image/') ? <ImageIcon size={18} /> : <Paperclip size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate" title={anx.nome_arquivo}>{anx.nome_arquivo}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(anx.created_at).toLocaleDateString('pt-BR')} {anx.tamanho ? `• ${(anx.tamanho / 1024).toFixed(0)} KB` : ''}
                          </p>
                          <a
                            href={anx.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium mt-1.5"
                          >
                            <span>Abrir arquivo</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário para Anexar Novo Documento/Foto */}
                <form onSubmit={handleAdicionarAnexo} className="border-t border-slate-200 pt-3.5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Adicionar Registro Fotográfico ou Comprovante
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">Nome/Descrição da Foto ou Anexo *</label>
                      <input
                        className="input text-xs"
                        placeholder="Ex.: Foto da lâmpada substituída em campo"
                        value={novoAnexoNome}
                        onChange={(e) => setNovoAnexoNome(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 mb-1">URL da Imagem / Arquivo Comprobatório *</label>
                      <input
                        className="input text-xs"
                        type="url"
                        placeholder="https://exemplo.com/foto_conclusao.jpg"
                        value={novoAnexoUrl}
                        onChange={(e) => setNovoAnexoUrl(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">O registro será vinculado permanentemente ao protocolo {demandaSelecionada.protocolo}.</span>
                    <button type="submit" className="btn btn-primary btn-sm text-xs gap-1.5" disabled={salvandoAnexo || !novoAnexoNome.trim() || !novoAnexoUrl.trim()}>
                      <Paperclip size={13} /> {salvandoAnexo ? 'Salvando...' : 'Vincular à Demanda'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: Editar Demanda */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar Dados da Ocorrência" size="lg">
        {demandaSelecionada && (
          <div className="space-y-4 text-xs">
            {erroFormEditar && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span>{erroFormEditar}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Título</label>
                <input
                  className="input text-xs"
                  value={demandaSelecionada.titulo}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, titulo: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                <select
                  className="input text-xs"
                  value={demandaSelecionada.categoria}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, categoria: e.target.value as DemandaCategoria })}
                >
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Secretaria / Órgão</label>
                <select
                  className="input text-xs"
                  value={demandaSelecionada.setor_id || ''}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, setor_id: e.target.value || null })}
                >
                  <option value="">Nenhum órgão vinculado</option>
                  {setores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Servidor Responsável</label>
                <select
                  className="input text-xs"
                  value={demandaSelecionada.responsavel_id || ''}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, responsavel_id: e.target.value || null })}
                >
                  <option value="">Não atribuído</option>
                  {perfis.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prazo de Resolução</label>
                <input
                  type="date"
                  className="input text-xs"
                  value={demandaSelecionada.prazo || ''}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, prazo: e.target.value || null })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Endereço</label>
                <input
                  className="input text-xs"
                  value={demandaSelecionada.endereco}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, endereco: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bairro</label>
                <input
                  className="input text-xs"
                  value={demandaSelecionada.bairro}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, bairro: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  className="input text-xs"
                  rows={3}
                  value={demandaSelecionada.descricao}
                  onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, descricao: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button className="btn btn-secondary text-xs" onClick={() => setModalEditar(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary text-xs font-medium" onClick={handleSalvarEdicao} disabled={enviando}>
                {enviando ? 'Atualizando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmar Mudança de Status */}
      <ConfirmDialog
        open={confirmStatus.aberto}
        title="Confirmar Alteração de Status"
        message={`Confirma a transição da demanda para o status "${STATUS_LABELS[confirmStatus.status]}"? Esta alteração será registrada no histórico oficial da ouvidoria.`}
        confirmLabel="Confirmar Alteração"
        onConfirm={handleMudarStatus}
        onCancel={() => setConfirmStatus({ ...confirmStatus, aberto: false })}
        loading={enviando}
      />
    </div>
  );
}
