'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable shell for Settings → System sub-pages.
 * Provides a consistent visual rhythm:
 *   • Hero header (title, subtitle, optional accent chip, optional toolbar)
 *   • Optional stat strip (3–4 KPI cards) — adds the "premium dashboard" feel
 *   • Body slot for form + list sections
 *
 * Theme-safe: uses only the project's existing design tokens
 * (premium-card, --primary, --foreground, --muted-foreground, white/5, etc.)
 * — no new colors are introduced.
 */

type Stat = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
};

type Crumb = { label: string };

export function SystemPageShell({
  title,
  subtitle,
  crumbs,
  accent,
  stats,
  toolbar,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  /** Optional small breadcrumb above the title (e.g. "System" → "Domains") */
  crumbs?: Crumb[];
  /** Optional pill rendered next to the title (e.g. "Developer plan") */
  accent?: ReactNode;
  /** 2–4 KPI tiles shown right under the header */
  stats?: Stat[];
  /** Optional right-aligned area in the header (e.g. "Add" button) */
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden premium-card p-8 md:p-10 space-y-8',
        className
      )}
    >
      {/* Subtle monochrome ambient top-light (no glow artefacts — just soft fill) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-white/[0.04] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full bg-[var(--primary)]/[0.05] blur-3xl"
      />

      {/* Header */}
      <div className="relative space-y-3">
        {crumbs && crumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]/70">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[var(--muted-foreground)]/30">/</span>}
                <span>{c.label}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">{title}</h3>
              {accent}
            </div>
            {subtitle && (
              <p className="text-sm text-[var(--muted-foreground)] mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>
            )}
          </div>
          {toolbar && <div className="shrink-0 flex items-center gap-2 flex-wrap">{toolbar}</div>}
        </div>
      </div>

      {/* Stat strip */}
      {stats && stats.length > 0 && (
        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <SystemStat key={i} {...s} />
          ))}
        </div>
      )}

      {/* Body */}
      <div className="relative space-y-8">{children}</div>
    </section>
  );
}

const TONE_BG: Record<NonNullable<Stat['tone']>, string> = {
  default: 'bg-[var(--primary)]/10 text-[var(--primary)]',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger:  'bg-red-500/10 text-red-400',
  muted:   'bg-white/5 text-[var(--muted-foreground)]',
};

const TONE_BAR: Record<NonNullable<Stat['tone']>, string> = {
  default: 'from-[var(--primary)]/0 via-[var(--primary)]/40 to-[var(--primary)]/0',
  success: 'from-emerald-400/0 via-emerald-400/50 to-emerald-400/0',
  warning: 'from-amber-400/0 via-amber-400/50 to-amber-400/0',
  danger:  'from-red-400/0 via-red-400/50 to-red-400/0',
  muted:   'from-white/0 via-white/20 to-white/0',
};

export function SystemStat({ label, value, hint, icon, tone = 'default' }: Stat) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-4 group transition-[background-color,border-color,transform] duration-200 ease-out hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-px">
      {/* subtle top accent line */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${TONE_BAR[tone]}`} />
      {/* diagonal sheen on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent" />
      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]/80">{label}</p>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${TONE_BG[tone]}`}>
          <span className="material-symbols-outlined text-[14px]">{icon}</span>
        </span>
      </div>
      <p className="relative text-2xl font-black text-[var(--foreground)] tabular-nums mt-2 leading-none">{value}</p>
      {hint && (
        <p className="relative text-[11px] text-[var(--muted-foreground)] mt-1.5 truncate">{hint}</p>
      )}
    </div>
  );
}

/** Form panel wrapper — used for the "Add / Create" card under the header. */
export function SystemFormPanel({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--primary)]/15 bg-gradient-to-br from-[var(--primary)]/[0.05] via-white/[0.015] to-transparent p-4 md:p-5 space-y-3.5">
      <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[var(--primary)]/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-12 w-40 h-40 rounded-full bg-white/[0.02] blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">{title}</p>
        {footer}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/** Group header (used inside Environments / Backups when items are grouped by app). */
