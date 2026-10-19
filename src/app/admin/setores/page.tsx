'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, Plus, Search, Edit3, Trash2, CheckCircle2,
  XCircle, Clock, Users, AlertCircle, ShieldAlert
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
      setMensagem({ tipo: 'sucesso', texto: 'Setor cadastrado com sucesso!' });
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
        title="Gestão de Setores"
        description="Secretarias e órgãos municipais responsáveis pelo atendimento de demandas públicas de Arcoverde"
        action={
          <button className="btn btn-primary" onClick={abrirModalNovo}>
            <Plus size={16} /> Novo Setor
          </button>
        }
      />

      {mensagem && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
            mensagem.tipo === 'sucesso'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{mensagem.texto}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Setores" value={setores.length} icon={Building2} />
        <StatCard title="Setores Ativos" value={totalAtivos} icon={CheckCircle2} color="text-success" />
        <StatCard title="Com Gestor Atribuído" value={totalComGestor} icon={Users} color="text-primary" />
        <StatCard title="Demandas Vinculadas" value={demandas.filter((d) => d.setor_id).length} icon={Clock} color="text-orange-500" />
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Buscar secretaria ou setor por nome ou competências..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* Sectors Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-14 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : setoresFiltrados.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Building2}
              title="Nenhum setor encontrado"
              description="Cadastre uma nova secretaria municipal ou carregue os órgãos padrão de Arcoverde."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  <button className="btn btn-secondary btn-sm text-xs" onClick={abrirModalNovo}>
                    <Plus size={14} /> Cadastrar Setor
                  </button>
                  <button className="btn btn-primary btn-sm text-xs" onClick={handleCarregarSetoresPadrao} disabled={salvando}>
                    <Building2 size={14} /> Carregar Secretarias de Arcoverde
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
                  <th>Órgão / Secretaria</th>
                  <th>Competências / Atuação</th>
                  <th>Gestor Responsável</th>
                  <th>Demandas Pendentes</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {setoresFiltrados.map((setor) => {
                  const gestorNome = getResponsavelNome(setor.responsavel_id);
                  const pendentes = getDemandasCount(setor.id);

                  return (
                    <tr key={setor.id} className="hover:bg-surface-hover transition-colors">
                      <td className="font-semibold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary-100 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            <Building2 size={16} />
                          </div>
                          <div>
                            <div className="font-semibold">{setor.nome}</div>
                            <div className="text-xs text-muted">ID: {setor.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-muted max-w-xs truncate">
                        {setor.descricao || 'Sem descrição cadastrada'}
                      </td>
                      <td>
                        {gestorNome ? (
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                              {gestorNome.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{gestorNome}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">Não definido</span>
                        )}
                      </td>
                      <td>
                        {pendentes > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            <Clock size={12} /> {pendentes} em aberto
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircle2 size={12} /> Em dia
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleAtivo(setor)}
                          title="Clique para alternar status"
                          className="cursor-pointer"
                        >
                          {setor.ativo ? (
                            <Badge text="Ativo" color="bg-green-100 text-green-800 border-green-200" />
                          ) : (
                            <Badge text="Inativo" color="bg-gray-100 text-gray-700 border-gray-200" />
                          )}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="btn btn-secondary p-2"
                            onClick={() => abrirModalEditar(setor)}
                            title="Editar Setor"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="btn btn-secondary p-2 text-red-600 hover:bg-red-50 hover:border-red-200"
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
      </div>

      {/* MODAL: Novo Setor */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Cadastrar Novo Setor" size="md">
        <form onSubmit={handleSalvarNovo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome do Setor / Secretaria *</label>
            <input
              type="text"
              className="input"
              placeholder="Ex.: Secretaria de Saúde ou Defesa Civil"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descrição / Competências</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Descreva as atribuições principais desta secretaria no atendimento às demandas..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Gestor Responsável</label>
            <select
              className="input"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" className="btn btn-secondary" onClick={() => setModalNovo(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando || !nome.trim()}>
              {salvando ? 'Salvando...' : 'Cadastrar Setor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Editar Setor */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar Setor" size="md">
        <form onSubmit={handleSalvarEdicao} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome do Setor / Secretaria *</label>
            <input
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descrição / Competências</label>
            <textarea
              className="input"
              rows={3}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Gestor Responsável</label>
            <select
              className="input"
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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="setorAtivo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="accent-primary h-4 w-4 rounded"
            />
            <label htmlFor="setorAtivo" className="text-sm font-medium cursor-pointer">
              Setor ativo no sistema
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" className="btn btn-secondary" onClick={() => setModalEditar(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando || !nome.trim()}>
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
        message="Tem certeza de que deseja remover este setor? Demandas associadas a ele não serão apagadas, mas perderão a vinculação com a secretaria."
      />
    </div>
  );
}
