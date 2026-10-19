'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Settings, Sliders, ShieldAlert, Clock, Users, AlertTriangle,
  Save, RotateCcw, CheckCircle2, Info, Building2, Phone, Mail,
  Calculator, Sparkles, HelpCircle, Layers
} from 'lucide-react';
import { PageHeader, Badge } from '@/components/ui/Shared';
import { obterConfiguracoes, salvarConfiguracoes } from '@/services/demandas';
import { calcularPrioridade } from '@/lib/priorizacao';
import {
  type PesoPriorizacao, type FaixaPrioridade, PESOS_PADRAO, FAIXAS_PADRAO,
  PRIORIDADE_LABELS, PRIORIDADE_COLORS
} from '@/types';

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  // Dados gerais
  const [nomeOrgao, setNomeOrgao] = useState('Prefeitura Municipal de Arcoverde');
  const [ouvidoriaTelefone, setOuvidoriaTelefone] = useState('(87) 3821-9000');
  const [ouvidoriaEmail, setOuvidoriaEmail] = useState('ouvidoria@arcoverde.pe.gov.br');
  const [slaPadraoDias, setSlaPadraoDias] = useState(15);

  // Pesos do algoritmo de priorização
  const [pesoRisco, setPesoRisco] = useState(35);
  const [pesoImpacto, setPesoImpacto] = useState(25);
  const [pesoTempo, setPesoTempo] = useState(20);
  const [pesoAgravamento, setPesoAgravamento] = useState(20);

  // Simulador de Prioridade em Tempo Real
  const [simRisco, setSimRisco] = useState(8);
  const [simImpacto, setSimImpacto] = useState(7);
  const [simTempoDias, setSimTempoDias] = useState(14);
  const [simAgravamento, setSimAgravamento] = useState(6);

  useEffect(() => {
    obterConfiguracoes().then((config) => {
      setNomeOrgao(config.nome_orgao);
      setOuvidoriaTelefone(config.ouvidoria_telefone);
      setOuvidoriaEmail(config.ouvidoria_email);
      setSlaPadraoDias(config.sla_padrao_dias);
      setPesoRisco(Math.round(config.pesos_priorizacao.risco_seguranca * 100));
      setPesoImpacto(Math.round(config.pesos_priorizacao.impacto_populacao * 100));
      setPesoTempo(Math.round(config.pesos_priorizacao.tempo_espera * 100));
      setPesoAgravamento(Math.round(config.pesos_priorizacao.agravamento * 100));
      setLoading(false);
    });
  }, []);

  const totalPesos = pesoRisco + pesoImpacto + pesoTempo + pesoAgravamento;

  // Cálculo simulado em tempo real
  const simulacao = useMemo(() => {
    const pesosObj: PesoPriorizacao = {
      risco_seguranca: pesoRisco / 100,
      impacto_populacao: pesoImpacto / 100,
      tempo_espera: pesoTempo / 100,
      agravamento: pesoAgravamento / 100,
    };

    return calcularPrioridade(
      {
        risco_seguranca: simRisco,
        impacto_populacao: simImpacto,
        tempo_espera_dias: simTempoDias,
        agravamento: simAgravamento,
      },
      pesosObj,
      FAIXAS_PADRAO
    );
  }, [pesoRisco, pesoImpacto, pesoTempo, pesoAgravamento, simRisco, simImpacto, simTempoDias, simAgravamento]);

  const restaurarPadrao = () => {
    setPesoRisco(Math.round(PESOS_PADRAO.risco_seguranca * 100));
    setPesoImpacto(Math.round(PESOS_PADRAO.impacto_populacao * 100));
    setPesoTempo(Math.round(PESOS_PADRAO.tempo_espera * 100));
    setPesoAgravamento(Math.round(PESOS_PADRAO.agravamento * 100));
    setSlaPadraoDias(15);
  };

  const aplicarEstrategia = (tipo: 'seguranca' | 'impacto' | 'equilibrada') => {
    if (tipo === 'seguranca') {
      setPesoRisco(50);
      setPesoImpacto(20);
      setPesoTempo(15);
      setPesoAgravamento(15);
    } else if (tipo === 'impacto') {
      setPesoRisco(25);
      setPesoImpacto(45);
      setPesoTempo(15);
      setPesoAgravamento(15);
    } else {
      restaurarPadrao();
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    try {
      await salvarConfiguracoes({
        nome_orgao: nomeOrgao,
        ouvidoria_telefone: ouvidoriaTelefone,
        ouvidoria_email: ouvidoriaEmail,
        sla_padrao_dias: slaPadraoDias,
        pesos_priorizacao: {
          risco_seguranca: pesoRisco / 100,
          impacto_populacao: pesoImpacto / 100,
          tempo_espera: pesoTempo / 100,
          agravamento: pesoAgravamento / 100,
        },
      });

      setMensagem('Configurações e pesos de priorização salvos com sucesso!');
    } catch (err) {
      console.error(err);
      setMensagem('Erro ao salvar configurações.');
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <PageHeader
        title="Configurações e Matriz de Priorização"
        description="Ajuste os parâmetros municipais e calibre a inteligência multicritério que prioriza as demandas de Arcoverde"
      />

      {mensagem && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{mensagem}</span>
        </div>
      )}

      <form onSubmit={handleSalvar} className="space-y-6">
        {/* Bloco 1: Algoritmo de Priorização Inteligente */}
        <div className="card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sliders size={18} className="text-primary" />
                Pesos do Algoritmo Multicritério (0 a 100 pts)
              </h3>
              <p className="text-xs text-muted mt-1">
                Fundamento central do <strong>Desafios PE</strong>: eliminar a subjetividade política na alocação de equipes operacionais.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Estratégias:</span>
              <button
                type="button"
                onClick={() => aplicarEstrategia('equilibrada')}
                className="btn btn-secondary btn-sm text-xs"
              >
                Equilibrada
              </button>
              <button
                type="button"
                onClick={() => aplicarEstrategia('seguranca')}
                className="btn btn-secondary btn-sm text-xs"
              >
                Foco em Vida
              </button>
              <button
                type="button"
                onClick={() => aplicarEstrategia('impacto')}
                className="btn btn-secondary btn-sm text-xs"
              >
                Alto Fluxo
              </button>
              <button
                type="button"
                onClick={restaurarPadrao}
                className="btn btn-secondary btn-sm text-xs text-muted"
                title="Restaurar parâmetros recomendados"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Barra de Distribuição de Pesos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Soma dos Pesos Ponderados:</span>
              <span className={totalPesos === 100 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                {totalPesos}% {totalPesos !== 100 && '(recalibrado proporcionalmente na matriz)'}
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex shadow-inner">
              <div style={{ width: `${(pesoRisco / (totalPesos || 1)) * 100}%` }} className="bg-rose-500 transition-all" title="Risco à Segurança e Vida" />
              <div style={{ width: `${(pesoImpacto / (totalPesos || 1)) * 100}%` }} className="bg-blue-600 transition-all" title="Impacto na População" />
              <div style={{ width: `${(pesoTempo / (totalPesos || 1)) * 100}%` }} className="bg-amber-500 transition-all" title="Tempo de Espera Acumulado" />
              <div style={{ width: `${(pesoAgravamento / (totalPesos || 1)) * 100}%` }} className="bg-teal-600 transition-all" title="Risco de Degradação / Agravamento" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Risco à Vida ({pesoRisco}%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Impacto Social ({pesoImpacto}%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Tempo de Espera ({pesoTempo}%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Potencial de Agravamento ({pesoAgravamento}%)</span>
            </div>
          </div>

          {/* Sliders dos Critérios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Risco */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <ShieldAlert size={16} className="text-rose-500" /> Risco à Segurança e Vida
                </span>
                <span className="text-sm font-bold text-primary font-mono tabular-nums">{pesoRisco}%</span>
              </div>
              <p className="text-xs text-muted">
                Perigo iminente de atropelamento, poste avariado, buraco profundo em via expressa ou fios caídos.
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoRisco}
                onChange={(e) => setPesoRisco(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* 2. Impacto */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Users size={16} className="text-blue-600" /> Impacto na População
                </span>
                <span className="text-sm font-bold text-primary font-mono tabular-nums">{pesoImpacto}%</span>
              </div>
              <p className="text-xs text-muted">
                Fluxo da localidade (corredores de ônibus, Centro, escolas e postos de saúde vs. ruas locais).
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoImpacto}
                onChange={(e) => setPesoImpacto(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* 3. Tempo */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Clock size={16} className="text-amber-500" /> Tempo de Espera
                </span>
                <span className="text-sm font-bold text-primary font-mono tabular-nums">{pesoTempo}%</span>
              </div>
              <p className="text-xs text-muted">
                Crescimento progressivo da pontuação com o passar dos dias em aberto, evitando esquecimento de demandas.
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoTempo}
                onChange={(e) => setPesoTempo(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* 4. Agravamento */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <AlertTriangle size={16} className="text-teal-600" /> Potencial de Degradação
                </span>
                <span className="text-sm font-bold text-primary font-mono tabular-nums">{pesoAgravamento}%</span>
              </div>
              <p className="text-xs text-muted">
                Tendência de deterioração rápida caso não haja intervenção (ex.: chuvas intensas, erosão pluvial).
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoAgravamento}
                onChange={(e) => setPesoAgravamento(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Simulador em Tempo Real */}
        <div className="card space-y-4 bg-slate-50/60 dark:bg-slate-900/40 border-primary/20">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Simulador em Tempo Real da Calibração
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              Validação Acadêmica
            </span>
          </div>
          <p className="text-xs text-muted">
            Ajuste os parâmetros de uma demanda teste para verificar instantaneamente a pontuação final (0 a 100) e o enquadramento:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-border">
              <label className="block text-xs font-medium text-muted mb-1">Risco (0-10): <strong className="text-foreground">{simRisco}</strong></label>
              <input
                type="range" min={0} max={10} value={simRisco}
                onChange={(e) => setSimRisco(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-border">
              <label className="block text-xs font-medium text-muted mb-1">Impacto (0-10): <strong className="text-foreground">{simImpacto}</strong></label>
              <input
                type="range" min={0} max={10} value={simImpacto}
                onChange={(e) => setSimImpacto(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-border">
              <label className="block text-xs font-medium text-muted mb-1">Dias em Aberto: <strong className="text-foreground">{simTempoDias}d</strong></label>
              <input
                type="range" min={0} max={60} value={simTempoDias}
                onChange={(e) => setSimTempoDias(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-border">
              <label className="block text-xs font-medium text-muted mb-1">Agravamento (0-10): <strong className="text-foreground">{simAgravamento}</strong></label>
              <input
                type="range" min={0} max={10} value={simAgravamento}
                onChange={(e) => setSimAgravamento(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Resultado do Simulador */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-border min-w-24">
                <span className="text-3xl font-black text-primary font-mono tabular-nums">{simulacao.pontuacao}</span>
                <span className="text-[10px] text-muted block uppercase tracking-wider font-semibold">de 100 pontos</span>
              </div>
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${PRIORIDADE_COLORS[simulacao.faixa]}`}>
                  Faixa de Prioridade: {PRIORIDADE_LABELS[simulacao.faixa]}
                </span>
                <p className="text-xs text-muted mt-1.5 leading-relaxed">
                  Classificação gerada automaticamente para os despachos operacionais.
                </p>
              </div>
            </div>

            <div className="text-xs text-muted space-y-1 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 border-border">
              <div className="font-semibold text-foreground text-[11px] uppercase tracking-wider mb-1">Composição do Escore:</div>
              {simulacao.detalhamento.map((d) => (
                <div key={d.criterio} className="flex justify-between gap-4">
                  <span>{d.criterio}:</span>
                  <span className="font-semibold text-foreground font-mono">+{d.contribuicao.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bloco 3: Dados Institucionais da Prefeitura */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={16} className="text-primary" />
            Parâmetros Institucionais e Ouvidoria Municipal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Nome da Instituição Municipal</label>
              <input
                type="text"
                className="input"
                value={nomeOrgao}
                onChange={(e) => setNomeOrgao(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">SLA Padrão de Atendimento (Dias Úteis)</label>
              <input
                type="number"
                min={1}
                max={60}
                className="input"
                value={slaPadraoDias}
                onChange={(e) => setSlaPadraoDias(parseInt(e.target.value) || 15)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Telefone da Ouvidoria / Suporte</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  className="input pl-9"
                  value={ouvidoriaTelefone}
                  onChange={(e) => setOuvidoriaTelefone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">E-mail Oficial da Ouvidoria</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  className="input pl-9"
                  value={ouvidoriaEmail}
                  onChange={(e) => setOuvidoriaEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="btn btn-primary btn-lg shadow-md"
            disabled={salvando}
          >
            <Save size={18} />
            {salvando ? 'Salvando Configurações...' : 'Salvar Alterações e Calibração'}
          </button>
        </div>
      </form>
    </div>
  );
}
