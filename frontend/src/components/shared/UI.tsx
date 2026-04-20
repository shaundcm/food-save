import React from 'react';
import clsx from 'clsx';
import { Loader2, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size];
  return <Loader2 className={clsx(s, 'animate-spin text-brand-400', className)} />;
}

// ─── Loading Page ─────────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="muted-text animate-pulse-soft">Loading…</p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      <h3 className="font-display font-semibold text-white/70 text-lg">{title}</h3>
      {description && <p className="muted-text max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
type AlertType = 'error' | 'success' | 'info';
export function Alert({ type, message, onClose, className }: { type: AlertType; message: string; onClose?: () => void; className?: string }) {
  const config = {
    error:   { icon: AlertCircle,    bg: 'bg-red-500/10 border-red-500/30',   text: 'text-red-400' },
    success: { icon: CheckCircle2,   bg: 'bg-brand-500/10 border-brand-500/30', text: 'text-brand-400' },
    info:    { icon: Info,           bg: 'bg-blue-500/10 border-blue-500/30',  text: 'text-blue-400' },
  }[type];
  const Icon = config.icon;
  return (
    <div className={clsx('flex items-start gap-3 px-4 py-3 rounded-xl border', config.bg, className)}>
      <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', config.text)} />
      <p className={clsx('text-sm font-body flex-1', config.text)}>{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    AVAILABLE: 'status-available',
    CLAIMED:   'status-claimed',
    COMPLETED: 'status-completed',
    EXPIRED:   'status-expired',
    CANCELLED: 'status-cancelled',
    PENDING:   'status-claimed',
    CONFIRMED: 'status-available',
    PICKED_UP: 'status-completed',
  };
  return <span className={map[status] || 'badge bg-white/10 text-white/40'}>{status.replace('_', ' ')}</span>;
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-up">
        <div className="flex items-center justify-between p-6 border-b border-surface-border">
          <h2 className="section-title">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const s = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  return (
    <div className={clsx(s, 'rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-display font-semibold text-brand-400')}>
      {initials}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="stat-card animate-fade-up">
      <div className="flex items-start justify-between">
        <p className="muted-text text-xs uppercase tracking-wider font-mono">{label}</p>
        {icon && <span className="text-brand-400/60">{icon}</span>}
      </div>
      <p className="font-display text-2xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="muted-text text-xs">{sub}</p>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}
