'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, Lightbulb, Construction, Trash2, Droplets, TreePine,
  BarChart3, Database, Sparkles, RefreshCw, Plus, ArrowRight,
  ShieldCheck, Layers, FileSpreadsheet, Settings
} from 'lucide-react';
import Link from 'next/link';
import { StatCard, StatCardSkeleton, PageHeader } from '@/components/ui/Shared';
import { obterEstatisticas, semearDadosDemonstracao } from '@/services/demandas';
import { CATEGORIA_LABELS, STATUS_LABELS, type DemandaCategoria, type DemandaStatus } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#1d4ed8', '#0284c7', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

// Tooltip estilizado para os gráficos
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 space-y-1">
        {label && <p className="font-semibold text-slate-200 border-b border-slate-700 pb-1">{label}</p>}
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || '#3b82f6' }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="font-mono font-bold text-white">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof obterEstatisticas>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [semeando, setSemeando] = useState(false);
  const [mensagemSeed, setMensagemSeed] = useState<string | null>(null);

  const carregarStats = () => {
    setLoading(true);
    obterEstatisticas()
      .then(setStats)
      .catch((err) => console.error('Erro ao carregar indicadores:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarStats();
  }, []);

  const handlePovoarBanco = async () => {
    setSemeando(true);
    setMensagemSeed(null);
    try {
      const res = await semearDadosDemonstracao();
      setMensagemSeed(`${res.inseridos} demandas e secretarias foram inseridas diretamente no seu banco Supabase com sucesso.`);
      carregarStats();
    } catch (err: unknown) {
      console.error(err);
      setMensagemSeed('Erro ao povoar banco. Verifique as políticas RLS no Supabase.');
    } finally {
      setSemeando(false);
      setTimeout(() => setMensagemSeed(null), 6000);
    }
  };

  const taxaResolucao = stats && stats.total > 0
    ? Math.round((stats.concluidas / stats.total) * 100)
    : 0;

  const statusData = stats?.por_status.map((s) => ({
    name: STATUS_LABELS[s.status as DemandaStatus] || s.status,
    value: s.count,
  })) || [];

  const categoriaData = stats?.por_categoria.map((c) => ({
    name: CATEGORIA_LABELS[c.categoria as DemandaCategoria] || c.categoria,
    value: c.count,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Painel Geral de Gestão"
        description="Indicadores operacionais consolidados da Prefeitura Municipal de Arcoverde"
        badge="Gestão Ativa"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={carregarStats}
              className="btn btn-secondary btn-sm text-xs gap-1.5"
              title="Atualizar dados do Supabase"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
              <span>Atualizar Dados</span>
            </button>
            <Link href="/admin/demandas" className="btn btn-primary btn-sm text-xs gap-1.5 shadow-sm">
              <Plus size={14} />
              <span>Nova Demanda</span>
            </Link>
          </div>
        }
      />

      {mensagemSeed && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 animate-fade-in shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{mensagemSeed}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              title="Total de Solicitações"
              value={stats?.total || 0}
              icon={ClipboardList}
              color="text-blue-600"
              subtitle="Base ativa de dados Supabase"
            />
            <StatCard
              title="Novas / Triagem"
              value={stats?.novas || 0}
              icon={AlertTriangle}
              color="text-amber-600"
              subtitle="Aguardando despacho setorial"
            />
            <StatCard
              title="Em Atendimento"
              value={stats?.em_andamento || 0}
              icon={Clock}
              color="text-sky-600"
              subtitle="Em execução pelas equipes"
            />
            <StatCard
              title="Índice de Resolução"
              value={`${taxaResolucao}%`}
              icon={TrendingUp}
              color="text-emerald-600"
              subtitle={`${stats?.concluidas || 0} concluídas com êxito`}
            />
          </>
        )}
      </div>

      {/* Se o banco estiver vazio */}
      {stats && stats.total === 0 && !loading && (
        <div className="card text-center py-12 space-y-3.5 bg-slate-50/80 border-dashed border-slate-300">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
            <Database size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 tracking-tight">
            Nenhuma demanda registrada no banco Supabase
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            O banco está conectado e funcional. Para avaliar os gráficos, mapas e o algoritmo de priorização com dados realistas de Arcoverde, clique abaixo:
          </p>
          <div className="pt-2">
            <button
              onClick={handlePovoarBanco}
              disabled={semeando}
              className="btn btn-primary btn-sm text-xs font-medium shadow-sm gap-2"
            >
              <Sparkles size={14} />
              <span>{semeando ? 'Inserindo dados no Supabase...' : 'Povoar Base de Demonstração de Arcoverde'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Atalhos Rápidos Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/admin/demandas"
          className="card py-3 px-4 flex items-center justify-between group hover:border-blue-300 hover:bg-blue-50/20 transition-all text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Layers size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">Fila de Priorização</p>
              <p className="text-[11px] text-slate-500">Triagem com matriz de risco</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/relatorios"
          className="card py-3 px-4 flex items-center justify-between group hover:border-blue-300 hover:bg-blue-50/20 transition-all text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <FileSpreadsheet size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">Relatórios e Impressão</p>
              <p className="text-[11px] text-slate-500">Exportação oficial da gestão</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/admin/configuracoes"
          className="card py-3 px-4 flex items-center justify-between group hover:border-blue-300 hover:bg-blue-50/20 transition-all text-xs"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Settings size={16} />
            </div>
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">Parâmetros de Pesos</p>
              <p className="text-[11px] text-slate-500">Ajuste do algoritmo de prioridade</p>
            </div>
          </div>
          <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Linha de Gráficos Analíticos */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Status */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 size={15} className="text-blue-600" />
                Distribuição por Status
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Consolidado</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demandas por Categoria */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <BarChart3 size={15} className="text-blue-600" />
                Demandas por Categoria de Serviço
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Top áreas</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoriaData} layout="vertical" margin={{ left: 0, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155' }} width={115} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#1d4ed8" radius={[0, 4, 4, 0]} name="Ocorrências" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendência Mensal */}
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <TrendingUp size={15} className="text-blue-600" />
                Evolução Histórica Mensal de Chamados
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Arcoverde-PE</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.tendencia_mensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    dot={{ fill: '#1d4ed8', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#2563eb' }}
                    name="Demandas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

