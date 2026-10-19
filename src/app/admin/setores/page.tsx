'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, Users, AlertCircle, ShieldAlert, Sparkles
} from 'lucide-react';
import { PageHeader, StatCard, Badge, EmptyState, ConfirmDialog } from '@/components/ui/Shared';
import { Modal } from '@/components/ui/Modal';
import {
  listarSetores, criarSetor, atualizarSetor, excluirSetor,
  listarPerfis, listarDemandas
} from '@/services/demandas';
import { MOCK_SETORES } from '@/services/mockData';
import type { Setor, Profile, Demanda } from '@/types';

export default function SetoresPage() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [perfis, setPerfis] = useState<Profile[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Modais
  const [modalNovo, setModalNovo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [setorSelecionado, setSetorSelecionado] = useState<Setor | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<string | null>(null);

  // Formulário
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [responsavelId, setResponsavelId] = useState<string>('');
  const [ativo, setAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [setoresData, perfisData, demandasData] = await Promise.all([
        listarSetores(),
        listarPerfis(),
        listarDemandas({ por_pagina: 100 }),
      ]);
      setSetores(setoresData);
      setPerfis(perfisData);
      setDemandas(demandasData.demandas);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const abrirModalNovo = () => {
    setNome('');
    setDescricao('');
    setResponsavelId('');
    setAtivo(true);
    setModalNovo(true);
  };

  const abrirModalEditar = (setor: Setor) => {
    setSetorSelecionado(setor);
    setNome(setor.nome);
    setDescricao(setor.descricao || '');
    setResponsavelId(setor.responsavel_id || '');
    setAtivo(setor.ativo);
    setModalEditar(true);
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setSalvando(true);
    try {
      await criarSetor(nome.trim(), descricao.trim() || undefined, responsavelId || null);
      setMensagem({ tipo: 'sucesso', texto: 'Secretaria/Setor cadastrado com sucesso!' });
      setModalNovo(false);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível cadastrar o setor.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorSelecionado || !nome.trim()) return;

    setSalvando(true);
    try {
      await atualizarSetor(setorSelecionado.id, {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        responsavel_id: responsavelId || null,
        ativo,
      });
      setMensagem({ tipo: 'sucesso', texto: 'Setor atualizado com sucesso!' });
      setModalEditar(false);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível atualizar o setor.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const handleToggleAtivo = async (setor: Setor) => {
    try {
      await atualizarSetor(setor.id, { ativo: !setor.ativo });
      await carregarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExcluir = async (id: string) => {
    try {
      await excluirSetor(id);
      setMensagem({ tipo: 'sucesso', texto: 'Setor removido com sucesso.' });
      setConfirmExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível excluir o setor.' });
    } finally {
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const setoresFiltrados = setores.filter(
    (s) =>
      s.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (s.descricao && s.descricao.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleCarregarSetoresPadrao = async () => {
    setSalvando(true);
    try {
      for (const s of MOCK_SETORES) {
        await criarSetor(s.nome, s.descricao || undefined);
      }
      setMensagem({ tipo: 'sucesso', texto: 'Secretarias municipais de Arcoverde cadastradas no banco com sucesso!' });
      await carregarDados();
    } catch (err: unknown) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível carregar as secretarias no banco.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 5000);
    }
  };

  const getDemandasCount = (setorId: string) => {
    return demandas.filter((d) => d.setor_id === setorId && d.status !== 'concluida' && d.status !== 'cancelada').length;
  };

  const getResponsavelNome = (respId: string | null) => {
    if (!respId) return null;
    const prof = perfis.find((p) => p.id === respId);
    return prof ? prof.nome : null;
  };

  const totalAtivos = setores.filter((s) => s.ativo).length;
  const totalComGestor = setores.filter((s) => s.responsavel_id).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Secretarias e Órgãos Municipais"
        description="Gestão das secretarias e departamentos responsáveis pela execução de serviços públicos em Arcoverde"
        badge={`${setores.length} órgão(s)`}
        action={
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm text-xs gap-1.5 shadow-sm" onClick={abrirModalNovo}>
              <Plus size={14} /> Novo Setor
            </button>
          </div>
        }
      />

      {mensagem && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-2.5 animate-fade-in text-xs shadow-xs ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
          <span className="font-medium">{mensagem.texto}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Órgãos" value={setores.length} icon={Building2} color="text-blue-600" subtitle="Cadastrados no sistema" />
        <StatCard title="Órgãos em Operação" value={totalAtivos} icon={CheckCircle2} color="text-emerald-600" subtitle="Ativos para despacho" />
        <StatCard title="Com Gestor Setorial" value={totalComGestor} icon={Users} color="text-sky-600" subtitle="Responsáveis atribuídos" />
        <StatCard title="Demandas em Andamento" value={demandas.filter((d) => d.setor_id && d.status !== 'concluida').length} icon={Clock} color="text-amber-600" subtitle="Sob execução direta" />
      </div>

      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          className="input pl-10 text-xs"
          placeholder="Buscar secretaria ou setor por nome ou competências..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Tabela de Setores */}
      {loading ? (
        <div className="space-y-2">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-14 animate-shimmer rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : setoresFiltrados.length === 0 ? (
        <div className="card text-center py-12">
          <EmptyState
            icon={Building2}
            title="Nenhum setor localizado"
            description="Cadastre uma nova secretaria municipal ou carregue os órgãos oficiais de Arcoverde."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <button className="btn btn-secondary btn-sm text-xs" onClick={abrirModalNovo}>
                  <Plus size={14} /> Cadastrar Secretaria
                </button>
                <button className="btn btn-primary btn-sm text-xs gap-1.5" onClick={handleCarregarSetoresPadrao} disabled={salvando}>
                  <Sparkles size={14} /> Carregar Secretarias de Arcoverde
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Órgão / Secretaria Municipal</th>
                <th>Competências e Atuação</th>
                <th>Gestor Responsável</th>
                <th>Demandas em Aberto</th>
                <th>Status</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {setoresFiltrados.map((setor) => {
                const gestorNome = getResponsavelNome(setor.responsavel_id);
                const pendentes = getDemandasCount(setor.id);

                return (
                  <tr key={setor.id} className="hover:bg-slate-50/80 text-xs">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                          <Building2 size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{setor.nome}</div>
                          <div className="text-[11px] text-slate-400 font-mono">ID: {setor.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-slate-600 max-w-xs truncate">
                      {setor.descricao || 'Sem descrição cadastrada'}
                    </td>
                    <td>
                      {gestorNome ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {gestorNome.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">{gestorNome}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Não atribuído</span>
                      )}
                    </td>
                    <td>
                      {pendentes > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={11} /> {pendentes} em aberto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 size={11} /> Em dia
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleAtivo(setor)}
                        title="Clique para alternar status operacional"
                        className="cursor-pointer"
                      >
                        {setor.ativo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Inativo
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-sm p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          onClick={() => abrirModalEditar(setor)}
                          title="Editar Setor"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => setConfirmExcluir(setor.id)}
                          title="Excluir Setor"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Novo Setor */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Cadastrar Nova Secretaria Municipal" size="md">
        <form onSubmit={handleSalvarNovo} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome do Setor / Secretaria *</label>
            <input
              type="text"
              className="input text-xs"
              placeholder="Ex.: Secretaria de Serviços Públicos e Obras"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Descrição e Competências</label>
            <textarea
              className="input text-xs"
              rows={3}
              placeholder="Descreva as atribuições principais desta secretaria no atendimento às demandas de Arcoverde..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gestor Responsável</label>
            <select
              className="input text-xs"
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
            >
              <option value="">Nenhum gestor vinculado</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" className="btn btn-secondary text-xs" onClick={() => setModalNovo(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-medium" disabled={salvando || !nome.trim()}>
              {salvando ? 'Gravando...' : 'Cadastrar Secretaria'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Editar Setor */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar Secretaria Municipal" size="md">
        <form onSubmit={handleSalvarEdicao} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nome do Setor / Secretaria *</label>
            <input
              type="text"
              className="input text-xs"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Descrição e Competências</label>
            <textarea
              className="input text-xs"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gestor Responsável</label>
            <select
              className="input text-xs"
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
            >
              <option value="">Nenhum gestor vinculado</option>
              {perfis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="setorAtivo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="accent-blue-600 h-4 w-4 rounded"
            />
            <label htmlFor="setorAtivo" className="text-xs font-medium text-slate-700 cursor-pointer">
              Secretaria ativa para recebimento de despachos
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" className="btn btn-secondary text-xs" onClick={() => setModalEditar(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary text-xs font-medium" disabled={salvando || !nome.trim()}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmar Exclusão */}
      <ConfirmDialog
        open={!!confirmExcluir}
        onClose={() => setConfirmExcluir(null)}
        onConfirm={() => confirmExcluir && handleExcluir(confirmExcluir)}
        title="Excluir Setor"
        message="Tem certeza de que deseja remover esta secretaria? As demandas já registradas continuarão no sistema, mas perderão a vinculação direta com este órgão."
        confirmLabel="Sim, Excluir"
        variant="danger"
      />
    </div>
  );
}
