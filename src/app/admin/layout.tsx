import type { Metadata } from 'next';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Link from 'next/link';
import { ExternalLink, Database, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Painel Administrativo | Arcoverde Conecta',
  description: 'Painel de gestão de demandas de serviços públicos de Arcoverde',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar Institucional Administrativa */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3 pl-12 md:pl-0">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Building2 size={14} className="text-blue-600" />
              Prefeitura de Arcoverde-PE
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium truncate">
              Painel Integrado de Zeladoria e Serviços Públicos
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Supabase Conectado</span>
            </div>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm text-xs text-slate-700 gap-1.5"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Ver</span> Portal do Cidadão
            </Link>
          </div>
        </header>

        {/* Conteúdo da Página */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

