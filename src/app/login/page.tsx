'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Eye, EyeOff, ArrowLeft, Mail, Lock, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const [modo, setModo] = useState<'login' | 'recuperar'>('login');
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
          setErro('E-mail institucional ou senha incorretos.');
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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Barra de identificação governamental */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-600 text-white font-bold text-lg mb-3 shadow-sm">
          AC
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Arcoverde Conecta
        </h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1">
          <Building2 size={13} /> Prefeitura Municipal de Arcoverde • Gestão Interna
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 animate-fade-in">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-xl border border-slate-200">
          {modo === 'login' ? (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Autenticação de Servidores
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Acesse com seu e-mail institucional e senha cadastrada.
                </p>
              </div>

              {erro && (
                <div className="flex items-start gap-2.5 p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    E-mail Institucional
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      className="input pl-9 text-sm"
                      placeholder="servidor@arcoverde.pe.gov.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      className="input pl-9 pr-10 text-sm"
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
                    className="btn btn-primary w-full py-2.5 font-medium shadow-xs"
                    disabled={loading}
                  >
                    {loading ? 'Validando Acesso...' : 'Acessar Painel'}
                  </button>
                </div>
              </form>

              {/* Divisor */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-500 font-medium">
                    Ambiente de Avaliação
                  </span>
                </div>
              </div>

              {/* Botão de Avaliação / Demo */}
              <button
                type="button"
                onClick={handleEntrarDemo}
                className="btn btn-secondary w-full py-2 text-xs font-medium text-slate-700 border-slate-300 hover:bg-slate-50"
              >
                <Shield size={14} className="text-indigo-600" />
                Acesso de Demonstração (Banca Avaliadora)
              </button>

              <div className="text-center mt-5">
                <button
                  type="button"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  onClick={() => { setModo('recuperar'); setErro(''); setSucesso(''); }}
                >
                  Esqueceu sua senha de acesso?
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-base font-semibold text-slate-900">
                  Recuperar Senha
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Digite seu e-mail funcional para receber o link de redefinição.
                </p>
              </div>

              {erro && (
                <div className="flex items-start gap-2.5 p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              {sucesso ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      E-mail Institucional
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        className="input pl-9 text-sm"
                        placeholder="servidor@arcoverde.pe.gov.br"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full py-2.5 font-medium shadow-xs"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                  </button>

                  <button
                    type="button"
                    className="w-full text-center text-xs text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 pt-2"
                    onClick={() => { setModo('login'); setErro(''); setSucesso(''); }}
                  >
                    <ArrowLeft size={13} /> Voltar ao formulário de acesso
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Retorno ao Portal Público */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Retornar ao Portal Público do Cidadão
          </Link>
        </div>
      </div>
    </div>
  );
}
