'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Settings, Sliders, ShieldAlert, Clock, Users, AlertTriangle,
  Save, RotateCcw, CheckCircle2, Info, Building2, Phone, Mail,
  Calculator, Sparkles
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

      setMensagem('Configurações e pesos de priorização atualizados com sucesso!');
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
        title="Configurações do Sistema"
        description="Ajuste os parâmetros municipais e configure os pesos do Sistema Inteligente de Priorização"
      />

      {mensagem && (
        <div className="p-4 rounded-xl bg-green-50 text-green-800 border border-green-200 flex items-center gap-3 animate-fade-in">
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
                Pesos do Algoritmo de Priorização (0 a 100 pts)
              </h3>
              <p className="text-xs text-muted mt-1">
                A pontuação das demandas públicas é calculada ponderando os 4 critérios fundamentais abaixo.
              </p>
            </div>
            <button
              type="button"
              onClick={restaurarPadrao}
              className="btn btn-secondary btn-sm self-start text-xs"
            >
              <RotateCcw size={14} /> Restaurar Padrões
            </button>
          </div>

          {/* Barra de Distribuição de Pesos */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span>Distribuição Total dos Pesos:</span>
              <span className={totalPesos === 100 ? 'text-success' : 'text-orange-500 font-bold'}>
                {totalPesos}% {totalPesos !== 100 && '(normalizado automaticamente)'}
              </span>
            </div>
            <div className="h-3 rounded-full bg-border overflow-hidden flex">
              <div style={{ width: `${(pesoRisco / (totalPesos || 1)) * 100}%` }} className="bg-red-500 transition-all" title="Risco à Segurança" />
              <div style={{ width: `${(pesoImpacto / (totalPesos || 1)) * 100}%` }} className="bg-purple-600 transition-all" title="Impacto na População" />
              <div style={{ width: `${(pesoTempo / (totalPesos || 1)) * 100}%` }} className="bg-amber-500 transition-all" title="Tempo de Espera" />
              <div style={{ width: `${(pesoAgravamento / (totalPesos || 1)) * 100}%` }} className="bg-blue-500 transition-all" title="Risco de Agravamento" />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs mt-2 text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Risco ({pesoRisco}%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-600" /> Impacto ({pesoImpacto}%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Tempo ({pesoTempo}%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Agravamento ({pesoAgravamento}%)</span>
            </div>
          </div>

          {/* Sliders dos Critérios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Risco */}
            <div className="p-4 rounded-xl bg-surface-hover border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-500" /> Risco à Segurança e Vida
                </span>
                <span className="text-sm font-bold text-primary font-mono">{pesoRisco}%</span>
              </div>
              <p className="text-xs text-muted">
                Danos a pedestres, risco iminente de acidente de trânsito, fios desencapados ou colapso estrutural.
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoRisco}
                onChange={(e) => setPesoRisco(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* 2. Impacto */}
            <div className="p-4 rounded-xl bg-surface-hover border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Users size={16} className="text-purple-600" /> Impacto na População
                </span>
                <span className="text-sm font-bold text-primary font-mono">{pesoImpacto}%</span>
              </div>
              <p className="text-xs text-muted">
                Densidade do bairro, vias arteriais e centros de comércio (ex: Centro, São Cristóvão) vs. ruas locais.
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoImpacto}
                onChange={(e) => setPesoImpacto(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* 3. Tempo */}
            <div className="p-4 rounded-xl bg-surface-hover border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" /> Tempo de Espera
                </span>
                <span className="text-sm font-bold text-primary font-mono">{pesoTempo}%</span>
              </div>
              <p className="text-xs text-muted">
                Garante que solicitações antigas ganhem prioridade progressiva automaticamente até 90 dias.
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoTempo}
                onChange={(e) => setPesoTempo(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* 4. Agravamento */}
            <div className="p-4 rounded-xl bg-surface-hover border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle size={16} className="text-blue-500" /> Potencial de Degradação
                </span>
                <span className="text-sm font-bold text-primary font-mono">{pesoAgravamento}%</span>
              </div>
              <p className="text-xs text-muted">
                Velocidade com que o problema tende a piorar se não houver intervenção (ex: erosão, chuvas).
              </p>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={pesoAgravamento}
                onChange={(e) => setPesoAgravamento(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Simulador em Tempo Real */}
        <div className="card space-y-4 bg-gradient-to-br from-surface to-primary-50/40">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Simulador em Tempo Real dos Novos Pesos
            </h3>
          </div>
          <p className="text-xs text-muted">
            Mova os valores de teste abaixo para verificar instantaneamente como as demandas serão classificadas pelo algoritmo com os pesos atuais:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Risco (0-10): {simRisco}</label>
              <input
                type="range" min={0} max={10} value={simRisco}
                onChange={(e) => setSimRisco(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Impacto (0-10): {simImpacto}</label>
              <input
                type="range" min={0} max={10} value={simImpacto}
                onChange={(e) => setSimImpacto(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Dias em Aberto: {simTempoDias}d</label>
              <input
                type="range" min={0} max={60} value={simTempoDias}
                onChange={(e) => setSimTempoDias(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Agravamento (0-10): {simAgravamento}</label>
              <input
                type="range" min={0} max={10} value={simAgravamento}
                onChange={(e) => setSimAgravamento(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          {/* Resultado do Simulador */}
          <div className="p-4 rounded-xl bg-white border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <span className="text-3xl font-black text-primary font-mono">{simulacao.pontuacao}</span>
                <span className="text-xs text-muted block -mt-1">/ 100 pontos</span>
              </div>
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${PRIORIDADE_COLORS[simulacao.faixa]}`}>
                  Faixa: {PRIORIDADE_LABELS[simulacao.faixa]}
                </span>
                <p className="text-xs text-muted mt-1">
                  Classificação automática gerada para a triagem e painel de prioridades.
                </p>
              </div>
            </div>

            <div className="text-xs text-muted space-y-0.5 border-l sm:pl-4 border-border">
              {simulacao.detalhamento.map((d) => (
                <div key={d.criterio} className="flex justify-between gap-4">
                  <span>{d.criterio}:</span>
                  <span className="font-semibold text-foreground">+{d.contribuicao.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bloco 3: Dados Institucionais da Prefeitura */}
        <div className="card space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Building2 size={16} className="text-primary" />
            Parâmetros Institucionais e Ouvidoria
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Nome da Instituição Municipal</label>
              <input
                type="text"
                className="input"
                value={nomeOrgao}
                onChange={(e) => setNomeOrgao(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">SLA Padrão de Atendimento (Dias Úteis)</label>
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
              <label className="block text-xs font-medium text-muted mb-1">Telefone da Ouvidoria / Suporte</label>
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
              <label className="block text-xs font-medium text-muted mb-1">E-mail Oficial da Ouvidoria</label>
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
            {salvando ? 'Salvando Configurações...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
