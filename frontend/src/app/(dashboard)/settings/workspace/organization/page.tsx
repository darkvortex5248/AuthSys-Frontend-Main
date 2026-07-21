'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function WorkspaceOrganizationPage() {
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', slug: '', logo_url: '' });
  const [inviteForm, setInviteForm] = useState({ developer_email: '', role: 'developer' });

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
    try {
      const res = await api.post('/developer/organization', orgForm);
      setOrg(res.data);
      setShowCreate(false);
      toast.success('Organization created!');
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const inviteMember = async () => {
    try {
      await api.post('/developer/organization/invite', inviteForm);
      toast.success('Invitation sent!');
      setShowInvite(false);
      fetch();
    } catch (err: any) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const acceptInvite = async (id: number) => {
    try { await api.post(`/developer/organization/invite/${id}/accept`); toast.success('Accepted!'); fetch(); }
    catch { toast.error('Failed'); }
  };

  const removeMember = async (id: number) => {
    if (!confirm('Remove this member?')) return;
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

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Organization</h1><p className="text-sm text-[var(--muted-foreground)] mt-1">Manage your team and organization</p></div>

      {!org && !showCreate && (
        <div className="premium-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"><span className="material-symbols-outlined text-3xl text-primary">groups</span></div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">No Organization Yet</h2>
          <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">Create an organization to manage your team, invite members, and collaborate on apps.</p>
          <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold">Create Organization</button>
        </div>
      )}

      {showCreate && (
        <div className="premium-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">New Organization</h3>
          <input value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} placeholder="Organization name" className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          <input value={orgForm.slug} onChange={e => setOrgForm({...orgForm, slug: e.target.value})} placeholder="slug (e.g. mycompany)" className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          <input value={orgForm.logo_url} onChange={e => setOrgForm({...orgForm, logo_url: e.target.value})} placeholder="Logo URL (optional)" className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          <div className="flex gap-3">
            <button onClick={createOrg} disabled={!orgForm.name || !orgForm.slug} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[var(--muted-foreground)]">Cancel</button>
          </div>
        </div>
      )}

      {org && (
        <>
          <div className="premium-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                {org.logo_url ? <img src={org.logo_url} className="w-14 h-14 rounded-2xl object-cover" /> : <span className="material-symbols-outlined text-2xl text-primary">groups</span>}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--foreground)]">{org.name}</h2>
                <p className="text-xs text-[var(--muted-foreground)]">/{org.slug} · {members.length} members</p>
              </div>
            </div>
            <button onClick={() => setShowInvite(true)} className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-bold text-primary hover:bg-primary/20">+ Invite</button>
          </div>

          {showInvite && (
            <div className="premium-card p-5 space-y-4">
              <h3 className="text-sm font-bold text-[var(--foreground)]">Invite Member</h3>
              <input value={inviteForm.developer_email} onChange={e => setInviteForm({...inviteForm, developer_email: e.target.value})} placeholder="developer@email.com" className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
              <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
                <option value="support">Support</option>
              </select>
              <div className="flex gap-3">
                <button onClick={inviteMember} disabled={!inviteForm.developer_email} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">Send Invite</button>
                <button onClick={() => setShowInvite(false)} className="px-4 py-2 border border-white/10 rounded-xl text-sm text-[var(--muted-foreground)]">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider">Members ({members.length})</h3>
            {members.map(m => (
              <div key={m.id} className="premium-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-primary">#{m.developer_id}</div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Developer #{m.developer_id}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : m.role === 'developer' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>{m.role}</span>
                      {!m.is_accepted && <span className="text-[10px] text-yellow-400">Pending</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.is_accepted && (
                    <select value={m.role} onChange={e => updateRole(m.id, e.target.value)} className="bg-[var(--card)]/50 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-[var(--muted-foreground)]">
                      <option value="developer">Developer</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                      <option value="support">Support</option>
                    </select>
                  )}
                  {!m.is_accepted && <button onClick={() => acceptInvite(m.id)} className="px-3 py-1 rounded-lg text-[10px] font-bold bg-green-500/10 text-green-400">Accept</button>}
                  <button onClick={() => removeMember(m.id)} className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400"><span className="material-symbols-outlined text-sm">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
