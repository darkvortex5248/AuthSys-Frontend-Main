'use client';

import { useState } from 'react';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

function DangerRow({
  icon, title, description, badge, children,
}: {
  icon: string; title: string; description: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-5">
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/15 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-[18px] text-red-400">{icon}</span>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">{description}</p>
      </div>

      {/* Action */}
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function DangerButton({
  children, onClick, disabled, loading,
}: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading
        ? <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
        : null
      }
      {children}
    </button>
  );
}

export default function DangerPage() {
  const confirm = useConfirm();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [deleteInput, setDeleteInput] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleRevokeKeys = async () => {
    const ok = await confirm({
      title: 'Revoke all API keys?',
      message: 'This will immediately invalidate every active API key across all your apps. Services using these keys will lose access until new keys are generated. This cannot be undone.',
      confirmLabel: 'Yes, revoke all',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    setRevoking(true);
    try {
      await api.post('/developer/security/revoke-all-keys');
      toast.success('All API keys revoked');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to revoke API keys');
    } finally {
      setRevoking(false);
    }
  };

  const handleTerminateSessions = async () => {
    const ok = await confirm({
      title: 'Terminate all sessions?',
      message: 'You will be signed out from every device including this one. You will need to log in again to continue.',
      confirmLabel: 'Yes, terminate',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    setTerminating(true);
    try {
      await api.post('/developer/sessions/logout-all');
      toast.success('All sessions terminated');
      await logout();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to terminate sessions');
      setTerminating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Delete your account?',
      message: 'This is permanent and irreversible. All your apps, API keys, users, and subscription data will be wiped immediately. There is no recovery.',
      confirmLabel: 'Delete my account',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await api.post('/developer/auth/delete-account');
      toast.success('Account deleted');
      await logout();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const phraseMatch = deleteInput === CONFIRM_PHRASE;

  return (
    <section className="premium-card p-8 md:p-10 space-y-8">

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px] text-red-400">warning</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] tracking-tight">Danger zone</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            These actions are irreversible. Read each description carefully before proceeding.
          </p>
        </div>
      </div>

      {/* Actions list */}
      <div className="rounded-2xl border border-red-500/15 overflow-hidden divide-y divide-red-500/8">

        {/* Revoke keys */}
        <DangerRow
          icon="key_off"
          title="Revoke all API keys"
          description="Immediately invalidates every active API key across all your apps. Any service relying on these keys will lose access until new keys are generated."
        >
          <DangerButton onClick={handleRevokeKeys} loading={revoking}>
            {!revoking && <span className="material-symbols-outlined text-[15px]">key_off</span>}
            {revoking ? 'Revoking…' : 'Revoke all keys'}
          </DangerButton>
        </DangerRow>

        {/* Terminate sessions */}
        <DangerRow
          icon="logout"
          title="Terminate all sessions"
          description="Signs you out from every device including this one. You will be redirected to the login page and must authenticate again."
        >
          <DangerButton onClick={handleTerminateSessions} loading={terminating}>
            {!terminating && <span className="material-symbols-outlined text-[15px]">logout</span>}
            {terminating ? 'Terminating…' : 'End all sessions'}
          </DangerButton>
        </DangerRow>

        {/* Delete account — expanded */}
        <div className="p-6 space-y-5 bg-red-500/[0.02]">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-red-400">delete_forever</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[var(--foreground)]">Delete account permanently</p>
                <span className="px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[9px] font-black uppercase tracking-wider">Irreversible</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-relaxed">
                Erases all your data — apps, API keys, users, logs, and subscription. Your account cannot be recovered after deletion.
              </p>
            </div>
          </div>

          {/* Confirm phrase input */}
          <div className="space-y-2 max-w-sm">
            <label className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
              Type <code className="text-red-400 font-mono normal-case tracking-normal font-bold">{CONFIRM_PHRASE}</code> to unlock
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={CONFIRM_PHRASE}
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-[var(--foreground)] placeholder:text-white/15 outline-none transition-all text-sm font-mono ${
                  deleteInput.length > 0
                    ? phraseMatch
                      ? 'border-red-500/50 focus:border-red-500/70'
                      : 'border-red-500/25 focus:border-red-500/40'
                    : 'border-red-500/15 focus:border-red-500/30'
                }`}
              />
              {phraseMatch && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-red-400">
                  check
                </span>
              )}
            </div>
            {deleteInput.length > 0 && !phraseMatch && (
              <p className="text-[11px] text-red-400/70">Phrase doesn't match — type it exactly</p>
            )}
          </div>

          <button
            disabled={!phraseMatch || deleting}
            onClick={handleDeleteAccount}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
          >
            {deleting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">delete_forever</span>
            }
            {deleting ? 'Deleting account…' : 'Delete my account'}
          </button>
        </div>

      </div>

    </section>
  );
}