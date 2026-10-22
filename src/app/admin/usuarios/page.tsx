'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Filter, Edit3, Trash2, Shield,
  Building2, CheckCircle2, AlertCircle, Mail, UserCheck, ShieldAlert,
  Info, Check, KeyRound, Sparkles
} from 'lucide-react';
import { PageHeader, StatCard, Badge, EmptyState, ConfirmDialog } from '@/components/ui/Shared';
import { Modal } from '@/components/ui/Modal';
import {
  listarPerfis, criarPerfil, atualizarPerfil, excluirPerfil, listarSetores
} from '@/services/demandas';
import type { Profile, Setor, UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador Geral',
  gestor: 'Gestor Setorial',
  servidor: 'Atendente / Operacional',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Acesso total: gerencia configurações de pesos, setores, usuários e relatórios gerais.',
  gestor: 'Coordenação: tria, despacha e fiscaliza ordens de serviço vinculadas ao seu setor.',
  servidor: 'Execução: atualiza vistorias, relata andamento e registra conclusões de demandas.',
};

const ROLE_BADGE_STYLES: Record<UserRole, string> = {
  admin: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
  gestor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  servidor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
};

const ROLE_AVATAR_STYLES: Record<UserRole, string> = {
  admin: 'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-200',
  gestor: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200',
  servidor: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200',
};

