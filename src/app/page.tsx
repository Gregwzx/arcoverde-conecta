'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart3, ClipboardList, Search, MapPin, FileText, Shield,
  ArrowRight, ChevronDown, Lightbulb, Construction, Trash2,
  Droplets, TreePine, CheckCircle2, Clock, AlertTriangle, PlusCircle,
  Building2, Eye, Phone, Mail, ShieldCheck, Check, Copy, HelpCircle
} from 'lucide-react';
import { StatCard, Badge, EmptyState, StatCardSkeleton } from '@/components/ui/Shared';
import { STATUS_LABELS, CATEGORIA_LABELS, STATUS_COLORS, type DemandaCategoria } from '@/types';
import {
  obterEstatisticas,
  listarDemandasPublicas,
  buscarPorProtocolo,
  listarBairros,
  type DemandaPublicaDetalhe,
} from '@/services/demandas';

const CATEGORIA_ICON_MAP: Record<string, React.ElementType> = {
  iluminacao_publica: Lightbulb,
  pavimentacao: Construction,
  limpeza_urbana: Trash2,
  drenagem: Droplets,
  conservacao_espacos: TreePine,
};

// Componente de mapa com Leaflet (SSR-safe)
function MapaOcorrencias({
  demandas,
}: {
  demandas: { latitude: number | null; longitude: number | null; titulo: string; protocolo: string; categoria: string; status: string }[];
}) {
  const [MapContainer, setMapContainer] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [TileLayer, setTileLayer] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [MarkerComp, setMarkerComp] = useState<React.ComponentType<Record<string, unknown>> | null>(null);
  const [PopupComp, setPopupComp] = useState<React.ComponentType<Record<string, unknown>> | null>(null);

  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setMapContainer(() => mod.MapContainer as unknown as React.ComponentType<Record<string, unknown>>);
      setTileLayer(() => mod.TileLayer as unknown as React.ComponentType<Record<string, unknown>>);
      setMarkerComp(() => mod.Marker as unknown as React.ComponentType<Record<string, unknown>>);
      setPopupComp(() => mod.Popup as unknown as React.ComponentType<Record<string, unknown>>);
    });
  }, []);

  if (!MapContainer || !TileLayer || !MarkerComp || !PopupComp) {
    return (
      <div className="h-[420px] bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-500 gap-2 border border-slate-200">
        <MapPin size={28} className="text-slate-400 animate-pulse" />
        <span className="text-xs font-medium">Carregando mapa georreferenciado de Arcoverde...</span>
      </div>
    );
  }

  const pontos = demandas.filter((d) => d.latitude && d.longitude);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      <MapContainer
        center={[-8.4182, -37.0533]}
        zoom={14}
        style={{ height: '420px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pontos.map((d, i) => (
          <MarkerComp key={i} position={[d.latitude!, d.longitude!]}>
            <PopupComp>
              <div className="text-xs p-1">
                <p className="font-bold text-slate-900">{d.titulo}</p>
                <p className="text-indigo-600 font-mono mt-0.5">{d.protocolo}</p>
                <p className="text-slate-600 mt-1">
                  {CATEGORIA_LABELS[d.categoria as DemandaCategoria] || d.categoria}
                </p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[d.status as keyof typeof STATUS_COLORS]}`}>
                  {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] || d.status}
                </span>
              </div>
            </PopupComp>
          </MarkerComp>
        ))}
      </MapContainer>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof obterEstatisticas>> | null>(null);
  const [demandas, setDemandas] = useState<Awaited<ReturnType<typeof listarDemandasPublicas>>>([]);
  const [bairros, setBairros] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Consulta por Protocolo
  const [protocolo, setProtocolo] = useState('');
  const [resultadoProtocolo, setResultadoProtocolo] = useState<DemandaPublicaDetalhe | null | undefined>(undefined);
  const [buscandoProtocolo, setBuscandoProtocolo] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBairro, setFiltroBairro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [secaoAtiva, setSecaoAtiva] = useState<'dashboard' | 'lista' | 'mapa' | 'protocolo' | 'registrar'>('dashboard');

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, demandasData, bairrosData] = await Promise.all([
        obterEstatisticas(),
        listarDemandasPublicas({ categoria: filtroCategoria, bairro: filtroBairro, status: filtroStatus }),
        listarBairros(),
      ]);
      setStats(statsData);
      setDemandas(demandasData);
      setBairros(bairrosData);
    } catch (err) {
      console.error('Erro ao consultar dados públicos:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria, filtroBairro, filtroStatus]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const buscarProtocoloHandler = async () => {
    const protLimpo = protocolo.trim();
    if (!protLimpo) return;

    setBuscandoProtocolo(true);
    try {
      const res = await buscarPorProtocolo(protLimpo);
      setResultadoProtocolo(res);
    } catch {
      setResultadoProtocolo(null);
    } finally {
      setBuscandoProtocolo(false);
    }
  };

  const copiarProtocolo = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra de Identificação Governamental */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="font-medium tracking-wide">
            Prefeitura Municipal de Arcoverde • Estado de Pernambuco
          </span>
          <span className="text-slate-400">
            Canal Oficial de Zeladoria e Serviços Urbanos
          </span>
        </div>
      </div>

      {/* Header Institucional */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm tracking-wide">
                AC
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                  Arcoverde Conecta
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">
                  Portal da Transparência & Zeladoria
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSecaoAtiva('protocolo')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
              >
                <Search size={14} /> Consultar Protocolo
              </button>

              <button
                onClick={() => setSecaoAtiva('registrar')}
                className="btn btn-primary btn-sm text-xs"
              >
                <PlusCircle size={14} /> Registrar Solicitação
              </button>

              <Link
                href="/login"
                className="btn btn-secondary btn-sm text-xs border-slate-300 text-slate-700"
              >
                <Shield size={14} className="text-indigo-600" /> Acesso Servidor
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Institucional Sóbrio */}
      <section className="bg-slate-900 text-white py-12 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs mb-4 border border-slate-700">
            <Building2 size={13} className="text-indigo-400" />
            Gestão Participativa e Atendimento ao Cidadão
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Zeladoria Urbana e Serviços Públicos de Arcoverde
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Acompanhe as solicitações de manutenção da nossa cidade em tempo real.
            Cadastre ocorrências, consulte o andamento de protocolos e verifique os indicadores oficiais.
          </p>

          {/* Navegação de Abas do Portal */}
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {[
              { key: 'dashboard', icon: BarChart3, label: 'Indicadores Públicos' },
              { key: 'protocolo', icon: Search, label: 'Consultar Protocolo' },
              { key: 'mapa', icon: MapPin, label: 'Mapa de Ocorrências' },
              { key: 'lista', icon: ClipboardList, label: 'Relação de Demandas' },
              { key: 'registrar', icon: PlusCircle, label: 'Registrar Demanda' },
            ].map(({ key, icon: Icon, label }) => {
              const active = secaoAtiva === key;
              return (
                <button
                  key={key}
                  className={`btn text-xs font-medium px-4 py-2 rounded-md transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                  onClick={() => setSecaoAtiva(key as typeof secaoAtiva)}
                >
                  <Icon size={14} /> {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ABA: Dashboard de Transparência */}
        {secaoAtiva === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Painel de Transparência Pública
                </h3>
                <p className="text-xs text-slate-500">
                  Dados consolidados dos serviços públicos municipais
                </p>
              </div>
              <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md self-start">
                Atualização em tempo real
              </span>
            </div>

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
                    subtitle="Registros no sistema"
                  />
                  <StatCard
                    title="Em Triagem / Novas"
                    value={stats?.novas || 0}
                    icon={AlertTriangle}
                    color="text-blue-600"
                    subtitle="Aguardando encaminhamento"
                  />
                  <StatCard
                    title="Em Execução"
                    value={stats?.em_andamento || 0}
                    icon={Clock}
                    color="text-amber-600"
                    subtitle="Equipes mobilizadas"
                  />
                  <StatCard
                    title="Atendidas / Concluídas"
                    value={stats?.concluidas || 0}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    subtitle={`${stats && stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}% de resolução`}
                  />
                </>
              )}
            </div>

            {/* Gráficos de Categorias e Bairros */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                    <BarChart3 size={15} className="text-indigo-600" />
                    Demandas por Categoria de Serviço
                  </h4>
                  {stats.por_categoria.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">Nenhum registro para exibir no momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.por_categoria.map((item) => {
                        const Icon = CATEGORIA_ICON_MAP[item.categoria] || FileText;
                        const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                        return (
                          <div key={item.categoria} className="flex items-center gap-3">
                            <Icon size={15} className="text-indigo-600 shrink-0" />
                            <span className="text-xs font-medium text-slate-800 w-44 truncate">
                              {CATEGORIA_LABELS[item.categoria as DemandaCategoria] || item.categoria}
                            </span>
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-16 text-right font-mono">
                              {item.count} ({pct}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
                    <MapPin size={15} className="text-indigo-600" />
                    Incidência por Bairro
                  </h4>
                  {stats.por_bairro.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">Nenhum registro para exibir no momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.por_bairro.slice(0, 7).map((item) => {
                        const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                        return (
                          <div key={item.bairro} className="flex items-center gap-3">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            <span className="text-xs font-medium text-slate-800 w-36 truncate">
                              {item.bairro}
                            </span>
                            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-sky-600 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-10 text-right font-mono">
                              {item.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nota Institucional de Responsabilidade e LGPD */}
            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Transparência e Proteção de Dados (LGPD)</p>
                <p className="mt-0.5 text-slate-600 leading-relaxed">
                  As demandas exibidas nesta área pública são anonimizadas para preservar a privacidade do cidadão.
                  Telefones, e-mails e despachos internos de servidores não são divulgados abertamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ABA: Consulta por Protocolo */}
        {secaoAtiva === 'protocolo' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">
                Consulta de Solicitação por Protocolo
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Informe o número do protocolo gerado no momento do registro para verificar a tramitação.
              </p>
            </div>

            <div className="card space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="input pl-9 font-mono text-sm uppercase"
                    placeholder="Ex.: ARC-2026-00001"
                    value={protocolo}
                    onChange={(e) => {
                      setProtocolo(e.target.value);
                      setResultadoProtocolo(undefined);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && buscarProtocoloHandler()}
                  />
                </div>
                <button
                  className="btn btn-primary text-xs px-5"
                  onClick={buscarProtocoloHandler}
                  disabled={buscandoProtocolo || !protocolo.trim()}
                >
                  {buscandoProtocolo ? 'Consultando...' : 'Consultar'}
                </button>
              </div>

              {/* Resultado não encontrado */}
              {resultadoProtocolo === null && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1 animate-fade-in">
                  <p className="font-semibold">Nenhuma solicitação localizada</p>
                  <p className="text-rose-700 leading-relaxed">
                    Não encontramos registro com o protocolo <strong className="font-mono">{protocolo}</strong>.
                    Certifique-se de que digitou o formato correto (ex: ARC-2026-00001) e tente novamente.
                  </p>
                </div>
              )}

              {/* Detalhes da Solicitação Encontrada */}
              {resultadoProtocolo && (
                <div className="pt-4 border-t border-slate-200 space-y-5 animate-fade-in">
                  {/* Cabeçalho do Protocolo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                        Protocolo Oficial
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-indigo-700">
                          {resultadoProtocolo.protocolo}
                        </span>
                        <button
                          onClick={() => copiarProtocolo(resultadoProtocolo.protocolo)}
                          className="text-slate-400 hover:text-slate-700"
                          title="Copiar protocolo"
                        >
                          {copiado ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[resultadoProtocolo.status]}`}>
                      {STATUS_LABELS[resultadoProtocolo.status]}
                    </span>
                  </div>

                  {/* Linha do Tempo / Fases do Atendimento */}
                  <div>
                    <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">
                      Estágio de Atendimento
                    </h5>
                    <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                      {[
                        { label: '1. Registrado', active: true },
                        { label: '2. Em Análise', active: resultadoProtocolo.status !== 'nova' },
                        { label: '3. Em Execução', active: resultadoProtocolo.status === 'em_andamento' || resultadoProtocolo.status === 'concluida' },
                        { label: '4. Concluído', active: resultadoProtocolo.status === 'concluida' },
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div
                            className={`h-2 w-full rounded-full mb-1.5 ${
                              step.active ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                          />
                          <span className={step.active ? 'font-semibold text-slate-900' : 'text-slate-400'}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dados da Ocorrência */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3 border border-slate-200 rounded-lg">
                    <div>
                      <span className="text-slate-500 font-medium">Assunto / Título:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{resultadoProtocolo.titulo}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Categoria:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {CATEGORIA_LABELS[resultadoProtocolo.categoria]}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Localização:</span>
                      <p className="text-slate-800 mt-0.5">
                        {resultadoProtocolo.endereco} — {resultadoProtocolo.bairro}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Data de Abertura:</span>
                      <p className="text-slate-800 mt-0.5">
                        {new Date(resultadoProtocolo.created_at).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(resultadoProtocolo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Descrição Detalhada */}
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Descrição informada:</span>
                    <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 mt-1 leading-relaxed">
                      {resultadoProtocolo.descricao}
                    </p>
                  </div>

                  {/* Histórico Público */}
                  {resultadoProtocolo.historico && resultadoProtocolo.historico.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                        Histórico de Tramitação
                      </h5>
                      <div className="space-y-2 border-l-2 border-indigo-200 pl-3">
                        {resultadoProtocolo.historico.map((h) => (
                          <div key={h.id} className="text-xs text-slate-700">
                            <span className="text-slate-400 font-mono text-[11px] block">
                              {new Date(h.created_at).toLocaleDateString('pt-BR')} —{' '}
                              {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-medium text-slate-800">{h.descricao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: Mapa Georreferenciado */}
        {secaoAtiva === 'mapa' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Mapa de Ocorrências no Município
                </h3>
                <p className="text-xs text-slate-500">
                  Visualização espacial das ocorrências cadastradas em Arcoverde
                </p>
              </div>
              <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-2 py-1 rounded">
                {demandas.length} ponto(s) registrado(s)
              </span>
            </div>

            <MapaOcorrencias demandas={demandas} />
          </div>
        )}

        {/* ABA: Relação de Demandas Públicas */}
        {secaoAtiva === 'lista' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Relação Pública de Demandas
                </h3>
                <p className="text-xs text-slate-500">
                  Consulte as solicitações de zeladoria urbana da população
                </p>
              </div>
            </div>

            {/* Filtros em linha */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                className="input text-xs"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>

              <select
                className="input text-xs"
                value={filtroBairro}
                onChange={(e) => setFiltroBairro(e.target.value)}
              >
                <option value="">Todos os bairros</option>
                {bairros.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                className="input text-xs"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Tabela de Ocorrências */}
            {demandas.length === 0 ? (
              <div className="card text-center py-12">
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhuma demanda localizada"
                  description="Não foram encontradas demandas para os filtros informados."
                />
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Protocolo</th>
                      <th>Assunto</th>
                      <th>Categoria</th>
                      <th>Bairro</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandas.map((d) => (
                      <tr key={d.id} className="text-xs">
                        <td className="font-mono font-bold text-indigo-700">
                          {d.protocolo}
                        </td>
                        <td className="max-w-[260px] truncate font-medium text-slate-900">
                          {d.titulo}
                        </td>
                        <td className="text-slate-700">
                          {CATEGORIA_LABELS[d.categoria as DemandaCategoria] || d.categoria}
                        </td>
                        <td className="text-slate-700">{d.bairro}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[d.status as keyof typeof STATUS_COLORS]}`}>
                            {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] || d.status}
                          </span>
                        </td>
                        <td className="text-slate-500 whitespace-nowrap">
                          {new Date(d.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA: Formulário de Registro de Demanda */}
        {secaoAtiva === 'registrar' && (
          <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900">
                Registrar Solicitação de Serviço Público
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Preencha os dados abaixo para cadastrar uma ocorrência junto à Prefeitura de Arcoverde.
              </p>
            </div>

            <FormularioPublico bairros={bairros} onSucesso={() => carregarDados()} />
          </div>
        )}
      </main>

      {/* Footer Governamental */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2 text-white font-bold text-sm">
                <div className="h-6 w-6 rounded bg-indigo-600 text-white flex items-center justify-center text-xs">AC</div>
                Arcoverde Conecta
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Plataforma oficial de atendimento, zeladoria urbana e transparência municipal da Prefeitura de Arcoverde, Pernambuco.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2 text-xs">Canais de Acesso</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li><button onClick={() => setSecaoAtiva('dashboard')} className="hover:text-white transition-colors">Indicadores de Transparência</button></li>
                <li><button onClick={() => setSecaoAtiva('protocolo')} className="hover:text-white transition-colors">Consulta por Protocolo</button></li>
                <li><button onClick={() => setSecaoAtiva('registrar')} className="hover:text-white transition-colors">Registrar Demanda Cidadã</button></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Acesso Restrito a Servidores</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2 text-xs">Atendimento Institucional</h4>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <p className="flex items-center gap-2"><Building2 size={13} className="text-slate-400" /> Praça Winston Siqueira, 14 - Centro</p>
                <p className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> Ouvidoria: (87) 3821-9000</p>
                <p className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> ouvidoria@arcoverde.pe.gov.br</p>
              </div>
            </div>
          </div>

          <div className="pt-4 text-center text-[11px] text-slate-500">
            <p>© 2026 Prefeitura Municipal de Arcoverde • Desafios PE. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Formulário do Cidadão ---
function FormularioPublico({
  bairros,
  onSucesso,
}: {
  bairros: string[];
  onSucesso: () => void;
}) {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: '' as string,
    endereco: '',
    bairro: '',
    nome_solicitante: '',
    telefone_solicitante: '',
    email_solicitante: '',
    website: '', // Honeypot
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: boolean; protocolo?: string; erro?: string } | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.website) return; // Honeypot antispam

    if (!form.titulo.trim() || !form.descricao.trim() || !form.categoria || !form.endereco.trim() || !form.bairro.trim()) {
      setResultado({ sucesso: false, erro: 'Preencha todos os campos obrigatórios assinalados com (*).' });
      return;
    }

    setEnviando(true);
    setResultado(null);

    try {
      const { criarDemanda } = await import('@/services/demandas');
      const demanda = await criarDemanda({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        categoria: form.categoria as DemandaCategoria,
        endereco: form.endereco.trim(),
        bairro: form.bairro.trim(),
        nome_solicitante: form.nome_solicitante.trim() || undefined,
        telefone_solicitante: form.telefone_solicitante.trim() || undefined,
        email_solicitante: form.email_solicitante.trim() || undefined,
      });

      setResultado({ sucesso: true, protocolo: demanda.protocolo });
      setForm({
        titulo: '',
        descricao: '',
        categoria: '',
        endereco: '',
        bairro: '',
        nome_solicitante: '',
        telefone_solicitante: '',
        email_solicitante: '',
        website: '',
      });
      onSucesso();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Falha ao registrar solicitação no banco de dados.';
      setResultado({ sucesso: false, erro: msg });
    } finally {
      setEnviando(false);
    }
  };

  if (resultado?.sucesso) {
    return (
      <div className="card text-center py-10 space-y-4 animate-fade-in border-emerald-200 bg-emerald-50/40">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-1">
          <CheckCircle2 size={28} />
        </div>
        <h4 className="text-base font-bold text-slate-900">
          Solicitação Protocolada com Sucesso!
        </h4>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Sua demanda foi recebida pela central de zeladoria e encaminhada para a secretaria competente.
        </p>

        <div className="bg-white p-4 rounded-lg border border-slate-200 inline-block">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Número de Protocolo
          </span>
          <span className="text-2xl font-mono font-bold text-indigo-700 tracking-wide mt-1 block">
            {resultado.protocolo}
          </span>
        </div>

        <p className="text-[11px] text-slate-500">
          Guarde este protocolo para consultar o andamento na aba <strong>&ldquo;Consultar Protocolo&rdquo;</strong>.
        </p>

        <div className="pt-2">
          <button className="btn btn-secondary btn-sm text-xs" onClick={() => setResultado(null)}>
            Registrar Nova Solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="card space-y-4">
      {resultado?.erro && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-600" />
          <span>{resultado.erro}</span>
        </div>
      )}

      {/* Honeypot invisível */}
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="border-b border-slate-200 pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          1. Detalhes da Ocorrência
        </h4>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Título da Demanda *
        </label>
        <input
          className="input text-xs"
          placeholder="Ex.: Lâmpada queimada em frente à praça"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Categoria do Serviço *
          </label>
          <select
            className="input text-xs"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            required
          >
            <option value="">Selecione a categoria</option>
            {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bairro de Arcoverde *
          </label>
          <input
            className="input text-xs"
            placeholder="Ex.: Centro, São Cristóvão..."
            value={form.bairro}
            onChange={(e) => setForm({ ...form, bairro: e.target.value })}
            list="bairros-sugestoes"
            required
          />
          <datalist id="bairros-sugestoes">
            {bairros.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Endereço Completo / Referência *
        </label>
        <input
          className="input text-xs"
          placeholder="Rua, número ou ponto de referência próximo"
          value={form.endereco}
          onChange={(e) => setForm({ ...form, endereco: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Descrição Detalhada do Problema *
        </label>
        <textarea
          className="input text-xs"
          rows={3}
          placeholder="Descreva o problema com o máximo de detalhes para orientar a equipe técnica da prefeitura..."
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          required
        />
      </div>

      <div className="border-b border-slate-200 pb-2 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          2. Dados do Solicitante (Opcional)
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Seus dados de contato permanecem sigilosos e não serão exibidos no portal público.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nome</label>
          <input
            className="input text-xs"
            placeholder="Nome (opcional)"
            value={form.nome_solicitante}
            onChange={(e) => setForm({ ...form, nome_solicitante: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Telefone Celular</label>
          <input
            className="input text-xs"
            placeholder="(87) 9XXXX-XXXX"
            value={form.telefone_solicitante}
            onChange={(e) => setForm({ ...form, telefone_solicitante: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">E-mail</label>
          <input
            type="email"
            className="input text-xs"
            placeholder="seu@email.com"
            value={form.email_solicitante}
            onChange={(e) => setForm({ ...form, email_solicitante: e.target.value })}
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="btn btn-primary w-full py-2.5 text-xs font-medium shadow-xs"
          disabled={enviando}
        >
          {enviando ? 'Protocolando Solicitação...' : 'Protocolar Solicitação'}
          {!enviando && <ArrowRight size={14} />}
        </button>
      </div>
    </form>
  );
}