export function SystemGroupHeader({
  icon,
  iconClassName,
  title,
  badges,
  action,
}: {
  icon: string;
  iconClassName?: string;
  title: string;
  badges?: ReactNode[];
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3 px-0.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconClassName ?? 'bg-[var(--primary)]/10'}`}>
        <span className={`material-symbols-outlined text-[14px] ${iconClassName ? '' : 'text-[var(--primary)]'}`}>{icon}</span>
      </div>
      <p className="text-sm font-semibold text-[var(--foreground)] truncate">{title}</p>
      {badges?.map((b, i) => (
        <span key={i}>{b}</span>
      ))}
      {action && <span className="ml-auto">{action}</span>}
    </div>
  );
}

/** Empty state — used by all three pages when there is no data. */
export function SystemEmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: string;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center py-16 gap-4 text-center rounded-xl border border-dashed border-white/8 bg-white/[0.01]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent"
      />
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-[var(--primary)]/10 blur-xl" />
        <div className="relative w-14 h-14 rounded-2xl bg-[var(--card)] border border-white/8 flex items-center justify-center">
          <span className="material-symbols-outlined text-[26px] text-[var(--muted-foreground)]/70">{icon}</span>
        </div>
      </div>
      <div className="relative">
        <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
        {hint && <p className="text-xs text-[var(--muted-foreground)] mt-1.5 max-w-sm mx-auto leading-relaxed">{hint}</p>}
      </div>
      {action && <div className="relative pt-1">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Refined building blocks for the upgraded pages                            */
/* -------------------------------------------------------------------------- */

/** Pill / chip — used for tags, status labels, counts. */
export function SystemChip({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted' | 'primary';
  className?: string;
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    default: 'bg-white/5 text-[var(--muted-foreground)] border border-white/8',
    primary: 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    danger:  'bg-red-500/10 text-red-400 border border-red-500/20',
    muted:   'bg-white/[0.04] text-[var(--muted-foreground)]/70 border border-white/5',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Icon container with subtle inner sheen + optional outer ambient halo. */
export function SystemIconBox({
  icon,
  tone = 'default',
  size = 'md',
  className,
}: {
  icon: ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'muted' | 'blue' | 'amber' | 'red' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const tones: Record<NonNullable<typeof tone>, string> = {
    default:  'bg-[var(--primary)]/10 text-[var(--primary)]',
    primary:  'bg-[var(--primary)]/10 text-[var(--primary)]',
    blue:     'bg-blue-500/10 text-blue-400',
    amber:    'bg-amber-500/10 text-amber-400',
    red:      'bg-red-500/10 text-red-400',
    emerald:  'bg-emerald-500/10 text-emerald-400',
    success:  'bg-emerald-500/10 text-emerald-400',
    warning:  'bg-amber-500/10 text-amber-400',
    danger:   'bg-red-500/10 text-red-400',
    muted:    'bg-white/5 text-[var(--muted-foreground)]',
  };
  const sizes: Record<NonNullable<typeof size>, string> = {
    sm: 'w-8 h-8 rounded-lg [&>span]:text-[14px]',
    md: 'w-10 h-10 rounded-xl [&>span]:text-[18px]',
    lg: 'w-12 h-12 rounded-xl [&>span]:text-[22px]',
  };
  return (
    <div
      className={cn(
        'relative flex items-center justify-center shrink-0 overflow-hidden',
        tones[tone],
        sizes[size],
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
      />
      {typeof icon === 'string' ? (
        <span className="material-symbols-outlined relative">{icon}</span>
      ) : (
        <span className="relative">{icon}</span>
      )}
    </div>
  );
}

/** A polished row used inside data lists. */
export function SystemDataRow({
  left,
  center,
  right,
  accent,
  meta,
  children,
  onClick,
  className,
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  /** Left vertical accent rail (color class). */
  accent?: string;
  /** Rendered as a thin top meta strip (e.g. ID, created date). */
  meta?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white/[0.015] border border-white/5 hover:border-white/12 hover:bg-white/[0.025] transition-[background-color,border-color,transform] duration-200 ease-out',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {accent && (
        <div className={cn('absolute left-0 inset-y-0 w-[2px]', accent)} />
      )}
      {meta && (
        <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]/60 font-semibold">
          {meta}
        </div>
      )}
      <div className="p-4 flex items-center gap-4 min-w-0">
        {left && <div className="shrink-0">{left}</div>}
        {center && <div className="flex-1 min-w-0">{center}</div>}
        {right && <div className="shrink-0 flex items-center gap-1">{right}</div>}
      </div>
      {children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/** Section header for sub-sections inside a page (e.g. "Members"). */
export function SystemSectionHeader({
  title,
  hint,
  action,
  count,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  count?: number | string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-0.5">
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">{title}</p>
        {count !== undefined && (
          <SystemChip tone="muted">{count}</SystemChip>
        )}
        {hint && <p className="text-[11px] text-[var(--muted-foreground)]/60 truncate">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** Premium hero card with avatar/logo, title, subtitle, badges, and actions. */
export function SystemHero({
  icon,
  title,
  subtitle,
  meta,
  badge,
  actions,
}: {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode[];
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-white/[0.04] via-[var(--card)] to-[var(--card)] p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[var(--primary)]/8 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent"
      />
      <div className="relative flex items-start gap-4 flex-wrap">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-[var(--foreground)] tracking-tight truncate">{title}</h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-[var(--muted-foreground)] mt-1.5 max-w-2xl leading-relaxed">{subtitle}</p>
          )}
          {meta && meta.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {meta.map((m, i) => (
                <span key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="w-1 h-1 rounded-full bg-[var(--muted-foreground)]/30" />}
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

/** Action button — used as a small inline action in cards/rows. */
export function SystemActionButton({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  loading,
  title,
  icon,
  className,
}: {
  children?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  icon?: string;
  className?: string;
}) {
  const variants: Record<NonNullable<typeof variant>, string> = {
    primary:
      'bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/20',
    ghost:
      'hover:bg-white/5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-transparent',
    subtle:
      'bg-white/[0.04] hover:bg-white/[0.07] text-[var(--foreground)] border border-white/5',
    danger:
      'hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 border border-transparent',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-[background-color,border-color,color,transform] duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px',
        variants[variant],
        className
      )}
    >
      {loading ? (
        <span className="w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
      ) : icon ? (
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
