'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin', label: 'Painel Geral', icon: LayoutDashboard },
  { href: '/admin/demandas', label: 'Gestão de Demandas', icon: ClipboardList },
  { href: '/admin/setores', label: 'Secretarias e Órgãos', icon: Building2 },
  { href: '/admin/relatorios', label: 'Relatórios Analíticos', icon: BarChart3 },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Trava a rolagem do body quando o menu mobile está aberto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Fecha o menu mobile ao navegar
  useEffect(() => {
    const id = setTimeout(() => { setMobileOpen(false); }, 0);
    return () => clearTimeout(id);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out:', e);
    }
    document.cookie = 'ac_demo_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    window.location.href = '/login';
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Botão de alternância no Mobile */}
      <button
        className="fixed top-2.5 left-3 z-30 md:hidden btn btn-secondary p-2 shadow-md bg-white border border-slate-300"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay backdrop no mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={`sidebar fixed md:sticky top-0 z-50 md:z-30 h-dvh max-h-dvh flex flex-col transition-all duration-250 ease-out ${
          mobileOpen ? 'open translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'collapsed' : ''}`}
        style={{ width: collapsed ? 72 : 260 }}
      >
        {/* Cabeçalho Institucional da Sidebar */}
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-900/30 shrink-0 group-hover:bg-blue-500 transition-colors">
              AC
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white tracking-tight truncate leading-tight">
                Arcoverde Conecta
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                Gestão Municipal Integrada
              </p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? '»' : '«'}
          </button>
        </div>

        {/* Identificação de Acesso */}
        <div className="px-5 py-3 bg-slate-900/50 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300 border border-slate-700">
              SV
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">Servidor Municipal</p>
              <p className="text-[10px] text-slate-400 truncate">Prefeitura de Arcoverde</p>
            </div>
          </div>
        </div>

        {/* Navegação de Módulos */}
        <div className="px-4 pt-4 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400/90 px-2">
            Módulos do Sistema
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'} />
                <span className="truncate nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="px-3 py-4 border-t border-slate-800/80 space-y-1">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-link text-xs hover:text-white"
          >
            <ExternalLink size={15} />
            <span className="truncate">Portal do Cidadão</span>
          </Link>

          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-950/40"
          >
            <LogOut size={15} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>
    </>
  );
}

