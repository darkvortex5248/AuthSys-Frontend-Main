'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import { getAvatarPalette, getInitials } from '@/lib/avatar';
import { PlanBadge } from '@/components/ui/plan-badge';
import { toast } from 'sonner';

const TIMEZONES = [
  { value: 'UTC+06:00', label: 'UTC+06:00 — Dhaka' },
  { value: 'UTC+00:00', label: 'UTC+00:00 — London' },
  { value: 'UTC-05:00', label: 'UTC-05:00 — New York' },
  { value: 'UTC+05:30', label: 'UTC+05:30 — Mumbai' },
  { value: 'UTC+08:00', label: 'UTC+08:00 — Singapore' },
  { value: 'UTC+09:00', label: 'UTC+09:00 — Tokyo' },
  { value: 'UTC-08:00', label: 'UTC-08:00 — Los Angeles' },
  { value: 'UTC+01:00', label: 'UTC+01:00 — Paris' },
  { value: 'UTC+03:00', label: 'UTC+03:00 — Dubai' },
  { value: 'UTC+05:00', label: 'UTC+05:00 — Karachi' },
];

function SectionLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="material-symbols-outlined text-[15px] text-[var(--primary)]">{icon}</span>
      <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">{children}</p>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}

function Field({
  label, hint, children, required,
}: {
  label: string; hint?: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div className="space-y-2 group">
      <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors uppercase tracking-wider">
        {label}
        {required && <span className="text-[var(--primary)]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-[var(--muted-foreground)]/70 px-1">{hint}</p>}
    </div>
  );
}

