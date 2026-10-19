'use client';

import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

// --- Stat Card ---
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: { value: number; label: string };
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'text-primary', trend }: StatCardProps) {
  return (
    <div className="card-stat animate-fade-in">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 ${color}`}>
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted truncate">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary mb-4">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-md mb-4">{description}</p>
      {action}
    </div>
  );
}

// --- Loading Skeleton ---
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton animate-shimmer ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card-stat">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="flex-1 space-y-2">
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
  actions?: ReactNode;
  action?: ReactNode;
}

export function PageHeader({ title, description, actions, action }: PageHeaderProps) {
  const renderedActions = actions || action;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted mt-1">{description}</p>}
      </div>
      {renderedActions && <div className="flex items-center gap-2">{renderedActions}</div>}
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
}

export function Badge({ children, text, color = '', className = '' }: BadgeProps) {
  const content = children || text;
  const classes = color ? `badge ${color} ${className}` : `badge ${className}`;
  return <span className={classes}>{content}</span>;
}

// --- Confirm Dialog ---
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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm text-muted mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              {cancelLabel}
            </button>
            <button
              className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
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
