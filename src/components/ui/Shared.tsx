'use client';

import { useState, type ReactNode } from 'react';
import { type LucideIcon, Check, Copy } from 'lucide-react';

// --- Stat Card ---
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: { value: number; label: string };
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'text-blue-600', trend }: StatCardProps) {
  return (
    <div className="card-stat animate-fade-in group card-3d">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:border-slate-200 transition-all duration-200 ${color} group-hover:scale-105`}>
        <Icon size={20} className="transition-transform group-hover:scale-105" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1.5 font-medium flex items-center gap-1 ${trend.value >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            <span>{trend.value >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-slate-400 font-normal">{trend.label}</span>
          </p>
        )}
      </div>
    </div>
  );
}

// --- Empty State ---
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 mb-4 border border-slate-200/60 shadow-xs">
        <Icon size={30} strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 leading-relaxed">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

// --- Loading Skeleton ---
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton animate-shimmer rounded-md ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card-stat">
      <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2 py-0.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  );
}

// --- Page Header ---
interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, description, badge, actions, action }: PageHeaderProps) {
  const renderedActions = actions || action;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 pb-4 border-b border-slate-200/80 animate-fade-in">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {badge && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      {renderedActions && <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">{renderedActions}</div>}
    </div>
  );
}

// --- Badge ---
interface BadgeProps {
  children?: ReactNode;
  text?: string;
  color?: string;
  variant?: string;
  className?: string;
  dot?: boolean;
}

export function Badge({ children, text, color = '', className = '', dot = false }: BadgeProps) {
  const content = children || text;
  const classes = color ? `badge ${color} ${className}` : `badge bg-slate-100 text-slate-700 border border-slate-200 ${className}`;
  return (
    <span className={classes}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0" />}
      {content}
    </span>
  );
}

// --- Botão de Copiar Texto com Feedback Visual ---
export function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="btn btn-secondary btn-sm text-xs py-1 px-2.5 inline-flex items-center gap-1.5 shrink-0"
      title={label}
    >
      {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} className="text-slate-500" />}
      <span className={copied ? 'text-emerald-700 font-medium' : 'text-slate-600'}>
        {copied ? 'Copiado!' : label}
      </span>
    </button>
  );
}

// --- Toast ---
interface ToastProps {
  type?: 'success' | 'error' | 'loading';
  message: string;
  visible: boolean;
}

export function Toast({ type = 'success', message, visible }: ToastProps) {
  if (!visible) return null;
  const color = type === 'error' ? 'bg-rose-600' : type === 'loading' ? 'bg-slate-700' : 'bg-emerald-600';
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm shadow-lg animate-slide-up ${color}`}>
      {message}
    </div>
  );
}
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  onConfirm,
  onCancel,
  onClose,
  loading,
}: ConfirmDialogProps) {
  if (!open) return null;

  const handleClose = onCancel || onClose || (() => {});

  return (
    <div className="modal-overlay p-3 sm:p-4" onClick={handleClose}>
      <div className="modal-content max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5">
            <button className="btn btn-secondary text-xs w-full sm:w-auto" onClick={handleClose} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              className={`btn text-xs w-full sm:w-auto ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Processando...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

