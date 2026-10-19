'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Filter, Edit3, Trash2, Shield,
  Building2, CheckCircle2, AlertCircle, Mail, UserCheck, ShieldAlert
} from 'lucide-react';
import { PageHeader, StatCard, Badge, EmptyState, ConfirmDialog } from '@/components/ui/Shared';
import { Modal } from '@/components/ui/Modal';
import {
  listarPerfis, criarPerfil, atualizarPerfil, excluirPerfil, listarSetores
} from '@/services/demandas';
import type { Profile, Setor, UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor Setorial',
  servidor: 'Atendente / Servidor',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  gestor: 'bg-sky-50 text-sky-700 border-sky-200',
  servidor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
        listarPerfis(),
        listarSetores(),
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
    carregarDados();
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
      setMensagem({ tipo: 'sucesso', texto: 'Usuário cadastrado com sucesso!' });
      setModalNovo(false);
      await carregarDados();
    } catch (err) {
      console.error(err);
      setMensagem({ tipo: 'erro', texto: 'Não foi possível cadastrar o usuário.' });
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
      setMensagem({ tipo: 'sucesso', texto: 'Usuário atualizado com sucesso!' });
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
      setMensagem({ tipo: 'sucesso', texto: 'Usuário excluído com sucesso.' });
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
        title="Gestão de Usuários"
        description="Controle de acesso, servidores municipais e permissões no Arcoverde Conecta"
        action={
          <button className="btn btn-primary" onClick={abrirModalNovo}>
            <Plus size={16} /> Novo Usuário
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
        <StatCard title="Total de Usuários" value={perfis.length} icon={Users} />
        <StatCard title="Administradores" value={totalAdmins} icon={Shield} color="text-purple-600" />
        <StatCard title="Gestores Setoriais" value={totalGestores} icon={Building2} color="text-blue-600" />
        <StatCard title="Atendentes / Servidores" value={totalServidores} icon={UserCheck} color="text-emerald-600" />
      </div>

      {/* Filters and Search */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="sm:w-56">
          <select
            className="input"
            value={filtroRole}
            onChange={(e) => setFiltroRole(e.target.value)}
          >
            <option value="">Todos os papéis</option>
            <option value="admin">Administradores</option>
            <option value="gestor">Gestores Setoriais</option>
            <option value="servidor">Atendentes / Servidores</option>
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
              description="Cadastre um novo usuário ou altere os filtros de pesquisa."
              action={
                <button className="btn btn-secondary mt-2" onClick={abrirModalNovo}>
                  <Plus size={16} /> Cadastrar Usuário
                </button>
              }
            />
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Servidor / Usuário</th>
                  <th>Nível de Acesso</th>
                  <th>Secretaria / Setor</th>
                  <th>Cadastrado em</th>
                  <th>Status</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {perfisFiltrados.map((perfil) => {
                  const setorVinculado = setores.find((s) => s.id === perfil.setor_id);

                  return (
                    <tr key={perfil.id} className="hover:bg-surface-hover transition-colors">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-primary-light text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                            {perfil.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{perfil.nome}</div>
                            <div className="text-xs text-muted flex items-center gap-1">
                              <Mail size={11} /> {perfil.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[perfil.role]}`}>
                          <Shield size={12} /> {ROLE_LABELS[perfil.role]}
                        </span>
                      </td>
                      <td>
                        {setorVinculado ? (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <Building2 size={14} className="text-muted" />
                            {setorVinculado.nome}
                          </div>
                        ) : (
                          <span className="text-xs text-muted italic">Geral / Não atribuído</span>
                        )}
                      </td>
                      <td className="text-xs text-muted">
                        {new Date(perfil.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleAtivo(perfil)}
                          title="Clique para alternar status"
                          className="cursor-pointer"
                        >
                          {perfil.ativo ? (
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
                            onClick={() => abrirModalEditar(perfil)}
                            title="Editar Usuário"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            className="btn btn-secondary p-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                            onClick={() => setConfirmExcluir(perfil.id)}
                            title="Excluir Usuário"
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

      {/* MODAL: Novo Usuário */}
      <Modal open={modalNovo} onClose={() => setModalNovo(false)} title="Cadastrar Servidor / Usuário" size="md">
        <form onSubmit={handleSalvarNovo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome Completo *</label>
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
            <label className="block text-sm font-medium text-foreground mb-1">E-mail Institucional *</label>
            <input
              type="email"
              className="input"
              placeholder="servidor@arcoverde.pe.gov.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Papel / Nível de Acesso *</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
            >
              <option value="servidor">Atendente / Servidor (Triagem e atendimento)</option>
              <option value="gestor">Gestor Setorial (Coordenação da secretaria)</option>
              <option value="admin">Administrador Geral (Acesso irrestrito)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Secretaria / Setor Vinculado</label>
            <select
              className="input"
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
            >
              <option value="">Nenhum (Acesso geral ou Ouvidoria)</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" className="btn btn-secondary" onClick={() => setModalNovo(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando || !nome.trim() || !email.trim()}>
              {salvando ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Editar Usuário */}
      <Modal open={modalEditar} onClose={() => setModalEditar(false)} title="Editar Servidor" size="md">
        <form onSubmit={handleSalvarEdicao} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome Completo *</label>
            <input
              type="text"
              className="input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">E-mail Institucional *</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Papel / Nível de Acesso *</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              required
            >
              <option value="servidor">Atendente / Servidor</option>
              <option value="gestor">Gestor Setorial</option>
              <option value="admin">Administrador Geral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Secretaria / Setor Vinculado</label>
            <select
              className="input"
              value={setorId}
              onChange={(e) => setSetorId(e.target.value)}
            >
              <option value="">Nenhum (Acesso geral ou Ouvidoria)</option>
              {setores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usuarioAtivo"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="accent-primary h-4 w-4 rounded"
            />
            <label htmlFor="usuarioAtivo" className="text-sm font-medium cursor-pointer">
              Conta de usuário ativa no sistema
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
        title="Excluir Usuário"
        message="Tem certeza de que deseja revogar o acesso e excluir este usuário? O histórico de atendimentos e despachos efetuados por ele será preservado."
      />
    </div>
  );
}