function AvatarDisplay({
  avatarUrl, username, size = 'lg',
}: {
  avatarUrl: string; username: string; size?: 'sm' | 'lg';
}) {
  const [imgError, setImgError] = useState(false);
  const palette = getAvatarPalette(username || '');
  const initials = getInitials(username || '');
  const sizeClass = size === 'lg' ? 'w-24 h-24 text-2xl' : 'w-10 h-10 text-sm';
  const radiusClass = size === 'lg' ? 'rounded-2xl' : 'rounded-xl';

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt="avatar"
        className={`${sizeClass} ${radiusClass} object-cover border border-white/10 shadow-2xl`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${radiusClass} flex items-center justify-center font-black text-white uppercase shadow-2xl border border-white/10`}
      style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}
    >
      {initials}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { data: profile } = useDeveloperMe(true);
  const activeUser = profile ?? user;

  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    displayName: '',
    timezone: 'UTC+06:00',
    bio: '',
    avatar_url: '',
  });
  const [avatarModal, setAvatarModal] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const initialData = {
    username: activeUser?.username ?? '',
    email: activeUser?.email ?? '',
    displayName: activeUser?.display_name ?? '',
    timezone: activeUser?.timezone ?? 'UTC+06:00',
    bio: activeUser?.bio ?? '',
    avatar_url: activeUser?.avatar_url ?? '',
  };

  useEffect(() => {
    if (activeUser) {
      setProfileData(initialData);
      setIsDirty(false);
    }
  }, [activeUser]);

  const updateField = (key: string, value: string) => {
    setProfileData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.username.trim()) {
      toast.error('Username is required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/developer/auth/me', {
        username: profileData.username,
        display_name: profileData.displayName || null,
        bio: profileData.bio || null,
        timezone: profileData.timezone || null,
        avatar_url: profileData.avatar_url || null,
      });
      setUser(res.data);
      setIsDirty(false);
      toast.success('Profile saved');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
    setProfileData(initialData);
    setIsDirty(false);
    toast.success('Changes discarded');
  };

  const handleRemoveAvatar = async () => {
    setRemovingAvatar(true);
    try {
      await api.put('/developer/auth/me', { avatar_url: null });
      setUser({ ...activeUser, avatar_url: '' } as any);
      setProfileData(p => ({ ...p, avatar_url: '' }));
      setIsDirty(false);
      toast.success('Avatar removed');
    } catch {
      toast.error('Failed to remove avatar');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleSetAvatar = () => {
    if (!avatarInput.trim()) return;
    updateField('avatar_url', avatarInput.trim());
    setAvatarModal(false);
  };

  const openAvatarModal = () => {
    setAvatarInput(profileData.avatar_url || '');
    setAvatarPreview(profileData.avatar_url || null);
    setAvatarModal(true);
    setTimeout(() => avatarInputRef.current?.focus(), 100);
  };

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <section className="premium-card p-8 md:p-12 relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="flex items-start gap-6">
              <div className="sk h-24 w-24 rounded-2xl" />
              <div className="space-y-3 flex-1">
                <div className="sk h-7 w-48 rounded-lg" />
                <div className="sk h-4 w-32 rounded" />
                <div className="sk h-4 w-64 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {[1,2,3,4].map(i => <div key={i} className="space-y-2"><div className="sk h-4 w-24 rounded" /><div className="sk h-10 w-full rounded-xl" /></div>)}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="premium-card p-8 md:p-12 relative overflow-hidden">

      {/* Subtle background glyph */}
      <div className="absolute top-0 right-0 translate-x-8 -translate-y-4 pointer-events-none select-none opacity-[0.03]">
        <span className="material-symbols-outlined" style={{ fontSize: 280 }}>manage_accounts</span>
      </div>

      <div className="relative z-10 space-y-10">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Profile</h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              How you appear across the platform and to collaborators
            </p>
          </div>
          {isDirty && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Unsaved
            </span>
          )}
        </div>

        {/* ── Identity card ── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">

          {/* Gradient bar at top */}
          <div
            className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
            style={{
              background: `linear-gradient(90deg, ${getAvatarPalette(profileData.username || '')[0]}, ${getAvatarPalette(profileData.username || '')[1]}, transparent)`,
            }}
          />

          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar + edit */}
            <div className="relative group shrink-0">
              <AvatarDisplay avatarUrl={profileData.avatar_url} username={profileData.username} size="lg" />
              <button
                type="button"
                onClick={openAvatarModal}
                className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
              </button>
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xl font-bold text-[var(--foreground)] truncate">
                  {profileData.displayName || profileData.username || 'Your Name'}
                </p>
                <PlanBadge tier={activeUser?.subscription_tier} planName={activeUser?.plan?.name} />
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 truncate">@{profileData.username || 'username'}</p>
              <p className="text-xs text-[var(--muted-foreground)]/60 mt-0.5 truncate">{profileData.email}</p>
              {profileData.bio && (
                <p className="text-sm text-[var(--muted-foreground)] mt-2 line-clamp-2 italic">"{profileData.bio}"</p>
              )}
            </div>

            {/* Avatar actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={openAvatarModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/8 text-sm text-[var(--foreground)] font-medium transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                Change photo
              </button>
              {profileData.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={removingAvatar}
                  title="Remove avatar"
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/15 text-red-400 transition-colors disabled:opacity-50"
                >
                  {removingAvatar
                    ? <span className="w-3.5 h-3.5 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-[15px]">delete</span>
                  }
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleUpdateProfile} className="space-y-10">

          {/* Personal info */}
          <div>
            <SectionLabel icon="person">Personal information</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <Field label="Username" hint="Visible to collaborators and in URLs" required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-sm font-mono select-none">@</span>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={e => updateField('username', e.target.value)}
                    className="field-input pl-8 py-3 w-full"
                    placeholder="your_username"
                  />
                </div>
              </Field>

              <Field label="Display name" hint="Shows in place of username where space allows">
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={e => updateField('displayName', e.target.value)}
                  className="field-input px-4 py-3 w-full"
                  placeholder="Your full name"
                />
              </Field>

              <Field label="Email" hint="Contact support to change your email">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]/50">mail</span>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="field-input pl-10 py-3 w-full opacity-50 cursor-not-allowed"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[14px] text-[var(--muted-foreground)]/40">lock</span>
                </div>
              </Field>

              <Field label="Timezone" hint="Used to display dates and times correctly">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">schedule</span>
                  <select
                    value={profileData.timezone}
                    onChange={e => updateField('timezone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/50 outline-none transition-all appearance-none cursor-pointer"
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>
          </div>

          {/* Bio */}
          <div>
            <SectionLabel icon="edit_note">About you</SectionLabel>
            <Field label="Bio" hint="A short line about yourself — shown on your public profile">
              <div className="relative">
                <textarea
                  value={profileData.bio}
                  onChange={e => updateField('bio', e.target.value)}
                  rows={3}
                  maxLength={160}
                  placeholder="e.g. Full-stack dev building auth tools for the modern web…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/40 focus:border-[var(--primary)]/50 outline-none transition-all resize-none"
                />
                <span className="absolute bottom-3 right-3.5 text-[10px] text-[var(--muted-foreground)]/40 tabular-nums">
                  {profileData.bio.length}/160
                </span>
              </div>
            </Field>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[16px]">save</span>
              }
              {loading ? 'Saving…' : 'Save changes'}
            </button>

            <button
              type="button"
              onClick={handleDiscard}
              disabled={!isDirty}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-sm text-[var(--foreground)] font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
              Discard
            </button>

            {!isDirty && !loading && (
              <span className="ml-auto flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]/60">
                <span className="material-symbols-outlined text-[13px] text-emerald-400">check_circle</span>
                All changes saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Avatar modal ── */}
      {avatarModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md"
          onClick={() => setAvatarModal(false)}
        >
          <div
            className="w-full max-w-md premium-card p-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">photo_camera</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">Profile picture</h2>
                <p className="text-xs text-[var(--muted-foreground)]">Paste a direct image URL</p>
              </div>
            </div>

            {/* Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <AvatarDisplay
                  avatarUrl={avatarPreview || ''}
                  username={profileData.username}
                  size="lg"
                />
                {avatarPreview && (
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[var(--card)]">
                    <span className="material-symbols-outlined text-[11px] text-white">check</span>
                  </div>
                )}
              </div>
            </div>

            <input
              ref={avatarInputRef}
              type="url"
              value={avatarInput}
              onChange={e => { setAvatarInput(e.target.value); setAvatarPreview(e.target.value || null); }}
              onKeyDown={e => e.key === 'Enter' && handleSetAvatar()}
              placeholder="https://example.com/photo.png"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-[var(--foreground)] placeholder:text-white/20 focus:border-[var(--primary)]/50 outline-none transition-all font-mono mb-5"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSetAvatar}
                disabled={!avatarInput.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                Set photo
              </button>
              <button
                onClick={() => setAvatarModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 font-medium text-sm text-[var(--foreground)] transition-colors hover:bg-white/8"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}