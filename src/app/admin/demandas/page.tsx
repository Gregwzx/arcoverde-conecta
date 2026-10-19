'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Filter, Eye, Edit3, ChevronLeft, ChevronRight,
  MapPin, Calendar, User, Building2, AlertTriangle, Clock,
  CheckCircle2, XCircle, MessageSquare, History, ArrowUpDown,
  Lightbulb, Construction, Trash2, Droplets, TreePine, X, Send,
  ChevronDown, RefreshCw, Target, ClipboardList
} from 'lucide-react';
import { PageHeader, Badge, EmptyState, StatCard, StatCardSkeleton, ConfirmDialog } from '@/components/ui/Shared';
import { Modal } from '@/components/ui/Modal';
import {
  listarDemandas, buscarDemanda, criarDemanda, atualizarDemanda, atualizarStatus,
  listarHistorico, adicionarComentario, listarSetores, listarPerfis, listarBairros,
  type FiltrosDemanda, type NovaDemandaInput
} from '@/services/demandas';
import { calcularPrioridade } from '@/lib/priorizacao';
import {
  STATUS_LABELS, STATUS_COLORS, CATEGORIA_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS,
  type DemandaStatus, type DemandaCategoria, type PrioridadeFaixa, type Demanda, type Setor, type Profile, type HistoricoAlteracao
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
  const [tabDetalhe, setTabDetalhe] = useState<'info' | 'historico' | 'prioridade'>('info');

  // Formulários
  const [formNova, setFormNova] = useState<NovaDemandaInput>({
    titulo: '', descricao: '', categoria: '' as DemandaCategoria,
    endereco: '', bairro: '',
    risco_seguranca: 0, impacto_populacao: 0, agravamento: 0,
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
        listarPerfis(),
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

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const totalPaginas = Math.ceil(total / (filtros.por_pagina || 15));

  const abrirDetalhe = async (demanda: Demanda) => {
    setDemandaSelecionada(demanda);
    setTabDetalhe('info');
    setModalDetalhe(true);
    try {
      const hist = await listarHistorico(demanda.id);
      setHistorico(hist);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErroFormNova(null);
    try {
      await criarDemanda(formNova);
      setModalNova(false);
      setFormNova({ titulo: '', descricao: '', categoria: '' as DemandaCategoria, endereco: '', bairro: '', risco_seguranca: 0, impacto_populacao: 0, agravamento: 0 });
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

  // Preview prioridade
  const previewPrioridade = calcularPrioridade({
    risco_seguranca: formNova.risco_seguranca || 0,
    impacto_populacao: formNova.impacto_populacao || 0,
    tempo_espera_dias: 0,
    agravamento: formNova.agravamento || 0,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestão de Demandas"
        description={`${total} demandas registradas`}
        actions={
          <button className="btn btn-primary" onClick={() => setModalNova(true)}>
            <Plus size={16} /> Nova Demanda
          </button>
        }
      />

      {/* Search + Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input pl-10"
            placeholder="Buscar por título, protocolo ou endereço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setFiltros({ ...filtros, busca, pagina: 1 })}
          />
        </div>
        <button className="btn btn-secondary" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
          <Filter size={16} /> Filtros
          {(filtros.status || filtros.categoria || filtros.bairro) && (
            <span className="bg-primary text-white text-xs px-1.5 rounded-full">!</span>
          )}
        </button>
        <button className="btn btn-ghost" onClick={carregarDados}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Expanded Filters */}
      {mostrarFiltros && (
        <div className="card animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Status</label>
              <select className="input text-sm" value={filtros.status || ''} onChange={(e) => setFiltros({ ...filtros, status: e.target.value as DemandaStatus || undefined, pagina: 1 })}>
                <option value="">Todos</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Categoria</label>
              <select className="input text-sm" value={filtros.categoria || ''} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value as DemandaCategoria || undefined, pagina: 1 })}>
                <option value="">Todas</option>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Bairro</label>
              <select className="input text-sm" value={filtros.bairro || ''} onChange={(e) => setFiltros({ ...filtros, bairro: e.target.value || undefined, pagina: 1 })}>
                <option value="">Todos</option>
                {bairros.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Prioridade</label>
              <select className="input text-sm" value={filtros.prioridade_faixa || ''} onChange={(e) => setFiltros({ ...filtros, prioridade_faixa: e.target.value || undefined, pagina: 1 })}>
                <option value="">Todas</option>
                {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button className="btn btn-ghost text-sm" onClick={() => { setFiltros({ pagina: 1, por_pagina: 15 }); setBusca(''); }}>
              <X size={14} /> Limpar filtros
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-14 animate-shimmer rounded-lg" />)}
        </div>
      ) : demandas.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma demanda encontrada" description="Ajuste os filtros ou crie uma nova demanda." />
      ) : (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Título</th>
                  <th>Categoria</th>
                  <th>Bairro</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Setor</th>
                  <th>Data</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {demandas.map((d) => {
                  const CatIcon = CATEGORIA_ICON_MAP[d.categoria] || AlertTriangle;
                  return (
                    <tr key={d.id} className="cursor-pointer" onClick={() => abrirDetalhe(d)}>
                      <td className="font-mono text-xs font-medium text-primary whitespace-nowrap">{d.protocolo}</td>
                      <td className="max-w-[200px] truncate font-medium">{d.titulo}</td>
                      <td>
                        <span className="flex items-center gap-1.5 text-xs">
                          <CatIcon size={14} className="text-muted" />
                          {CATEGORIA_LABELS[d.categoria]}
                        </span>
                      </td>
                      <td className="text-xs">{d.bairro}</td>
                      <td>
                        <Badge className={`${PRIORIDADE_COLORS[d.prioridade_faixa]} border`}>
                          {d.prioridade_pontuacao} — {PRIORIDADE_LABELS[d.prioridade_faixa]}
                        </Badge>
                      </td>
                      <td>
                        <Badge className={STATUS_COLORS[d.status]}>
                          {STATUS_LABELS[d.status]}
                        </Badge>
                      </td>
                      <td className="text-xs text-muted">{d.setor?.nome || '—'}</td>
                      <td className="text-xs text-muted whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); abrirDetalhe(d); }}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={(e) => {
                          e.stopPropagation();
                          setDemandaSelecionada(d);
                          setModalEditar(true);
                        }}>
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Mostrando {((filtros.pagina || 1) - 1) * (filtros.por_pagina || 15) + 1}–
              {Math.min((filtros.pagina || 1) * (filtros.por_pagina || 15), total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={(filtros.pagina || 1) <= 1}
                onClick={() => setFiltros({ ...filtros, pagina: (filtros.pagina || 1) - 1 })}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-medium">{filtros.pagina || 1} / {totalPaginas}</span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={(filtros.pagina || 1) >= totalPaginas}
                onClick={() => setFiltros({ ...filtros, pagina: (filtros.pagina || 1) + 1 })}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* MODAL: Nova Demanda */}
      <Modal open={modalNova} onClose={() => setModalNova(false)} title="Nova Demanda" size="lg">
        <form onSubmit={handleCriar} className="space-y-4">
          {erroFormNova && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{erroFormNova}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Título *</label>
              <input className="input" value={formNova.titulo} onChange={(e) => setFormNova({ ...formNova, titulo: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoria *</label>
              <select className="input" value={formNova.categoria} onChange={(e) => setFormNova({ ...formNova, categoria: e.target.value as DemandaCategoria })} required>
                <option value="">Selecione</option>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Setor</label>
              <select className="input" value={formNova.setor_id || ''} onChange={(e) => setFormNova({ ...formNova, setor_id: e.target.value || undefined })}>
                <option value="">Nenhum</option>
                {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Descrição *</label>
              <textarea className="input" rows={3} value={formNova.descricao} onChange={(e) => setFormNova({ ...formNova, descricao: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço *</label>
              <input className="input" value={formNova.endereco} onChange={(e) => setFormNova({ ...formNova, endereco: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bairro *</label>
              <input className="input" value={formNova.bairro} onChange={(e) => setFormNova({ ...formNova, bairro: e.target.value })} required />
            </div>
          </div>

          <hr className="border-border" />
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2"><Target size={14} /> Critérios de Priorização</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'risco_seguranca', label: 'Risco à Segurança (0-10)' },
              { key: 'impacto_populacao', label: 'Impacto na População (0-10)' },
              { key: 'agravamento', label: 'Agravamento (0-10)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-muted mb-1">{label}</label>
                <input
                  type="range" min={0} max={10}
                  value={(formNova as unknown as Record<string, number>)[key] || 0}
                  onChange={(e) => setFormNova({ ...formNova, [key]: parseInt(e.target.value) })}
                  className="w-full accent-primary"
                />
                <div className="text-center text-sm font-bold text-primary">{(formNova as unknown as Record<string, number>)[key] || 0}</div>
              </div>
            ))}
          </div>
          <div className={`p-3 rounded-lg border text-sm ${PRIORIDADE_COLORS[previewPrioridade.faixa]}`}>
            <strong>Pontuação: {previewPrioridade.pontuacao}/100</strong> — {PRIORIDADE_LABELS[previewPrioridade.faixa]}
          </div>

          <hr className="border-border" />
          <h4 className="text-sm font-semibold text-foreground">Dados do Solicitante (opcional)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Nome</label>
              <input className="input" value={formNova.nome_solicitante || ''} onChange={(e) => setFormNova({ ...formNova, nome_solicitante: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Telefone</label>
              <input className="input" value={formNova.telefone_solicitante || ''} onChange={(e) => setFormNova({ ...formNova, telefone_solicitante: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">E-mail</label>
              <input className="input" type="email" value={formNova.email_solicitante || ''} onChange={(e) => setFormNova({ ...formNova, email_solicitante: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalNova(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={enviando}>
              {enviando ? 'Salvando...' : 'Registrar Demanda'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Detalhe da Demanda */}
      <Modal open={modalDetalhe} onClose={() => setModalDetalhe(false)} title={demandaSelecionada?.protocolo || ''} size="lg">
        {demandaSelecionada && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-border gap-4">
              {[
                { key: 'info', label: 'Informações', icon: Eye },
                { key: 'historico', label: 'Histórico', icon: History },
                { key: 'prioridade', label: 'Prioridade', icon: Target },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`flex items-center gap-1.5 pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    tabDetalhe === key ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
                  }`}
                  onClick={() => setTabDetalhe(key as typeof tabDetalhe)}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {tabDetalhe === 'info' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={STATUS_COLORS[demandaSelecionada.status]}>
                    {STATUS_LABELS[demandaSelecionada.status]}
                  </Badge>
                  <Badge className={`${PRIORIDADE_COLORS[demandaSelecionada.prioridade_faixa]} border`}>
                    {demandaSelecionada.prioridade_pontuacao} — {PRIORIDADE_LABELS[demandaSelecionada.prioridade_faixa]}
                  </Badge>
                  {demandaSelecionada.is_demo && (
                    <Badge className="bg-amber-100 text-amber-800">Demo</Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{demandaSelecionada.titulo}</h3>
                <p className="text-sm text-muted">{demandaSelecionada.descricao}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-muted" />{demandaSelecionada.endereco}</div>
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-muted" />{demandaSelecionada.bairro}</div>
                  <div className="flex items-center gap-2"><Building2 size={14} className="text-muted" />{demandaSelecionada.setor?.nome || 'Sem setor'}</div>
                  <div className="flex items-center gap-2"><User size={14} className="text-muted" />{demandaSelecionada.responsavel?.nome || 'Sem responsável'}</div>
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-muted" />{new Date(demandaSelecionada.created_at).toLocaleDateString('pt-BR')}</div>
                  <div className="flex items-center gap-2"><Clock size={14} className="text-muted" />{demandaSelecionada.prazo ? new Date(demandaSelecionada.prazo).toLocaleDateString('pt-BR') : 'Sem prazo'}</div>
                </div>

                {/* Status actions */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-2">Alterar Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FLOW.filter((s) => s !== demandaSelecionada.status).map((s) => (
                      <button
                        key={s}
                        className={`btn btn-sm ${STATUS_COLORS[s]} border`}
                        onClick={() => setConfirmStatus({ aberto: true, status: s, descricao: '' })}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                    {demandaSelecionada.status !== 'cancelada' && (
                      <button
                        className="btn btn-sm bg-red-100 text-red-800 border border-red-300"
                        onClick={() => setConfirmStatus({ aberto: true, status: 'cancelada', descricao: '' })}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Histórico */}
            {tabDetalhe === 'historico' && (
              <div className="space-y-4 animate-fade-in">
                {historico.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">Nenhum registro no histórico.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {historico.map((h) => (
                      <div key={h.id} className={`p-3 rounded-lg border text-sm ${h.interno ? 'bg-amber-50 border-amber-200' : 'bg-background border-border'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {h.tipo === 'status' && <ArrowUpDown size={12} className="text-primary" />}
                          {h.tipo === 'comentario' && <MessageSquare size={12} className="text-accent" />}
                          {h.tipo === 'atribuicao' && <User size={12} className="text-orange-500" />}
                          {h.tipo === 'prioridade' && <Target size={12} className="text-red-500" />}
                          <span className="font-medium text-foreground capitalize">{h.tipo.replace('_', ' ')}</span>
                          {h.interno && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Interno</Badge>}
                          <span className="text-xs text-muted ml-auto">
                            {new Date(h.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-muted">{h.descricao}</p>
                        {h.valor_anterior && h.valor_novo && (
                          <p className="text-xs mt-1 text-muted">
                            {h.valor_anterior} → <strong>{h.valor_novo}</strong>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add comment */}
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-2">Adicionar Comentário</h4>
                  <textarea
                    className="input mb-2"
                    rows={2}
                    placeholder="Escreva uma providência, comentário ou observação..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={comentarioInterno}
                        onChange={(e) => setComentarioInterno(e.target.checked)}
                        className="accent-primary"
                      />
                      Comentário interno (não visível ao público)
                    </label>
                    <button className="btn btn-primary btn-sm" onClick={handleComentario} disabled={!comentario.trim()}>
                      <Send size={14} /> Enviar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Prioridade */}
            {tabDetalhe === 'prioridade' && (
              <div className="space-y-4 animate-fade-in">
                <div className={`p-4 rounded-xl border text-center ${PRIORIDADE_COLORS[demandaSelecionada.prioridade_faixa]}`}>
                  <p className="text-3xl font-bold">{demandaSelecionada.prioridade_pontuacao}</p>
                  <p className="text-sm font-medium">{PRIORIDADE_LABELS[demandaSelecionada.prioridade_faixa]}</p>
                </div>

                {(() => {
                  const diasAberto = Math.floor((Date.now() - new Date(demandaSelecionada.created_at).getTime()) / (1000 * 60 * 60 * 24));
                  const resultado = calcularPrioridade({
                    risco_seguranca: demandaSelecionada.risco_seguranca,
                    impacto_populacao: demandaSelecionada.impacto_populacao,
                    tempo_espera_dias: diasAberto,
                    agravamento: demandaSelecionada.agravamento,
                  });
                  return (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Detalhamento dos Critérios</h4>
                      {resultado.detalhamento.map((d) => (
                        <div key={d.criterio} className="p-3 rounded-lg bg-background border border-border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{d.criterio}</span>
                            <span className="text-xs text-muted">Peso: {(d.peso * 100).toFixed(0)}% | Valor: {d.valor.toFixed(1)}/10</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-border rounded-full h-2 overflow-hidden">
                              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${(d.valor / 10) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary w-10 text-right">+{d.contribuicao.toFixed(0)}</span>
                          </div>
                          <p className="text-xs text-muted mt-1">{d.descricao}</p>
                        </div>
                      ))}
                      <p className="text-xs text-muted text-center">
                        A pontuação é calculada considerando os pesos configuráveis. Os critérios iniciais são ilustrativos.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL: Editar */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar Demanda" size="lg">
        {demandaSelecionada && (
          <div className="space-y-4">
            {erroFormEditar && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0 text-rose-600" />
                <span>{erroFormEditar}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Título</label>
                <input className="input" value={demandaSelecionada.titulo} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, titulo: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select className="input" value={demandaSelecionada.categoria} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, categoria: e.target.value as DemandaCategoria })}>
                  {Object.entries(CATEGORIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Setor</label>
                <select className="input" value={demandaSelecionada.setor_id || ''} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, setor_id: e.target.value || null })}>
                  <option value="">Nenhum</option>
                  {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Responsável</label>
                <select className="input" value={demandaSelecionada.responsavel_id || ''} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, responsavel_id: e.target.value || null })}>
                  <option value="">Nenhum</option>
                  {perfis.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prazo</label>
                <input type="date" className="input" value={demandaSelecionada.prazo || ''} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, prazo: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Endereço</label>
                <input className="input" value={demandaSelecionada.endereco} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, endereco: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bairro</label>
                <input className="input" value={demandaSelecionada.bairro} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, bairro: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea className="input" rows={3} value={demandaSelecionada.descricao} onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, descricao: e.target.value })} />
              </div>
            </div>

            <hr className="border-border" />
            <h4 className="text-sm font-semibold flex items-center gap-2"><Target size={14} /> Critérios de Priorização</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { key: 'risco_seguranca', label: 'Risco à Segurança' },
                { key: 'impacto_populacao', label: 'Impacto na População' },
                { key: 'agravamento', label: 'Agravamento' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-muted mb-1">{label} (0-10)</label>
                  <input
                    type="range" min={0} max={10}
                    value={(demandaSelecionada as unknown as Record<string, number>)[key] || 0}
                    onChange={(e) => setDemandaSelecionada({ ...demandaSelecionada, [key]: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                  <div className="text-center text-sm font-bold text-primary">{(demandaSelecionada as unknown as Record<string, number>)[key] || 0}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button className="btn btn-secondary" onClick={() => setModalEditar(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSalvarEdicao} disabled={enviando}>
                {enviando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Status Change */}
      <ConfirmDialog
        open={confirmStatus.aberto}
        title="Alterar Status"
        message={`Deseja alterar o status para "${STATUS_LABELS[confirmStatus.status]}"?`}
        confirmLabel="Confirmar"
        onConfirm={handleMudarStatus}
        onCancel={() => setConfirmStatus({ ...confirmStatus, aberto: false })}
        loading={enviando}
      />
    </div>
  );
}