export default function UsuariosPage() {
  const [perfis, setPerfis] = useState<Profile[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('');

  // Modais
  const [modalNovo, setModalNovo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [perfilSelecionado, setPerfilSelecionado] = useState<Profile | null>(null);
  const [confirmExcluir, setConfirmExcluir] = useState<string | null>(null);

  // Formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('servidor');
  const [setorId, setSetorId] = useState<string>('');
  const [ativo, setAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [perfisData, setoresData] = await Promise.all([
        listarPerfis().catch(() => []),
        listarSetores().catch(() => []),
      ]);
      setPerfis(perfisData);
      setSetores(setoresData);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(() => { carregarDados(); }, 0);
    return () => clearTimeout(id);
  }, [carregarDados]);

  const abrirModalNovo = () => {
    setNome('');
    setEmail('');
    setRole('servidor');
    setSetorId('');
    setAtivo(true);
    setModalNovo(true);
  };

  const abrirModalEditar = (perfil: Profile) => {
    setPerfilSelecionado(perfil);
    setNome(perfil.nome);
    setEmail(perfil.email);
    setRole(perfil.role);
    setSetorId(perfil.setor_id || '');
    setAtivo(perfil.ativo);
    setModalEditar(true);
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    setSalvando(true);
    try {
      await criarPerfil({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        role,
        setor_id: setorId || null,
      });
      setMensagem({ tipo: 'sucesso', texto: 'Servidor / Usuário cadastrado com sucesso!' });
      setModalNovo(false);
      await carregarDados();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Não foi possível cadastrar o usuário.';
      setMensagem({ tipo: 'erro', texto: msg });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfilSelecionado || !nome.trim()) return;

    setSalvando(true);
    try {
      await atualizarPerfil(perfilSelecionado.id, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        role,
        setor_id: setorId || null,
        ativo,
      });
      setMensagem({ tipo: 'sucesso', texto: 'Permissões e cadastro atualizados!' });
      setModalEditar(false);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível atualizar o usuário.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const handleToggleAtivo = async (perfil: Profile) => {
    try {
      await atualizarPerfil(perfil.id, { ativo: !perfil.ativo });
      await carregarDados();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExcluir = async (id: string) => {
    try {
      await excluirPerfil(id);
      setMensagem({ tipo: 'sucesso', texto: 'Acesso do usuário revogado e registro excluído com sucesso.' });
      setConfirmExcluir(null);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível excluir o usuário.' });
    } finally {
      setTimeout(() => setMensagem(null), 4000);
    }
  };

  const perfisFiltrados = perfis.filter((p) => {
    const matchesBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.email.toLowerCase().includes(busca.toLowerCase());
    const matchesRole = filtroRole ? p.role === filtroRole : true;
    return matchesBusca && matchesRole;
  });

  const totalAdmins = perfis.filter((p) => p.role === 'admin').length;
  const totalGestores = perfis.filter((p) => p.role === 'gestor').length;
  const totalServidores = perfis.filter((p) => p.role === 'servidor').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Gestão de Usuários e Permissões"
        description="Controle de acesso institucional dos servidores públicos da Prefeitura de Arcoverde"
        action={
          <button className="btn btn-primary" onClick={abrirModalNovo}>
            <Plus size={16} /> Novo Servidor / Usuário
          </button>
        }
      />

      {mensagem && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {mensagem.tipo === 'sucesso' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{mensagem.texto}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Usuários" value={perfis.length} icon={Users} color="text-primary" />
        <StatCard title="Administradores Gerais" value={totalAdmins} icon={Shield} color="text-indigo-600" />
        <StatCard title="Gestores Setoriais" value={totalGestores} icon={Building2} color="text-blue-600" />
        <StatCard title="Atendentes e Técnicos" value={totalServidores} icon={UserCheck} color="text-emerald-600" />
      </div>

      {/* Informative Guidance Card */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/20 dark:border-blue-900/60 flex items-start gap-3">
        <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed">
          <span className="font-semibold block mb-0.5">Hierarquia de Acesso Institucional</span>
          Os perfis definem a alçada de cada servidor: administradores controlam parâmetros e regras; gestores coordenam demandas atribuídas às suas respectivas secretarias; atendentes e servidores operam ordens de serviço em campo.
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Buscar por nome do servidor ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="sm:w-64">
          <select
            className="input"
            value={filtroRole}
            onChange={(e) => setFiltroRole(e.target.value)}
          >
            <option value="">Todos os níveis de acesso</option>
            <option value="admin">Administrador Geral</option>
            <option value="gestor">Gestor Setorial</option>
            <option value="servidor">Atendente / Operacional</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-14 animate-shimmer rounded-lg" />
            ))}
          </div>
        ) : perfisFiltrados.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="Nenhum usuário encontrado"
              description="Cadastre um novo usuário ou altere os termos da pesquisa."
              action={
                <button className="btn btn-secondary mt-2" onClick={abrirModalNovo}>
                  <Plus size={16} /> Cadastrar Servidor
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* Visualização Mobile: Cards de Servidores */}
            <div className="block md:hidden space-y-3">
              {perfisFiltrados.map((perfil) => {
                const setorVinculado = setores.find((s) => s.id === perfil.setor_id);
                const iniciais = perfil.nome
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((n) => n[0].toUpperCase())
                  .join('');

                return (
                  <div key={perfil.id} className="card p-4 space-y-3 border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 border shadow-xs ${ROLE_AVATAR_STYLES[perfil.role]}`}>
                          {iniciais || perfil.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{perfil.nome}</h4>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                            <Mail size={11} className="shrink-0 text-slate-400" />
                            <span className="truncate">{perfil.email}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleAtivo(perfil)}
                        className="cursor-pointer shrink-0"
                      >
                        {perfil.ativo ? (
                          <Badge text="Ativo" color="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]" />
                        ) : (
                          <Badge text="Inativo" color="bg-slate-100 text-slate-600 border-slate-200 text-[10px]" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ROLE_BADGE_STYLES[perfil.role]}`}>
                        <Shield size={11} /> {ROLE_LABELS[perfil.role]}
                      </span>

                      <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                        {setorVinculado ? setorVinculado.nome : 'Acesso Geral'}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        className="btn btn-secondary btn-sm text-xs py-1.5 px-3 flex-1 justify-center"
                        onClick={() => abrirModalEditar(perfil)}
                      >
                        <Edit3 size={13} /> Editar Servidor
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-xs p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => setConfirmExcluir(perfil.id)}
                        title="Revogar Acesso"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visualização Desktop: Tabela */}
            <div className="hidden md:block table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Servidor / Usuário</th>
                    <th>Nível de Acesso</th>
                    <th>Secretaria / Setor Vinculado</th>
                    <th>Data de Cadastro</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {perfisFiltrados.map((perfil) => {
                    const setorVinculado = setores.find((s) => s.id === perfil.setor_id);
                    const iniciais = perfil.nome
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0].toUpperCase())
                      .join('');

                    return (
                      <tr key={perfil.id} className="hover:bg-surface-hover transition-colors">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 border shadow-xs ${ROLE_AVATAR_STYLES[perfil.role]}`}>
                              {iniciais || perfil.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-sm">{perfil.nome}</div>
                              <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <Mail size={12} className="shrink-0" /> {perfil.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_BADGE_STYLES[perfil.role]}`}>
                            <Shield size={12} /> {ROLE_LABELS[perfil.role]}
                          </span>
                        </td>
                        <td>
                          {setorVinculado ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                              <Building2 size={13} className="text-muted shrink-0" />
                              <span>{setorVinculado.nome}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted italic">Acesso Institucional Amplo</span>
                          )}
                        </td>
                        <td className="text-xs text-muted tabular-nums">
                          {new Date(perfil.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleAtivo(perfil)}
                            title="Clique para alternar status do usuário"
                            className="cursor-pointer focus-ring rounded-full"
                          >
                            {perfil.ativo ? (
                              <Badge text="Ativo" color="bg-emerald-50 text-emerald-700 border-emerald-200" />
                            ) : (
                              <Badge text="Inativo" color="bg-slate-100 text-slate-600 border-slate-200" />
                            )}
                          </button>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              className="btn btn-secondary p-2 text-xs"
                              onClick={() => abrirModalEditar(perfil)}
                              title="Editar Usuário"
                              aria-label={`Editar ${perfil.nome}`}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              className="btn btn-secondary p-2 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                              onClick={() => setConfirmExcluir(perfil.id)}
                              title="Revogar Acesso"
                              aria-label={`Excluir ${perfil.nome}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL: Novo Usuário */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Cadastrar Servidor / Usuário" size="md">
        <form onSubmit={handleSalvarNovo} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ex.: Maria Albuquerque Santos"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              E-mail *
            </label>
            <input
              type="email"
              className="input"
              placeholder="servidor@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-muted mt-1">Utilize um e-mail válido para login e notificações do sistema.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Nível de Acesso (Papel) *
            </label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
            >
              <option value="servidor">Atendente / Operacional — Atendimento e execução em campo</option>
              <option value="gestor">Gestor Setorial — Coordenação e despacho da secretaria</option>
              <option value="admin">Administrador Geral — Acesso irrestrito a configurações</option>
            </select>
            <p className="text-xs text-muted mt-1">{ROLE_DESCRIPTIONS[role]}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Secretaria / Setor Vinculado
            </label>
            <select
              className="input"
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
            >
              <option value="">Nenhum (Acesso geral / Ouvidoria Central)</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">Obrigatório para gestores setoriais filtrarem suas demandas.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" className="btn btn-secondary" onClick={() => setModalNovo(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando || !nome.trim() || !email.trim()}>
              {salvando ? 'Cadastrando...' : 'Cadastrar Servidor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Editar Usuário */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar Servidor" size="md">
        <form onSubmit={handleSalvarEdicao} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              E-mail *
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Nível de Acesso (Papel) *
            </label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
            >
              <option value="servidor">Atendente / Operacional</option>
              <option value="gestor">Gestor Setorial</option>
              <option value="admin">Administrador Geral</option>
            </select>
            <p className="text-xs text-muted mt-1">{ROLE_DESCRIPTIONS[role]}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Secretaria / Setor Vinculado
            </label>
            <select
              className="input"
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
            >
              <option value="">Nenhum (Acesso geral / Ouvidoria Central)</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-border">
            <input
              type="checkbox"
              id="usuarioAtivo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="accent-primary h-4 w-4 rounded cursor-pointer"
            />
            <label htmlFor="usuarioAtivo" className="text-xs font-medium cursor-pointer text-foreground">
              Conta ativa no Arcoverde Conecta (permite acesso ao painel administrativo)
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
        title="Revogar Acesso do Usuário"
        message="Tem certeza de que deseja revogar o acesso e desativar este usuário? O histórico de atendimentos e despachos efetuados por ele será integralmente preservado para auditoria."
      />
    </div>
  );
}
