'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, Eye, EyeOff, ArrowLeft, Mail, Lock, AlertCircle,
  CheckCircle2, Building2, Check, Sparkles, FileText, BarChart3, User
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const [modo, setModo] = useState<'login' | 'cadastro' | 'recuperar'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErro('E-mail ou senha incorretos.');
        } else {
          setErro(error.message);
        }
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setErro('Falha ao comunicar com o serviço de autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const emailLimpo = email.trim().toLowerCase();

      // Cadastra o usuário no Supabase Auth.
      // O perfil no banco é criado automaticamente pelo trigger handle_new_user com a role fixa 'servidor'.
      const { data, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
          },
        },
      });

      if (error) {
        setErro(error.message);
        return;
      }

      if (data.session) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setSucesso('Conta criada com sucesso! Você já pode entrar com seu e-mail e senha.');
      }
    } catch {
      setErro('Falha ao processar o cadastro de servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin`,
      });

      if (error) {
        setErro(error.message);
        return;
      }

      setSucesso('Instruções de redefinição de senha enviadas para o e-mail informado.');
    } catch {
      setErro('Erro ao processar solicitação de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleEntrarDemo = () => {
    document.cookie = 'ac_demo_auth=true; path=/; max-age=86400; SameSite=Lax';
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-4 sm:py-10">
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
          {/* Coluna Institucional / Informativa */}
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-12 bg-linear-to-b from-slate-900 to-slate-950 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
            <div>
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm sm:text-base tracking-wide shadow-lg shadow-blue-600/30">
                  AC
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                    Arcoverde Conecta
                  </h1>
                  <p className="text-xs text-slate-400">
                    Prefeitura Municipal de Arcoverde • PE
                  </p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/50 text-blue-300 text-xs font-medium">
                  <Sparkles size={13} className="text-blue-400" />
                  Solução para o Desafios PE
                </div>
                <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                  Gestão inteligente e priorização de serviços públicos municipais
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Plataforma integrada de zeladoria urbana que centraliza demandas da população,
                  aplica algoritmo multicritério de priorização e acelera o despacho para as secretarias.
                </p>
              </div>

              {/* Destaques do Projeto */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    title: 'Priorização Algorítmica',
                    desc: 'Cálculo ponderado por risco, impacto populacional, tempo de espera e agravamento.',
                  },
                  {
                    title: 'Integração Intersetorial',
                    desc: 'Despacho automatizado entre Obras, Iluminação, Limpeza Urbana e Defesa Civil.',
                  },
                  {
                    title: 'Transparência Ativa',
                    desc: 'Acompanhamento por protocolo e painel de indicadores abertos à população.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 sm:gap-3 text-xs">
                    <div className="h-5 w-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                      <Check size={12} />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200">{item.title}:</span>{' '}
                      <span className="text-slate-400">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>Porta do Sertão Pernambucano</span>
              <span>Ambiente Seguro SSL</span>
            </div>
          </div>

          {/* Coluna do Formulário de Acesso */}
          <div className="lg:col-span-6 p-5 sm:p-8 lg:p-12 bg-white flex flex-col justify-center">
            <div className="max-w-md w-full mx-auto">
              {modo === 'login' ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Acesso ao Painel de Servidores
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Informe suas credenciais para gerenciar demandas e secretarias.
                    </p>
                  </div>

                  {erro && (
                    <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 animate-fade-in">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                      <span>{erro}</span>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        E-mail
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          className="input pl-10 text-sm"
                          placeholder="servidor@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Senha de Acesso
                        </label>
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => { setModo('recuperar'); setErro(''); setSucesso(''); }}
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={mostrarSenha ? 'text' : 'password'}
                          className="input pl-10 pr-10 text-sm"
                          placeholder="••••••••"
                          value={senha}
                          onChange={(e) => setSenha(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                        >
                          {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="btn btn-primary w-full py-2.5 font-medium shadow-md shadow-blue-600/20"
                        disabled={loading}
                      >
                        {loading ? 'Validando Acesso...' : 'Acessar Painel de Gestão'}
                      </button>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => { setModo('cadastro'); setErro(''); setSucesso(''); }}
                      >
                        Não possui cadastro? Criar conta de servidor
                      </button>
                    </div>
                  </form>

                  {/* Divisor para Acesso de Avaliação */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-slate-500 font-medium">
                        Ambiente de Avaliação Acadêmica
                      </span>
                    </div>
                  </div>

                  {/* Botão de Avaliação / Demo */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-slate-800">
                      <Shield size={15} className="text-blue-600" />
                      Acesso Instantâneo para Banca / Professor
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                      Clique no botão abaixo para explorar o painel administrativo completo sem necessidade de credenciais prévias:
                    </p>
                    <button
                      type="button"
                      onClick={handleEntrarDemo}
                      className="btn btn-secondary w-full py-2 text-xs font-medium text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                    >
                      Acessar como Banca Avaliadora
                    </button>
                  </div>
                </>
              ) : modo === 'cadastro' ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Cadastro de Servidor
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Crie sua conta com qualquer e-mail válido para acessar o sistema.
                    </p>
                  </div>

                  {erro && (
                    <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 animate-fade-in">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                      <span>{erro}</span>
                    </div>
                  )}

                  {sucesso ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                        <span>{sucesso}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary w-full text-xs py-2.5"
                        onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
                      >
                        Ir para o Login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCadastro} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Nome Completo *
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            className="input pl-10 text-sm"
                            placeholder="Seu Nome Completo"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          E-mail *
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            className="input pl-10 text-sm"
                            placeholder="seu.email@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Senha de Acesso *
                        </label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type={mostrarSenha ? 'text' : 'password'}
                            className="input pl-10 pr-10 text-sm"
                            placeholder="Mínimo 6 caracteres"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                            aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                          >
                            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="btn btn-primary w-full py-2.5 font-medium shadow-md shadow-blue-600/20"
                          disabled={loading}
                        >
                          {loading ? 'Criando Conta...' : 'Cadastrar como Servidor'}
                        </button>
                      </div>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                          onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
                        >
                          Já possui conta? Fazer login
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Recuperação de Senha
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Digite seu e-mail para receber as instruções de recuperação.
                    </p>
                  </div>

                  {erro && (
                    <div className="flex items-start gap-2.5 p-3.5 mb-5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 animate-fade-in">
                      <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                      <span>{erro}</span>
                    </div>
                  )}

                  {sucesso ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                        <span>{sucesso}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary w-full text-xs"
                        onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
                      >
                        <ArrowLeft size={14} /> Retornar ao login
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRecuperar} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          E-mail
                        </label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="email"
                            className="input pl-10 text-sm"
                            placeholder="servidor@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-full py-2.5 font-medium shadow-md shadow-blue-600/20"
                        disabled={loading}
                      >
                        {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                      </button>

                      <button
                        type="button"
                        className="w-full text-center text-xs text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 pt-2"
                        onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
                      >
                        <ArrowLeft size={13} /> Voltar ao formulário de acesso
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Retorno ao Portal Público */}
              <div className="text-center mt-6 pt-4 border-t border-slate-100">
                <Link
                  href="/"
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Retornar ao Portal Público do Cidadão
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3" />
      <p className="text-xs text-slate-400 font-medium">Carregando portal de acesso institucional...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

