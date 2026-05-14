'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function TeamManagementPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'support' });

  const fetchTeam = async () => {
    try {
      const res = await api.get('/developer/team');
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to fetch team", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/developer/team/invite', inviteData);
      toast.success("Team member invited successfully!");
      setShowInviteModal(false);
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to invite member");
    }
  };

  const removeMember = async (id: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await api.delete(`/developer/team/${id}`);
      toast.success("Member removed");
      fetchTeam();
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--vault-primary)]"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Team Management</h2>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
            <span>Enterprise</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[var(--vault-primary)]">Staff & Access</span>
          </nav>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="px-6 py-3 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[var(--vault-primary)]/20 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">person_add</span>
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member.id} className="glass-card p-6 rounded-3xl border border-white/5 relative group hover:border-[var(--vault-primary)]/30 transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--vault-primary)]/10 flex items-center justify-center text-[var(--vault-primary)] font-bold text-xl uppercase">
                {member.username.substring(0, 2)}
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                member.role === 'admin' ? 'bg-purple-500/10 text-purple-400' :
                member.role === 'moderator' ? 'bg-blue-500/10 text-blue-400' :
                'bg-emerald-500/10 text-emerald-400'
              }`}>
                {member.role}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{member.username}</h3>
            <p className="text-xs text-[var(--vault-on-surface-variant)] mb-6 truncate">{member.email}</p>
            
            <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-white/20 uppercase tracking-tighter">Joined {new Date(member.created_at).toLocaleDateString()}</span>
              <button 
                onClick={() => removeMember(member.id)}
                className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <span className="material-symbols-outlined text-lg">person_remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20">
              <span className="material-symbols-outlined text-3xl">groups</span>
           </div>
           <p className="text-[var(--vault-on-surface-variant)] font-medium">No team members yet. Invite your first colleague!</p>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowInviteModal(false)}></div>
          <div className="relative w-full max-w-md glass-card rounded-[2rem] border border-white/10 p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold text-white mb-2">Invite Member</h3>
            <p className="text-sm text-[var(--vault-on-surface-variant)] mb-8 font-medium">Add a staff member to your development team.</p>
            
            <form onSubmit={handleInvite} className="space-y-6">
              <div>
                <label className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest mb-2 block">Email Address</label>
                <input 
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--vault-primary)]/50 transition-all"
                  placeholder="staff@example.com"
                />
              </div>

              <div>
                <label className="text-[10px] text-[var(--vault-on-surface-variant)] font-bold uppercase tracking-widest mb-2 block">Assigned Role</label>
                <select 
                  value={inviteData.role}
                  onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--vault-primary)]/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="support" className="bg-[#0a0a0a]">Support Staff</option>
                  <option value="moderator" className="bg-[#0a0a0a]">Moderator</option>
                  <option value="admin" className="bg-[#0a0a0a]">Full Admin</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-6 py-3 glass-card rounded-xl text-sm font-bold text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] rounded-xl text-sm font-bold shadow-lg shadow-[var(--vault-primary)]/20 active:scale-[0.95] transition-all"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
