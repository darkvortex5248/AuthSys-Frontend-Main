'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  SystemPageShell,
  SystemEmptyState,
  SystemChip,
  SystemIconBox,
  SystemDataRow,
  SystemActionButton,
  SystemSectionHeader,
  SystemFormPanel,
  SystemHero,
} from '@/components/shells/SystemPageShell';

const ROLE_META: Record<string, { tone: 'primary' | 'success' | 'warning' | 'muted' | 'danger'; icon: string; label: string }> = {
  admin:     { tone: 'primary', icon: 'admin_panel_settings', label: 'Admin' },
  developer: { tone: 'success', icon: 'code',                 label: 'Developer' },
  viewer:    { tone: 'muted',   icon: 'visibility',           label: 'Viewer' },
  support:   { tone: 'warning', icon: 'support_agent',        label: 'Support' },
};

export default function WorkspaceOrganizationPage() {
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', slug: '', logo_url: '' });
  const [inviteForm, setInviteForm] = useState({ developer_email: '', role: 'developer' });
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);

  const fetch = async () => {
    try {
      const oRes = await api.get('/developer/organization');
      setOrg(oRes.data);
      const mRes = await api.get('/developer/organization/members');
      setMembers(mRes.data);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message;
      if (err?.response?.status !== 404) toast.error(detail);
    } finally { setLoading(false); }
  };
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { fetch(); }, []);

  const createOrg = async () => {
    setCreating(true);
    try {
      const res = await api.post('/developer/organization', orgForm);
      setOrg(res.data);
      setShowCreate(false);
      setOrgForm({ name: '', slug: '', logo_url: '' });
      toast.success('Organization created!');
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setCreating(false); }
  };

  const inviteMember = async () => {
    setInviting(true);
    try {
      await api.post('/developer/organization/invite', inviteForm);
      toast.success('Invitation sent!');
      setShowInvite(false);
      setInviteForm({ developer_email: '', role: 'developer' });
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setInviting(false); }
  };

  const acceptInvite = async (id: number) => {
    try { await api.post(`/developer/organization/invite/${id}/accept`); toast.success('Accepted!'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const removeMember = async (id: number) => {
    try { await api.delete(`/developer/organization/members/${id}`); toast.success('Removed'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const updateRole = async (id: number, role: string) => {
    try { await api.put(`/developer/organization/members/${id}/role?role=${role}`); toast.success('Role updated'); fetch(); }
    catch { toast.error('Failed'); }
  };

  if (!mounted) {
    return (
      <div className="max-w-4xl space-y-6 animate-pulse">
        <div className="sk h-7 w-36 rounded-lg" />
        <div className="sk h-4 w-64 rounded" />
        <div className="premium-card p-8 space-y-4 text-center">
          <div className="sk h-16 w-16 rounded-2xl mx-auto" />
          <div className="sk h-5 w-40 rounded-lg mx-auto" />
          <div className="sk h-4 w-64 rounded mx-auto" />
          <div className="sk h-10 w-40 rounded-xl mx-auto" />
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" /></div>;

  // Derived counts
  const acceptedCount = members.filter(m => m.is_accepted).length;
  const pendingCount  = members.length - acceptedCount;

  return (
    <SystemPageShell
      crumbs={[{ label: 'Workspace' }, { label: 'Organization' }]}
      title="Organization"
      subtitle="Manage your team, invite developers, and collaborate on apps from a single workspace."
      accent={
        <SystemChip tone="primary">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </SystemChip>
      }
      stats={[
        { label: 'Total Members', value: members.length,  icon: 'groups',        tone: 'default' },
        { label: 'Active',        value: acceptedCount,   icon: 'verified_user', tone: 'success' },
        { label: 'Pending',       value: pendingCount,    icon: 'pending',       tone: 'warning' },
        { label: 'Admins',        value: members.filter(m => m.role === 'admin').length, icon: 'admin_panel_settings', tone: 'default' },
      ]}
    >

      {/* No-org state */}
      {!org && !showCreate && (
        <SystemEmptyState
          icon="corporate_fare"
          title="No organization yet"
          hint="Create an organization to manage your team, invite members, and collaborate on apps from a single workspace."
        />
      )}

      {/* Create org form */}
      {showCreate && (
        <SystemFormPanel
          title="New organization"
          footer={
            <span className="text-[10px] text-[var(--muted-foreground)]/70">Slug is used in shareable URLs</span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">corporate_fare</span>
              <input
                value={orgForm.name}
                onChange={e => setOrgForm({...orgForm, name: e.target.value})}
                placeholder="Organization name"
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">link</span>
              <input
                value={orgForm.slug}
                onChange={e => setOrgForm({...orgForm, slug: e.target.value})}
                placeholder="slug (e.g. mycompany)"
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 outline-none transition-colors"
              />
            </div>
            <div className="relative md:col-span-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">image</span>
              <input
                value={orgForm.logo_url}
                onChange={e => setOrgForm({...orgForm, logo_url: e.target.value})}
                placeholder="Logo URL (optional)"
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2.5 pt-1">
            <button
              onClick={createOrg}
              disabled={!orgForm.name || !orgForm.slug || creating}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {creating
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[16px]">add</span>
              }
              Create organization
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2.5 border border-white/8 hover:bg-white/5 rounded-xl text-sm font-semibold text-[var(--muted-foreground)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </SystemFormPanel>
      )}

      {/* Create org CTA when no org */}
      {!org && !showCreate && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-[var(--primary)]/10"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Create Organization
          </button>
        </div>
      )}

      {/* Org hero */}
      {org && !showCreate && (
        <SystemHero
          icon={
            <div className="relative w-14 h-14 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
              />
              {org.logo_url ? (
                <img src={org.logo_url} className="relative w-full h-full object-cover" />
              ) : (
                <span className="relative material-symbols-outlined text-[26px] text-[var(--primary)]">corporate_fare</span>
              )}
            </div>
          }
          title={org.name}
          subtitle={<>Manage your team, invite developers, and collaborate on apps from a single workspace.</>}
          meta={[
            <span key="slug" className="text-xs text-[var(--muted-foreground)] font-mono">/{org.slug}</span>,
            <SystemChip key="m" tone="muted" className="!normal-case !tracking-normal">
              {members.length} members
            </SystemChip>,
            <SystemChip key="ok" tone="success" className="!normal-case !tracking-normal">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </SystemChip>,
          ]}
          actions={
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 border border-[var(--primary)]/20 text-[var(--primary)] rounded-xl text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              Invite member
            </button>
          }
        />
      )}

      {/* Invite form */}
      {org && showInvite && (
        <SystemFormPanel
          title="Invite a member"
          footer={
            <span className="text-[10px] text-[var(--muted-foreground)]/70">They'll receive an email with a join link</span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2.5">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">mail</span>
              <input
                value={inviteForm.developer_email}
                onChange={e => setInviteForm({...inviteForm, developer_email: e.target.value})}
                placeholder="developer@email.com"
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 focus:border-[var(--primary)]/40 outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-[var(--muted-foreground)]">badge</span>
              <select
                value={inviteForm.role}
                onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                className="w-full pl-9 pr-3 py-2.5 bg-[var(--card)]/50 border border-white/8 rounded-xl text-sm text-[var(--foreground)] focus:border-[var(--primary)]/40 outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
                <option value="support">Support</option>
              </select>
            </div>
            <button
              onClick={inviteMember}
              disabled={!inviteForm.developer_email || inviting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {inviting
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[16px]">send</span>
              }
              Send invite
            </button>
          </div>
        </SystemFormPanel>
      )}

      {/* Members list */}
      {org && members.length > 0 && (
        <div className="space-y-3">
          <SystemSectionHeader
            title="Team members"
            count={`${members.length}`}
            hint={`${acceptedCount} active · ${pendingCount} pending`}
          />
          <div className="space-y-2">
            {members.map(m => {
              const meta = ROLE_META[m.role] ?? ROLE_META.viewer;
              return (
                <SystemDataRow
                  key={m.id}
                  left={
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)]/25 via-purple-500/15 to-blue-500/15 border border-white/8 flex items-center justify-center overflow-hidden">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent"
                      />
                      <span className="relative text-xs font-black text-[var(--primary)]">#{m.developer_id}</span>
                    </div>
                  }
                  center={
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-[var(--foreground)]">Developer #{m.developer_id}</p>
                        <SystemChip tone={meta.tone} className="!normal-case !tracking-normal">
                          <span className="material-symbols-outlined text-[10px]">{meta.icon}</span>
                          {meta.label}
                        </SystemChip>
                        {!m.is_accepted && (
                          <SystemChip tone="warning" className="!normal-case !tracking-normal">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending
                          </SystemChip>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                        Member since {new Date(m.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  }
                  right={
                    <>
                      {m.is_accepted ? (
                        <div className="relative">
                          <select
                            value={m.role}
                            onChange={e => updateRole(m.id, e.target.value)}
                            className="pl-2.5 pr-7 py-1.5 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-lg text-[11px] text-[var(--foreground)] focus:border-[var(--primary)]/30 outline-none transition-colors appearance-none cursor-pointer"
                          >
                            <option value="developer">Developer</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                            <option value="support">Support</option>
                          </select>
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-[12px] text-[var(--muted-foreground)]">expand_more</span>
                        </div>
                      ) : (
                        <SystemActionButton
                          variant="primary"
                          icon="check"
                          onClick={() => acceptInvite(m.id)}
                        >
                          Accept
                        </SystemActionButton>
                      )}
                      <SystemActionButton
                        variant="danger"
                        icon="delete"
                        onClick={() => removeMember(m.id)}
                      >
                        <span className="hidden sm:inline">Remove</span>
                      </SystemActionButton>
                    </>
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {org && members.length === 0 && !showInvite && (
        <SystemEmptyState
          icon="group_add"
          title="No team members yet"
          hint="Invite developers to your organization so they can collaborate on apps."
          action={
            <button
              onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/15 border border-[var(--primary)]/20 text-[var(--primary)] rounded-xl text-sm font-semibold transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">person_add</span>
              Invite your first member
            </button>
          }
        />
      )}

    </SystemPageShell>
  );
}
