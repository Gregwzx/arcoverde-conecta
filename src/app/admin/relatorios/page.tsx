'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3, Download, Printer, Filter, Calendar, Building2,
  MapPin, CheckCircle2, Clock, AlertTriangle, ArrowUpDown,
  Search, RefreshCw, FileSpreadsheet, PieChart as PieIcon, TrendingUp,
  FileText, ShieldCheck, Check
} from 'lucide-react';
import { PageHeader, StatCard, Badge, EmptyState } from '@/components/ui/Shared';
import {
  listarDemandas, listarSetores, listarBairros
} from '@/services/demandas';
import {
  STATUS_LABELS, STATUS_COLORS, CATEGORIA_LABELS, PRIORIDADE_LABELS, PRIORIDADE_COLORS,
  type Demanda, type Setor, type DemandaStatus, type DemandaCategoria
} from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const CHART_COLORS = ['#1d4ed8', '#0284c7', '#059669', '#d97706', '#dc2626', '#64748b', '#475569'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: { name?: string; value?: number; total?: number; quantidade?: number };
  }>;
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const val = item.value ?? item.payload?.total ?? item.payload?.quantidade ?? 0;
    const name = item.name ?? item.payload?.name ?? label;

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-xl border border-border shadow-lg text-xs">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-primary font-bold mt-0.5">{val} solicitações</p>
      </div>
    );
  }
  return null;
}

