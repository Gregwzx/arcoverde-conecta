'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  BarChart3, ClipboardList, Search, MapPin, FileText, Shield,
  ArrowRight, ChevronDown, Lightbulb, Construction, Trash2,
  Droplets, TreePine, CheckCircle2, Clock, AlertTriangle, PlusCircle,
  Building2, Eye, Phone, Mail, ShieldCheck, Check, Copy, HelpCircle,
  Sparkles, Filter, X, ArrowUpRight, Printer, Share2, Info
} from 'lucide-react';
import { StatCard, Badge, EmptyState, StatCardSkeleton, CopyButton } from '@/components/ui/Shared';
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

// Componente de mapa georreferenciado com Leaflet (SSR-safe)
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

  const pontos = useMemo(() => demandas.filter((d) => d.latitude && d.longitude), [demandas]);

  if (!MapContainer || !TileLayer || !MarkerComp || !PopupComp) {
    return (
      <div className="h-[460px] bg-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-3 border border-slate-200">
        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <MapPin size={20} className="animate-bounce" />
        </div>
        <span className="text-xs font-medium text-slate-600">Carregando mapa georreferenciado do município de Arcoverde...</span>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
      <MapContainer
        center={[-8.4182, -37.0533]}
        zoom={14}
        style={{ height: '460px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pontos.map((d, i) => (
          <MarkerComp key={i} position={[d.latitude!, d.longitude!]}>
            <PopupComp>
              <div className="text-xs p-1 min-w-[200px]">
                <p className="font-bold text-slate-900 leading-snug">{d.titulo}</p>
                <p className="text-blue-700 font-mono font-semibold mt-0.5">{d.protocolo}</p>
                <p className="text-slate-600 mt-1 flex items-center gap-1">
                  <span>{CATEGORIA_LABELS[d.categoria as DemandaCategoria] || d.categoria}</span>
                </p>
                <div className="mt-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[d.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] || d.status}
                  </span>
                </div>
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

  // Filtros da Lista Pública
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroBairro, setFiltroBairro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [buscaTexto, setBuscaTexto] = useState('');
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

  const buscarProtocoloHandler = async (protAlvo?: string) => {
    const protLimpo = (protAlvo || protocolo).trim();
    if (!protLimpo) return;

    setBuscandoProtocolo(true);
    try {
      const res = await buscarPorProtocolo(protLimpo);
      setResultadoProtocolo(res);
      if (protAlvo) setProtocolo(protAlvo);
      setSecaoAtiva('protocolo');
    } catch {
      setResultadoProtocolo(null);
    } finally {
      setBuscandoProtocolo(false);
    }
  };

  const limparFiltros = () => {
    setFiltroCategoria('');
    setFiltroBairro('');
    setFiltroStatus('');
    setBuscaTexto('');
  };

  // Filtragem no cliente para busca instantânea por texto
  const demandasFiltradas = useMemo(() => {
    if (!buscaTexto.trim()) return demandas;
    const q = buscaTexto.toLowerCase();
    return demandas.filter(
      (d) =>
        d.protocolo.toLowerCase().includes(q) ||
        d.titulo.toLowerCase().includes(q) ||
        d.bairro.toLowerCase().includes(q)
    );
  }, [demandas, buscaTexto]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Barra de Identificação Governamental */}
      <div className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white tracking-wide">
              Prefeitura Municipal de Arcoverde
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">Pernambuco</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Canal Oficial de Atendimento e Zeladoria</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline">Ouvidoria: (87) 3821-9000</span>
          </div>
        </div>
      </div>

      {/* 2. Header Institucional */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base tracking-wide shadow-md shadow-blue-600/20 group-hover:bg-blue-700 transition-colors shrink-0">
                AC
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Arcoverde Conecta
                </h1>
                <p className="text-[11px] text-slate-500 font-medium leading-none">
                  Portal Municipal de Serviços Urbanos
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setSecaoAtiva('protocolo')}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Search size={14} className="text-slate-400" />
                <span>Consultar Protocolo</span>
              </button>

              <button
                onClick={() => setSecaoAtiva('registrar')}
                className="btn btn-primary btn-sm text-xs gap-1.5 font-medium shadow-sm"
              >
                <PlusCircle size={14} />
                <span>Registrar Demanda</span>
              </button>

              <Link
                href="/login"
                className="btn btn-secondary btn-sm text-xs text-slate-700 border-slate-300 hover:border-slate-400 gap-1.5"
              >
                <Shield size={14} className="text-blue-600" />
                <span className="hidden md:inline">Acesso</span> Servidor
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Hero Institucional Contemporâneo */}
      <section className="bg-slate-900 text-white py-10 sm:py-14 px-4 border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 text-xs mb-4 border border-slate-700/80">
            <Building2 size={13} className="text-blue-400" />
            <span>Sistema Municipal de Triagem e Zeladoria Urbana</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3 max-w-3xl mx-auto leading-tight">
            Cuidando da nossa cidade com mais agilidade e transparência
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Acompanhe em tempo real a manutenção urbana de Arcoverde. Registre problemas no seu bairro,
            consulte o andamento da sua solicitação e fiscalize as ações públicas.
          </p>

          {/* Busca Imediata de Protocolo no Hero */}
          <div className="max-w-xl mx-auto mb-8">
            <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-xl border border-white/20 flex gap-2 shadow-lg">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Digite seu protocolo (ex: ARC-2026-00001)"
                  value={protocolo}
                  onChange={(e) => setProtocolo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarProtocoloHandler()}
                  className="w-full bg-white text-slate-900 pl-10 pr-3 py-2.5 rounded-lg text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => buscarProtocoloHandler()}
                disabled={buscandoProtocolo || !protocolo.trim()}
                className="btn btn-primary text-xs px-4 py-2 font-medium"
              >
                {buscandoProtocolo ? 'Buscando...' : 'Consultar'}
              </button>
            </div>
          </div>

          {/* Navegação de Abas Segmentadas */}
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
                  className={`btn text-xs font-medium px-4 py-2.5 rounded-lg transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                  onClick={() => setSecaoAtiva(key as typeof secaoAtiva)}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Conteúdo Principal da Aba Selecionada */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ABA: Dashboard de Transparência */}
        {secaoAtiva === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/90 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Painel de Transparência de Serviços Públicos
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dados operacionais consolidados e atualizados do município de Arcoverde
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Monitoramento em Tempo Real
                </span>
              </div>
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
                    color="text-blue-600"
                    subtitle="Registros no sistema"
                  />
                  <StatCard
                    title="Em Triagem / Novas"
                    value={stats?.novas || 0}
                    icon={AlertTriangle}
                    color="text-amber-600"
                    subtitle="Aguardando encaminhamento"
                  />
                  <StatCard
                    title="Em Atendimento"
                    value={stats?.em_andamento || 0}
                    icon={Clock}
                    color="text-sky-600"
                    subtitle="Equipes operacionais em campo"
                  />
                  <StatCard
                    title="Concluídas / Atendidas"
                    value={stats?.concluidas || 0}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    subtitle={`${stats && stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}% de resolutividade`}
                  />
                </>
              )}
            </div>

            {/* Gráficos de Categorias e Bairros */}
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <BarChart3 size={15} className="text-blue-600" />
                      Demandas por Categoria de Serviço
                    </h4>
                    <span className="text-[11px] text-slate-400">Total: {stats.total}</span>
                  </div>

                  {stats.por_categoria.length === 0 ? (
                    <p className="text-xs text-slate-400 py-10 text-center">Nenhum registro para exibir no momento.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {stats.por_categoria.map((item) => {
                        const Icon = CATEGORIA_ICON_MAP[item.categoria] || FileText;
                        const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                        return (
                          <div key={item.categoria} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800 flex items-center gap-2 truncate">
                                <Icon size={14} className="text-blue-600 shrink-0" />
                                {CATEGORIA_LABELS[item.categoria as DemandaCategoria] || item.categoria}
                              </span>
                              <span className="font-mono text-slate-600 font-medium tabular-nums shrink-0">
                                {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <MapPin size={15} className="text-blue-600" />
                      Incidência por Bairro de Arcoverde
                    </h4>
                    <span className="text-[11px] text-slate-400">Top localidades</span>
                  </div>

                  {stats.por_bairro.length === 0 ? (
                    <p className="text-xs text-slate-400 py-10 text-center">Nenhum registro para exibir no momento.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {stats.por_bairro.slice(0, 7).map((item) => {
                        const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                        return (
                          <div key={item.bairro} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800 flex items-center gap-1.5 truncate">
                                <MapPin size={13} className="text-slate-400 shrink-0" />
                                {item.bairro}
                              </span>
                              <span className="font-mono text-slate-600 font-medium tabular-nums shrink-0">
                                {item.count} solicitação(ões)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-sky-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nota Institucional de Responsabilidade e LGPD */}
            <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
              <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Transparência Pública e Proteção de Dados (LGPD)</p>
                <p className="mt-0.5 text-slate-600 leading-relaxed">
                  As informações disponibilizadas neste portal são anonimizadas em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
                  Dados pessoais de contato dos cidadãos não são divulgados e permanecem sob custódia segura da administração municipal.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ABA: Consulta por Protocolo */}
        {secaoAtiva === 'protocolo' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Consulta Oficial de Solicitação por Protocolo
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                Digite o código gerado no registro para verificar o status atual, secretaria responsável e histórico de despachos.
              </p>
            </div>

            <div className="card space-y-5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    className="input pl-10 font-mono text-sm uppercase"
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
                  className="btn btn-primary text-xs px-6 py-2.5 font-medium shadow-xs"
                  onClick={() => buscarProtocoloHandler()}
                  disabled={buscandoProtocolo || !protocolo.trim()}
                >
                  {buscandoProtocolo ? 'Consultando...' : 'Consultar Andamento'}
                </button>
              </div>

              {/* Protocolos de Demonstração Rápidos */}
              {demandas.length > 0 && resultadoProtocolo === undefined && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[11px] text-slate-500 mb-2">Exemplos rápidos cadastrados no sistema (clique para testar):</p>
                  <div className="flex flex-wrap gap-2">
                    {demandas.slice(0, 4).map((d) => (
                      <button
                        key={d.id}
                        onClick={() => buscarProtocoloHandler(d.protocolo)}
                        className="text-xs font-mono bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {d.protocolo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultado não localizado */}
              {resultadoProtocolo === null && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1.5 animate-fade-in">
                  <p className="font-semibold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle size={15} /> Nenhuma solicitação localizada
                  </p>
                  <p className="text-rose-700 leading-relaxed">
                    Não localizamos registros com o código <strong className="font-mono">{protocolo}</strong>.
                    Certifique-se de que o número digitado está completo (exemplo: ARC-2026-00001) e tente novamente.
                  </p>
                </div>
              )}

              {/* Detalhes da Solicitação Encontrada */}
              {resultadoProtocolo && (
                <div className="pt-4 border-t border-slate-200/80 space-y-6 animate-fade-in">
                  {/* Cabeçalho do Protocolo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Comprovante Oficial de Tramitação
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-lg text-blue-700">
                          {resultadoProtocolo.protocolo}
                        </span>
                        <CopyButton text={resultadoProtocolo.protocolo} label="Copiar" />
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[resultadoProtocolo.status]}`}>
                        {STATUS_LABELS[resultadoProtocolo.status]}
                      </span>
                    </div>
                  </div>

                  {/* Linha do Tempo / Fases do Atendimento */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                      Estágio da Ocorrência
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
                            className={`h-2.5 w-full rounded-full mb-1.5 transition-colors ${
                              step.active ? 'bg-blue-600' : 'bg-slate-200'
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white p-4 border border-slate-200 rounded-xl">
                    <div>
                      <span className="text-slate-500 font-medium">Assunto da Demanda:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{resultadoProtocolo.titulo}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Categoria do Serviço:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {CATEGORIA_LABELS[resultadoProtocolo.categoria]}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Localização:</span>
                      <p className="text-slate-800 mt-0.5 font-medium">
                        {resultadoProtocolo.endereco} — {resultadoProtocolo.bairro}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Data de Abertura:</span>
                      <p className="text-slate-800 mt-0.5 font-medium">
                        {new Date(resultadoProtocolo.created_at).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(resultadoProtocolo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Descrição Detalhada */}
                  <div className="text-xs">
                    <span className="text-slate-500 font-medium">Descrição detalhada informada:</span>
                    <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-800 mt-1 leading-relaxed">
                      {resultadoProtocolo.descricao}
                    </p>
                  </div>

                  {/* Histórico Público */}
                  {resultadoProtocolo.historico && resultadoProtocolo.historico.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                        Histórico de Tramitação e Despachos
                      </h5>
                      <div className="space-y-3 border-l-2 border-blue-200 pl-4 py-1">
                        {resultadoProtocolo.historico.map((h) => (
                          <div key={h.id} className="text-xs text-slate-700 space-y-0.5">
                            <span className="text-slate-400 font-mono text-[11px] block">
                              {new Date(h.created_at).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="font-medium text-slate-900">{h.descricao}</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/90 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Mapeamento Georreferenciado de Demandas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualização espacial dos chamados de zeladoria urbana registrados em Arcoverde
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
                {demandas.length} ocorrência(s) com coordenadas
              </span>
            </div>

            <MapaOcorrencias demandas={demandas} />
          </div>
        )}

        {/* ABA: Relação de Demandas Públicas */}
        {secaoAtiva === 'lista' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Relação Pública de Demandas Urbanas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulte as solicitações registradas pelos cidadãos de Arcoverde
                </p>
              </div>
              {(filtroCategoria || filtroBairro || filtroStatus || buscaTexto) && (
                <button
                  onClick={limparFiltros}
                  className="btn btn-ghost btn-sm text-xs text-rose-700 hover:bg-rose-50 self-start"
                >
                  <X size={13} /> Limpar Filtros
                </button>
              )}
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por assunto ou bairro..."
                  value={buscaTexto}
                  onChange={(e) => setBuscaTexto(e.target.value)}
                  className="input pl-8 text-xs"
                />
              </div>

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

            {/* Tabela de Ocorrências Responsiva */}
            {demandasFiltradas.length === 0 ? (
              <div className="card text-center py-12">
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhuma demanda localizada"
                  description="Não foram encontradas ocorrências com os critérios e filtros selecionados."
                  action={
                    (filtroCategoria || filtroBairro || filtroStatus || buscaTexto) && (
                      <button onClick={limparFiltros} className="btn btn-secondary btn-sm text-xs">
                        Limpar Filtros de Busca
                      </button>
                    )
                  }
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
                    {demandasFiltradas.map((d) => (
                      <tr
                        key={d.id}
                        className="text-xs hover:bg-slate-50/80 cursor-pointer"
                        onClick={() => buscarProtocoloHandler(d.protocolo)}
                      >
                        <td className="font-mono font-bold text-blue-700 whitespace-nowrap">
                          {d.protocolo}
                        </td>
                        <td className="max-w-[280px] truncate font-medium text-slate-900">
                          {d.titulo}
                        </td>
                        <td className="text-slate-700 whitespace-nowrap">
                          {CATEGORIA_LABELS[d.categoria as DemandaCategoria] || d.categoria}
                        </td>
                        <td className="text-slate-700 whitespace-nowrap">{d.bairro}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLORS[d.status as keyof typeof STATUS_COLORS]}`}>
                            {STATUS_LABELS[d.status as keyof typeof STATUS_LABELS] || d.status}
                          </span>
                        </td>
                        <td className="text-slate-500 whitespace-nowrap tabular-nums">
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
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Registrar Solicitação de Serviço Público
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Cadastre ocorrências de manutenção urbana para encaminhamento à secretaria municipal competente.
              </p>
            </div>

            <FormularioPublico bairros={bairros} onSucesso={() => carregarDados()} />
          </div>
        )}
      </main>

      {/* 5. Footer Institucional Oficial */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 border-t border-slate-800 mt-auto text-xs">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3 text-white font-bold text-sm">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  AC
                </div>
                <span>Arcoverde Conecta</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-[11px] max-w-md">
                Plataforma oficial de integração, organização e priorização das demandas de serviços públicos de Arcoverde-PE.
                Desenvolvida como solução inovadora para o Desafios PE, com foco na eficiência da gestão pública municipal.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2.5 text-xs uppercase tracking-wider">Canais do Cidadão</h4>
              <ul className="space-y-1.5 text-[11px]">
                <li>
                  <button onClick={() => setSecaoAtiva('dashboard')} className="hover:text-white transition-colors">
                    Painel de Transparência
                  </button>
                </li>
                <li>
                  <button onClick={() => setSecaoAtiva('protocolo')} className="hover:text-white transition-colors">
                    Consulta por Protocolo
                  </button>
                </li>
                <li>
                  <button onClick={() => setSecaoAtiva('registrar')} className="hover:text-white transition-colors">
                    Registrar Nova Demanda
                  </button>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Acesso Restrito a Servidores
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2.5 text-xs uppercase tracking-wider">Atendimento Municipal</h4>
              <div className="space-y-2 text-[11px] text-slate-400">
                <p className="flex items-start gap-2">
                  <Building2 size={13} className="text-slate-500 shrink-0 mt-0.5" />
                  <span>Praça Winston Siqueira, 14 - Centro, Arcoverde - PE</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-500 shrink-0" />
                  <span>Ouvidoria: (87) 3821-9000</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={13} className="text-slate-500 shrink-0" />
                  <span>ouvidoria@arcoverde.pe.gov.br</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>© 2026 Prefeitura Municipal de Arcoverde • Projeto Desafios PE. Todos os direitos reservados.</p>
            <p className="text-slate-500">Solução desenvolvida com React, Next.js e Supabase</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Formulário do Cidadão com visual refinado ---
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
    website: '', // Honeypot antispam
  });
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: boolean; protocolo?: string; erro?: string } | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.website) return; // Honeypot antispam

    if (!form.titulo.trim() || !form.descricao.trim() || !form.categoria || !form.endereco.trim() || !form.bairro.trim()) {
      setResultado({ sucesso: false, erro: 'Preencha todos os campos obrigatórios marcados com (*).' });
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
      <div className="card text-center py-10 px-6 space-y-5 animate-fade-in border-emerald-200 bg-emerald-50/30">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-1">
          <CheckCircle2 size={32} />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 tracking-tight">
            Solicitação Protocolada com Sucesso!
          </h4>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
            Sua demanda foi cadastrada no sistema integrado de zeladoria e encaminhada para a secretaria competente de Arcoverde.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 inline-block shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Código do Protocolo
          </span>
          <div className="flex items-center justify-center gap-3 mt-1.5">
            <span className="text-2xl font-mono font-bold text-blue-700 tracking-wider">
              {resultado.protocolo}
            </span>
            {resultado.protocolo && <CopyButton text={resultado.protocolo} label="Copiar" />}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
          Guarde este número de protocolo. Você poderá acompanhar cada despacho da equipe na aba <strong>&ldquo;Consultar Protocolo&rdquo;</strong>.
        </div>

        <div className="pt-3">
          <button className="btn btn-secondary btn-sm text-xs font-medium" onClick={() => setResultado(null)}>
            Registrar Nova Solicitação
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="card space-y-5">
      {resultado?.erro && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-fade-in">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
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

      <div className="border-b border-slate-100 pb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
          Dados da Ocorrência
        </h4>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Título da Demanda *
        </label>
        <input
          className="input text-xs"
          placeholder="Ex.: Lâmpada queimada na Praça da Bandeira"
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Categoria do Serviço *
          </label>
          <select
            className="input text-xs"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            required
          >
            <option value="">Selecione o tipo de serviço</option>
            {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Endereço Completo e Ponto de Referência *
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
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Descrição Detalhada do Problema *
        </label>
        <textarea
          className="input text-xs"
          rows={3}
          placeholder="Descreva o problema com o máximo de informações para orientar a equipe técnica da prefeitura..."
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          required
        />
      </div>

      <div className="border-b border-slate-100 pb-2 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</span>
          Dados do Solicitante (Opcional)
        </h4>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Seus dados de contato permanecem sigilosos e não serão exibidos publicamente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Nome</label>
          <input
            className="input text-xs"
            placeholder="Nome (opcional)"
            value={form.nome_solicitante}
            onChange={(e) => setForm({ ...form, nome_solicitante: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Telefone Celular</label>
          <input
            className="input text-xs"
            placeholder="(87) 9XXXX-XXXX"
            value={form.telefone_solicitante}
            onChange={(e) => setForm({ ...form, telefone_solicitante: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">E-mail</label>
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
          className="btn btn-primary w-full py-2.5 text-xs font-medium shadow-sm"
          disabled={enviando}
        >
          {enviando ? 'Protocolando Solicitação...' : 'Protocolar Solicitação de Serviço'}
          {!enviando && <ArrowRight size={14} />}
        </button>
      </div>
    </form>
  );
}

