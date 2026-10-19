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
} from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { href: '/admin', label: 'Painel Geral', icon: LayoutDashboard },
  { href: '/admin/demandas', label: 'Gestão de Demandas', icon: ClipboardList },
  { href: '/admin/setores', label: 'Secretarias e Órgãos', icon: Building2 },
  { href: '/admin/usuarios', label: 'Servidores e Acessos', icon: Users },
  { href: '/admin/relatorios', label: 'Relatórios Analíticos', icon: BarChart3 },
  { href: '/admin/configuracoes', label: 'Critérios e Parâmetros', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
      {/* Mobile toggle */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden btn btn-secondary p-2 shadow-md bg-white border border-slate-300"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Abrir menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={`sidebar fixed md:sticky top-0 z-40 ${mobileOpen ? 'open translate-x-0' : ''}`}
      >
        {/* Cabeçalho Institucional */}
        <div className="px-5 py-5 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm tracking-wide shadow-xs shrink-0">
              AC
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-white tracking-tight truncate">
                Arcoverde Conecta
              </h1>
              <p className="text-xs text-slate-400 -mt-0.5 flex items-center gap-1 truncate">
                <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                Gestão Municipal
              </p>
            </div>
          </Link>
        </div>

        {/* Navegação de Módulos */}
        <div className="px-3 pt-4 pb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3">
            Módulos de Gestão
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
                <item.icon size={17} className={active ? 'text-white' : 'text-slate-400'} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
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