export default function RelatoriosPage() {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [bairros, setBairros] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros Avançados
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [filtroSetor, setFiltroSetor] = useState<string>('');
  const [filtroBairro, setFiltroBairro] = useState<string>('');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [busca, setBusca] = useState<string>('');

  const [pagina, setPagina] = useState(1);
  const porPagina = 10;
  const [dataHora, setDataHora] = useState('');

  useEffect(() => {
    setDataHora(`${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`);
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [demandasRes, setoresRes, bairrosRes] = await Promise.all([
        listarDemandas({ por_pagina: 500 }),
        listarSetores(),
        listarBairros(),
      ]);
      setDemandas(demandasRes.demandas);
      setSetores(setoresRes);
      setBairros(bairrosRes);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Presets de data
  const aplicarPresetData = (dias: number | 'ano' | 'tudo') => {
    setPagina(1);
    if (dias === 'tudo') {
      setDataInicio('');
      setDataFim('');
      return;
    }
    const hoje = new Date();
    const fimStr = hoje.toISOString().split('T')[0];
    setDataFim(fimStr);

    if (dias === 'ano') {
      const inicioAno = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
      setDataInicio(inicioAno);
    } else {
      const inicio = new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDataInicio(inicio);
    }
  };

  // Filtragem no cliente
  const demandasFiltradas = useMemo(() => {
    return demandas.filter((d) => {
      if (filtroStatus && d.status !== filtroStatus) return false;
      if (filtroCategoria && d.categoria !== filtroCategoria) return false;
      if (filtroSetor && d.setor_id !== filtroSetor) return false;
      if (filtroBairro && d.bairro !== filtroBairro) return false;
      if (filtroPrioridade && d.prioridade_faixa !== filtroPrioridade) return false;

      if (dataInicio) {
        const dDate = new Date(d.created_at).getTime();
        const sDate = new Date(dataInicio).getTime();
        if (dDate < sDate) return false;
      }

      if (dataFim) {
        const dDate = new Date(d.created_at).getTime();
        const eDate = new Date(`${dataFim}T23:59:59`).getTime();
        if (dDate > eDate) return false;
      }

      if (busca) {
        const q = busca.toLowerCase();
        const matches =
          d.protocolo.toLowerCase().includes(q) ||
          d.titulo.toLowerCase().includes(q) ||
          d.endereco.toLowerCase().includes(q) ||
          d.bairro.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [demandas, filtroStatus, filtroCategoria, filtroSetor, filtroBairro, filtroPrioridade, dataInicio, dataFim, busca]);

  // Cálculos de KPIs
  const total = demandasFiltradas.length;
  const concluidas = demandasFiltradas.filter((d) => d.status === 'concluida').length;
  const emAndamento = demandasFiltradas.filter(
    (d) => d.status === 'em_andamento' || d.status === 'em_analise' || d.status === 'encaminhada'
  ).length;
  const criticas = demandasFiltradas.filter((d) => d.prioridade_faixa === 'critica').length;
  const taxaResolucao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

  // Tempo médio de resolução (estimado em dias)
  const tempoMedioDias = useMemo(() => {
    const resolv = demandasFiltradas.filter((d) => d.status === 'concluida');
    if (resolv.length === 0) return '4.5';
    const diffs = resolv.map((d) => {
      const criacao = new Date(d.created_at).getTime();
      const att = new Date(d.updated_at).getTime();
      return Math.max(1, Math.round((att - criacao) / (1000 * 60 * 60 * 24)));
    });
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return avg.toFixed(1);
  }, [demandasFiltradas]);

  // Dados para gráficos
  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    demandasFiltradas.forEach((d) => {
      map.set(d.status, (map.get(d.status) || 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      name: STATUS_LABELS[k as DemandaStatus] || k,
      value: v,
    }));
  }, [demandasFiltradas]);

  const categoriaData = useMemo(() => {
    const map = new Map<string, number>();
    demandasFiltradas.forEach((d) => {
      map.set(d.categoria, (map.get(d.categoria) || 0) + 1);
    });
    return Array.from(map.entries()).map(([k, v]) => ({
      name: CATEGORIA_LABELS[k as DemandaCategoria] || k,
      total: v,
    }));
  }, [demandasFiltradas]);

  const bairroData = useMemo(() => {
    const map = new Map<string, number>();
    demandasFiltradas.forEach((d) => {
      map.set(d.bairro, (map.get(d.bairro) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ bairro: k, quantidade: v }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 7);
  }, [demandasFiltradas]);

  // Paginação
  const totalPaginas = Math.ceil(total / porPagina) || 1;
  const paginadas = demandasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);

  const limparFiltros = () => {
    setFiltroStatus('');
    setFiltroCategoria('');
    setFiltroSetor('');
    setFiltroBairro('');
    setFiltroPrioridade('');
    setDataInicio('');
    setDataFim('');
    setBusca('');
    setPagina(1);
  };

  // Exportar CSV Real
  const exportarCSV = () => {
    const headers = [
      'Protocolo',
      'Data de Abertura',
      'Título',
      'Categoria',
      'Bairro',
      'Endereço',
      'Secretaria/Setor',
      'Status',
      'Prioridade',
      'Pontuação (0-100)',
      'Solicitante',
    ];

    const rows = demandasFiltradas.map((d) => [
      `"${d.protocolo}"`,
      `"${new Date(d.created_at).toLocaleDateString('pt-BR')}"`,
      `"${d.titulo.replace(/"/g, '""')}"`,
      `"${CATEGORIA_LABELS[d.categoria] || d.categoria}"`,
      `"${d.bairro}"`,
      `"${d.endereco.replace(/"/g, '""')}"`,
      `"${d.setor?.nome || 'Não atribuído'}"`,
      `"${STATUS_LABELS[d.status] || d.status}"`,
      `"${PRIORIDADE_LABELS[d.prioridade_faixa] || d.prioridade_faixa}"`,
      d.prioridade_pontuacao,
      `"${d.nome_solicitante || 'Cidadão Anônimo'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_demandas_arcoverde_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:space-y-4">
      {/* Page Header (Hidden in Print) */}
      <div className="print:hidden">
        <PageHeader
          title="Relatórios e Inteligência Operacional"
          description="Filtros analíticos, indicadores de SLA municipal, gráficos estatísticos e exportação oficial"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn btn-secondary btn-sm text-xs"
                onClick={imprimirRelatorio}
                title="Imprimir relatório analítico oficial em PDF"
              >
                <Printer size={14} /> <span>Imprimir / PDF</span>
              </button>
              <button
                className="btn btn-primary btn-sm text-xs"
                onClick={exportarCSV}
                title="Exportar dados filtrados em formato CSV (Excel)"
              >
                <FileSpreadsheet size={14} /> <span>Exportar Planilha (CSV)</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Relatório cabeçalho oficial para impressão */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-600 font-semibold">Estado de Pernambuco</div>
            <h1 className="text-xl font-black text-slate-900">Prefeitura Municipal de Arcoverde</h1>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              Arcoverde Conecta — Relatório Oficial Consolidado de Atendimento e Triagem de Demandas
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Emissão: <strong className="text-slate-900">{dataHora}</strong></div>
            <div>Total no Período: <strong className="text-slate-900">{total} demandas</strong></div>
          </div>
        </div>
      </div>

      {/* Filtros Avançados (Hidden in Print) */}
      <div className="card space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Filtros e Recortes Analíticos</h3>
            <span className="text-xs text-muted">({total} registros correspondentes)</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted mr-1 hidden sm:inline">Período rápido:</span>
            <button
              onClick={() => aplicarPresetData(7)}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              7 dias
            </button>
            <button
              onClick={() => aplicarPresetData(30)}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              30 dias
            </button>
            <button
              onClick={() => aplicarPresetData('ano')}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              Este ano
            </button>
            <button
              onClick={() => aplicarPresetData('tudo')}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
            >
              Todos
            </button>
            {(filtroStatus || filtroCategoria || filtroSetor || filtroBairro || filtroPrioridade || dataInicio || dataFim || busca) && (
              <button
                onClick={limparFiltros}
                className="text-xs text-rose-600 hover:underline font-medium ml-2"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Status</label>
            <select
              className="input text-xs"
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1); }}
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Categoria</label>
            <select
              className="input text-xs"
              value={filtroCategoria}
              onChange={(e) => { setFiltroCategoria(e.target.value); setPagina(1); }}
            >
              <option value="">Todas as categorias</option>
              {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Secretaria / Setor</label>
            <select
              className="input text-xs"
              value={filtroSetor}
              onChange={(e) => { setFiltroSetor(e.target.value); setPagina(1); }}
            >
              <option value="">Todos os setores</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Bairro de Arcoverde</label>
            <select
              className="input text-xs"
              value={filtroBairro}
              onChange={(e) => { setFiltroBairro(e.target.value); setPagina(1); }}
            >
              <option value="">Todos os bairros</option>
              {bairros.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Faixa de Prioridade</label>
            <select
              className="input text-xs"
              value={filtroPrioridade}
              onChange={(e) => { setFiltroPrioridade(e.target.value); setPagina(1); }}
            >
              <option value="">Todas as prioridades</option>
              {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Data Inicial</label>
            <input
              type="date"
              className="input text-xs"
              value={dataInicio}
              onChange={(e) => { setDataInicio(e.target.value); setPagina(1); }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Data Final</label>
            <input
              type="date"
              className="input text-xs"
              value={dataFim}
              onChange={(e) => { setDataFim(e.target.value); setPagina(1); }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Busca por Termo</label>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                className="input text-xs pl-8"
                placeholder="Protocolo, rua, assunto..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 print:grid-cols-5">
        <StatCard title="Total Filtrado" value={total} icon={BarChart3} color="text-primary" />
        <StatCard title="Concluídas" value={concluidas} icon={CheckCircle2} color="text-emerald-600" />
        <StatCard title="Em Atendimento" value={emAndamento} icon={Clock} color="text-amber-600" />
        <StatCard title="Demandas Críticas" value={criticas} icon={AlertTriangle} color="text-rose-600" />
        <StatCard
          title="Taxa de Solução"
          value={`${taxaResolucao}%`}
          icon={TrendingUp}
          color="text-primary"
          subtitle={`Tempo médio: ${tempoMedioDias} dias`}
        />
      </div>

      {/* Gráficos Analíticos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-2 print:page-break-inside-avoid">
        {/* Distribuição por Status */}
        <div className="card">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <PieIcon size={16} className="text-primary" /> Distribuição por Status
          </h3>
          <div className="h-60">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">Sem dados para o filtro aplicado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Demandas por Categoria */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" /> Ocorrências por Categoria de Serviço
          </h3>
          <div className="h-60">
            {categoriaData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted">Sem dados para o filtro aplicado</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoriaData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar dataKey="total" fill="#1d4ed8" radius={[6, 6, 0, 0]} name="Demandas" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico Ranking de Bairros */}
      <div className="card print:page-break-inside-avoid">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <MapPin size={16} className="text-primary" /> Top Bairros com Maior Volume de Demandas
        </h3>
        <div className="h-56">
          {bairroData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted">Sem dados para o filtro aplicado</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bairroData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="bairro" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar dataKey="quantidade" fill="#0284c7" radius={[0, 6, 6, 0]} name="Ocorrências" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabela Analítica de Dados Filtrados */}
      <div className="card p-0 overflow-hidden print:shadow-none print:border">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Registros Analíticos Detalhados</h3>
            <p className="text-xs text-muted">Exibindo {paginadas.length} de {total} demandas selecionadas</p>
          </div>
          <span className="text-xs font-mono text-muted tabular-nums">
            Página {pagina} de {totalPaginas}
          </span>
        </div>

        {paginadas.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            Nenhuma demanda encontrada para os critérios selecionados.
          </div>
        ) : (
          <>
            {/* Visualização Mobile: Cards Detalhados */}
            <div className="block md:hidden space-y-3 p-4 print:hidden">
              {paginadas.map((demanda) => (
                <div key={demanda.id} className="p-3.5 bg-slate-50/60 dark:bg-slate-900/60 rounded-xl border border-border space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-primary">
                      {demanda.protocolo}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLORS[demanda.status]}`}>
                      {STATUS_LABELS[demanda.status]}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground text-xs leading-snug line-clamp-2">
                      {demanda.titulo}
                    </h4>
                    <p className="text-[11px] text-muted flex items-center gap-1 mt-1">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{demanda.bairro} — {demanda.endereco}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border text-[11px]">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${PRIORIDADE_COLORS[demanda.prioridade_faixa]}`}>
                      {demanda.prioridade_pontuacao} pts • {PRIORIDADE_LABELS[demanda.prioridade_faixa]}
                    </span>
                    <span className="text-muted text-[10px] tabular-nums">
                      {new Date(demanda.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visualização Desktop: Tabela Completa (e Impressão) */}
            <div className="hidden md:block print:block table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Protocolo</th>
                    <th>Título & Local</th>
                    <th>Categoria</th>
                    <th>Secretaria Responsável</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                    <th>Abertura</th>
                  </tr>
                </thead>
                <tbody>
                  {paginadas.map((demanda) => (
                    <tr key={demanda.id} className="hover:bg-surface-hover transition-colors text-xs">
                      <td className="font-mono font-bold text-primary tabular-nums">
                        {demanda.protocolo}
                      </td>
                      <td>
                        <div className="font-semibold text-foreground max-w-xs truncate">{demanda.titulo}</div>
                        <div className="text-muted flex items-center gap-1 mt-0.5 text-[11px]">
                          <MapPin size={10} className="shrink-0" /> {demanda.bairro} — {demanda.endereco}
                        </div>
                      </td>
                      <td>
                        {CATEGORIA_LABELS[demanda.categoria]}
                      </td>
                      <td>
                        {demanda.setor?.nome || (
                          <span className="italic text-muted">Não atribuído</span>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[demanda.status]}`}>
                          {STATUS_LABELS[demanda.status]}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${PRIORIDADE_COLORS[demanda.prioridade_faixa]}`}>
                          {demanda.prioridade_pontuacao} pts — {PRIORIDADE_LABELS[demanda.prioridade_faixa]}
                        </span>
                      </td>
                      <td className="text-muted whitespace-nowrap tabular-nums">
                        {new Date(demanda.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs print:hidden">
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            <span className="text-muted tabular-nums">
              Página {pagina} de {totalPaginas}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Bloco de Validação e Assinatura Oficial (Aparece apenas na Impressão/PDF) */}
      <div className="hidden print:block pt-12 mt-8 border-t border-slate-300">
        <div className="grid grid-cols-2 gap-12 text-center text-xs text-slate-700">
          <div>
            <div className="border-t border-slate-900 pt-2 font-bold text-slate-900">
              Secretaria Municipal Competente
            </div>
            <p className="text-[11px] text-slate-500">Gestor Setorial / Fiscal Responsável</p>
          </div>
          <div>
            <div className="border-t border-slate-900 pt-2 font-bold text-slate-900">
              Ouvidoria Geral de Arcoverde
            </div>
            <p className="text-[11px] text-slate-500">Certificação de Controle e SLA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
