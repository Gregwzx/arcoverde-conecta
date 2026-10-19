'use client';

import { useState, useEffect } from 'react';
import {
  ClipboardList, AlertTriangle, Clock, CheckCircle2,
  TrendingUp, Lightbulb, Construction, Trash2, Droplets, TreePine,
  BarChart3, Database, Sparkles, RefreshCw, Plus
} from 'lucide-react';
import Link from 'next/link';
import { StatCard, StatCardSkeleton, PageHeader } from '@/components/ui/Shared';
import { obterEstatisticas, semearDadosDemonstracao } from '@/services/demandas';
import { CATEGORIA_LABELS, STATUS_LABELS, type DemandaCategoria, type DemandaStatus } from '@/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#4f46e5', '#0284c7', '#16a34a', '#d97706', '#dc2626', '#64748b'];

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
        description="Indicadores operacionais de zeladoria urbana da Prefeitura de Arcoverde"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={carregarStats}
              className="btn btn-secondary btn-sm text-xs"
              title="Atualizar dados do Supabase"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <Link href="/admin/demandas" className="btn btn-primary btn-sm text-xs">
              <Plus size={14} /> Nova Demanda
            </Link>
          </div>
        }
      />

      {mensagemSeed && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{mensagemSeed}</span>
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
              color="text-indigo-600"
              subtitle="Registros no banco Supabase"
            />
            <StatCard
              title="Novas / Triagem"
              value={stats?.novas || 0}
              icon={AlertTriangle}
              color="text-blue-600"
              subtitle="Aguardando despacho"
            />
            <StatCard
              title="Em Atendimento"
              value={stats?.em_andamento || 0}
              icon={Clock}
              color="text-amber-600"
              subtitle="Em análise ou campo"
            />
            <StatCard
              title="Taxa de Conclusão"
              value={`${taxaResolucao}%`}
              icon={TrendingUp}
              color="text-emerald-600"
              subtitle={`${stats?.concluidas || 0} concluídas`}
            />
          </>
        )}
      </div>

      {/* Se o banco estiver vazio */}
      {stats && stats.total === 0 && !loading && (
        <div className="card text-center py-10 space-y-3 bg-slate-50 border-dashed border-slate-300">
          <Database size={32} className="text-slate-400 mx-auto" />
          <h4 className="text-sm font-semibold text-slate-800">
            Nenhuma demanda registrada no banco Supabase
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            O banco está conectado e operacional. Para avaliar os gráficos e filtros com um conjunto de dados realistas de Arcoverde, você pode povoar o banco com registros demonstrativos:
          </p>
          <div className="pt-2">
            <button
              onClick={handlePovoarBanco}
              disabled={semeando}
              className="btn btn-primary btn-sm text-xs"
            >
              <Sparkles size={14} />
              {semeando ? 'Inserindo dados no Supabase...' : 'Carregar Base de Demonstração no Supabase'}
            </button>
          </div>
        </div>
      )}

      {/* Charts Row */}
      {stats && stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Status */}
          <div className="card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 size={15} className="text-indigo-600" />
              Distribuição por Status
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Categorias - Barras */}
          <div className="card">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 size={15} className="text-indigo-600" />
              Demandas por Categoria
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoriaData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={135} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Ocorrências" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tendência Mensal */}
          <div className="card lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp size={15} className="text-indigo-600" />
              Evolução Mensal de Solicitações
            </h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.tendencia_mensal}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    strokeWidth={2}
                    dot={{ fill: '#4f46e5', r: 3.5 }}
                    activeDot={{ r: 5 }}
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
