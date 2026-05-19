'use client';
import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  useInvalidateDeveloperData,
  useLicenseKeys,
  useGenerateKeys,
  useCreateLicenseKey,
  useDeleteLicenseKey,
} from '@/hooks/use-developer-queries';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useCopy } from '@/components/ui/copy-dialog';

export default function LicenseKeysPage() {
  const { selectedAppId } = useAuthStore();
  const invalidate = useInvalidateDeveloperData();
  const confirm = useConfirm();
  const copy = useCopy();
  const generateKeys = useGenerateKeys();
  const createKey = useCreateLicenseKey();
  const deleteKeyMutation = useDeleteLicenseKey();
  const { data: keys = [], isLoading: loading, isError, error, refetch } = useLicenseKeys(selectedAppId);
  const [genData, setGenData] = useState({ quantity: 10, type: 'time', duration: 30, expires_at: '' });
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleData, setSingleData] = useState({ type: 'time', duration: 30, max_uses: 1, expires_at: '', note: '', custom_key: '' });
  const [editData, setEditData] = useState({ type: 'time', duration: 30, max_uses: 0, expires_at: '', note: '', seller_tag: '' });
  const [generating, setGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredKeys = useMemo(() => {
    return (keys || []).filter(k => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        k?.key_value?.toLowerCase().includes(term) || 
        k?.note?.toLowerCase().includes(term) ||
        k?.seller_tag?.toLowerCase().includes(term);
        
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && !k.is_paused) || 
        (statusFilter === 'paused' && k.is_paused);
        
      return matchesSearch && matchesStatus;
    });
  }, [keys, searchTerm, statusFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedAppId) refetch();
  }, [selectedAppId, refetch]);

  useEffect(() => {
    if (isError) {
      const msg = (error as any)?.response?.data?.detail || 'Failed to load license keys';
      toast.error(typeof msg === 'string' ? msg : 'Failed to load license keys');
    }
  }, [isError, error]);

  const handleGenerate = async () => {
    if (!selectedAppId) return;
    setGenerating(true);
    try {
      await generateKeys.mutateAsync({
        app_id: selectedAppId,
        count: genData.quantity,
        key_type: genData.type,
        duration_days: genData.duration === 0 ? null : genData.duration,
        expires_at: genData.expires_at || null,
      });
      toast.success(`Generated ${genData.quantity} keys`);
    } catch (err) {
      toast.error('Failed to generate keys');
    } finally {
      setGenerating(false);
    }
  };

  const handleSingleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;
    setGenerating(true);
    try {
      await createKey.mutateAsync({
        app_id: selectedAppId,
        key_type: singleData.type,
        duration_days: singleData.duration === 0 ? null : singleData.duration,
        max_uses: singleData.max_uses,
        expires_at: singleData.expires_at || null,
        note: singleData.note,
        custom_key: singleData.custom_key || null,
      });
      setShowSingleModal(false);
      setSingleData({ type: 'time', duration: 30, max_uses: 1, expires_at: '', note: '', custom_key: '' });
      toast.success('License key created');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create key');
    } finally {
      setGenerating(false);
    }
  };

  const handleTogglePause = async (id: number) => {
    try {
      await api.post(`/developer/keys/${id}/pause`);
      if (selectedAppId) await invalidate.keys(selectedAppId);
      await invalidate.overview();
    } catch (err) {
      toast.error('Failed to toggle status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!selectedAppId) return;
    const ok = await confirm({
      title: 'Delete license key?',
      message: 'This key will stop working immediately. This cannot be undone.',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteKeyMutation.mutateAsync({ id, appId: selectedAppId });
      toast.success('Key deleted');
    } catch (err) {
      toast.error('Failed to delete key');
    }
  };

  const handleHWIDReset = async (id: number) => {
    const ok = await confirm({
      title: 'Reset HWID?',
      message: 'Reset HWID for all users bound to this license key?',
      confirmLabel: 'Yes, reset',
      variant: 'default',
    });
    if (!ok) return;
    try {
      await api.post(`/developer/keys/${id}/hwid-reset`);
      toast.success('HWID reset successful');
      if (selectedAppId) invalidate.keys(selectedAppId);
    } catch (err) {
      toast.error('Failed to reset HWID');
    }
  };

  const handleEditKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    try {
      await api.put(`/developer/keys/${showEditModal.id}`, {
        key_type: editData.type,
        duration_days: editData.duration || null,
        max_uses: editData.max_uses || null,
        expires_at: editData.expires_at || null,
        note: editData.note,
        seller_tag: editData.seller_tag
      });
      setShowEditModal(null);
      if (selectedAppId) invalidate.keys(selectedAppId);
      toast.success('Key updated');
    } catch (err) {
      toast.error('Failed to update key');
    }
  };

  if (!mounted) return null;

  if (!selectedAppId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[var(--vault-on-surface-variant)]">
        <span className="material-symbols-outlined text-6xl mb-4 opacity-20">apps</span>
        <p className="text-xl font-bold">Please select an application first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end mb-8 gap-6">
          <div className="space-y-4">
            <div className="h-10 w-64 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse" />
          </div>
          <div className="h-12 w-48 bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card rounded-2xl h-32 animate-pulse bg-white/[0.02] border-white/5" />
          ))}
        </div>
        <div className="glass-card rounded-2xl h-64 animate-pulse bg-white/[0.02] border-white/5" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div>
          <h2 className="text-4xl font-bold text-[var(--vault-on-surface)] tracking-tight">License Management</h2>
          <p className="text-[var(--vault-on-surface-variant)] mt-1 font-medium">Manage authentication keys for App ID: {selectedAppId}</p>
        </div>
        <button 
          onClick={() => setShowSingleModal(true)}
          className="flex items-center gap-2 bg-[var(--vault-primary)] text-[var(--vault-on-primary)] px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[var(--vault-primary)]/20 hover:scale-[1.02] transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Create Single Key
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Keys', val: (keys || []).length, icon: 'database', color: 'var(--vault-primary)' },
          { label: 'Active', val: (keys || []).filter(k => !k.is_paused).length, icon: 'check_circle', color: '#34d399' },
          { label: 'Paused', val: (keys || []).filter(k => k.is_paused).length, icon: 'pause_circle', color: '#ffb786' },
          { label: 'Redeemed', val: (keys || []).filter(k => k.current_uses > 0).length, icon: 'bolt', color: 'var(--vault-tertiary)' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 rounded-2xl flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-4">
              <span className="material-symbols-outlined p-2 rounded-lg bg-white/5 border border-white/5 group-hover:border-[var(--vault-primary)]/30 transition-all" style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-[var(--vault-on-surface)]">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-8 mb-8 border-[var(--vault-primary)]/20 bg-gradient-to-br from-[var(--vault-primary)]/5 to-transparent relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[var(--vault-primary)]/5 blur-3xl rounded-full" />
        <div className="flex items-start justify-between mb-6 relative z-10">
          <div>
            <h3 className="text-xl font-bold text-[var(--vault-primary)]">Bulk Generation</h3>
            <p className="text-[var(--vault-on-surface-variant)] text-sm font-medium">Batch create license keys for deployment.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Quantity</label>
            <input 
              className="glass-input w-full px-4 py-3 rounded-xl text-sm" type="number" 
              value={genData.quantity} onChange={(e) => setGenData({...genData, quantity: parseInt(e.target.value)})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Key Type</label>
            <select 
              className="glass-input w-full px-4 py-3 rounded-xl text-sm appearance-none"
              value={genData.type} onChange={(e) => setGenData({...genData, type: e.target.value})}
            >
              <option value="time">Time Based</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Duration</label>
            <div className="flex gap-2">
              {[7, 30, 0].map(d => (
                <button 
                  key={d} 
                  onClick={() => setGenData({...genData, duration: d})}
                  className={`flex-1 py-3 px-2 text-[10px] font-bold rounded-xl border border-white/5 transition-all ${genData.duration === d ? 'bg-[var(--vault-primary)]/20 border-[var(--vault-primary)]/40 text-[var(--vault-primary)]' : 'bg-white/5 text-[var(--vault-on-surface-variant)] hover:border-[var(--vault-primary)]/30'}`}
                >
                  {d === 0 ? 'LIFETIME' : d + ' DAYS'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Expiration (Manual)</label>
            <input 
              className="glass-input w-full px-4 py-3 rounded-xl text-sm" type="datetime-local" 
              value={genData.expires_at} onChange={(e) => setGenData({...genData, expires_at: e.target.value, duration: 0})}
            />
          </div>
          <button 
            disabled={generating}
            onClick={handleGenerate}
            className="bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold py-3.5 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all uppercase tracking-widest text-xs shadow-lg shadow-[var(--vault-primary)]/20 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Execute Generation'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/[0.02] gap-4">
          <h3 className="text-lg font-bold text-[var(--vault-on-surface)]">Recent License Keys</h3>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--vault-on-surface-variant)] text-sm">search</span>
              <input 
                type="text" 
                placeholder="Search keys..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:border-[var(--vault-primary)]/50 transition-colors"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-[var(--vault-on-surface-variant)] focus:outline-none focus:border-[var(--vault-primary)]/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.01]">
                {['License Key', 'Type', 'Status', 'Uses', 'Created', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-[10px] text-[var(--vault-on-surface-variant)] uppercase tracking-widest font-bold border-b border-white/5 ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filteredKeys.map((k) => (
                <tr key={k.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-[var(--vault-primary)] bg-[var(--vault-primary)]/5 px-2 py-1 rounded border border-[var(--vault-primary)]/10">{k.key_value}</code>
                        <button 
                          onClick={() => copy(k.key_value, { label: 'License key copied', description: 'Paste into your app or share with customer.' })}
                          className="opacity-0 group-hover:opacity-100 text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-primary)] transition-all"
                        ><span className="material-symbols-outlined text-base">content_copy</span></button>
                      </div>
                      {(k.note || k.seller_tag) && (
                        <div className="flex gap-2">
                          {k.seller_tag && <span className="text-[9px] text-[var(--vault-tertiary)] uppercase tracking-widest font-bold">[{k.seller_tag}]</span>}
                          {k.note && <span className="text-[10px] text-[var(--vault-on-surface-variant)] line-clamp-1">{k.note}</span>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 font-bold text-xs text-[var(--vault-on-surface)] uppercase">{k.key_type}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full border ${!k.is_paused ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-amber-400/10 text-amber-400 border-amber-400/20'}`}>
                      {!k.is_paused ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-xs text-[var(--vault-on-surface)]">{k.current_uses} / {k.max_uses || '∞'}</td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-[var(--vault-on-surface)]">{new Date(k.created_at).toLocaleDateString()}</p>
                    <p className="text-[9px] text-[var(--vault-on-surface-variant)] uppercase">Expires: {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Lifetime'}</p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setShowEditModal(k);
                          setEditData({ 
                            type: k.key_type, 
                            duration: k.duration_days || 0, 
                            max_uses: k.max_uses || 0, 
                            expires_at: k.expires_at ? new Date(k.expires_at).toISOString().slice(0, 16) : '',
                            note: k.note || '',
                            seller_tag: k.seller_tag || ''
                          });
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-400/10 transition-all text-[var(--vault-on-surface-variant)] hover:text-blue-400"
                        title="Edit Key"
                      ><span className="material-symbols-outlined text-lg">edit</span></button>
                      <button 
                        onClick={() => handleTogglePause(k.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-amber-400/10 transition-all text-[var(--vault-on-surface-variant)] hover:text-amber-400"
                        title={k.is_paused ? 'Resume' : 'Pause'}
                      ><span className="material-symbols-outlined text-lg">{k.is_paused ? 'play_arrow' : 'pause'}</span></button>
                      <button 
                        onClick={() => handleHWIDReset(k.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--vault-primary)]/10 transition-all text-[var(--vault-on-surface-variant)] hover:text-[var(--vault-primary)]"
                        title="Reset HWID"
                      ><span className="material-symbols-outlined text-lg">restart_alt</span></button>
                      <button 
                        onClick={() => handleDelete(k.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-400/10 transition-all text-[var(--vault-on-surface-variant)] hover:text-red-400"
                        title="Delete Key"
                      ><span className="material-symbols-outlined text-lg">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredKeys.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-[var(--vault-on-surface-variant)] mb-4">
                        <span className="material-symbols-outlined text-3xl">key_off</span>
                      </div>
                      <h3 className="text-lg font-bold text-[var(--vault-on-surface)] mb-2">No keys found</h3>
                      <p className="text-[var(--vault-on-surface-variant)] text-sm max-w-sm">
                        {searchTerm || statusFilter !== 'all' 
                          ? "We couldn't find any keys matching your current filters."
                          : "No license keys have been generated for this application yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Key Creation Modal */}
      <AnimatePresence>
      {showSingleModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[var(--vault-surface)]/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-[var(--vault-on-surface)]">Create Single Key</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-[var(--vault-on-surface-variant)] hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSingleGenerate} className="p-8 space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Custom Key (Optional)</label>
                <input 
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs" 
                  placeholder="e.g. SPECIAL-KEY-123"
                  value={singleData.custom_key} onChange={(e) => setSingleData({...singleData, custom_key: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Key Type</label>
                  <select 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs appearance-none"
                    value={singleData.type} onChange={(e) => setSingleData({...singleData, type: e.target.value})}
                  >
                    <option value="time">Time Based</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Duration (Days)</label>
                  <input 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs" type="number" 
                    value={singleData.duration} onChange={(e) => setSingleData({...singleData, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Max Uses (0=∞)</label>
                  <input 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs" type="number" 
                    value={singleData.max_uses} onChange={(e) => setSingleData({...singleData, max_uses: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Expiration (Manual)</label>
                  <input 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs" type="datetime-local" 
                    value={singleData.expires_at} onChange={(e) => setSingleData({...singleData, expires_at: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Note</label>
                <textarea 
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs resize-none h-20" 
                  placeholder="Reason for this key..."
                  value={singleData.note} onChange={(e) => setSingleData({...singleData, note: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowSingleModal(false)} className="flex-1 py-3 rounded-xl border border-white/5 font-bold text-xs uppercase">Cancel</button>
                <button type="submit" disabled={generating} className="flex-1 py-3 rounded-xl bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold text-xs uppercase disabled:opacity-50">
                  {generating ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
      {showEditModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[var(--vault-surface)]/80 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-card w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-xl font-bold text-[var(--vault-on-surface)]">Edit License Key</h3>
              <button onClick={() => setShowEditModal(null)} className="text-[var(--vault-on-surface-variant)] hover:text-red-400 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditKey} className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Key Type</label>
                  <select 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs appearance-none"
                    value={editData.type} onChange={(e) => setEditData({...editData, type: e.target.value})}
                  >
                    <option value="time">Time Based</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Duration (Days)</label>
                  <input 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs" type="number" 
                    value={editData.duration} onChange={(e) => setEditData({...editData, duration: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Max Uses (0=∞)</label>
                  <input 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs" type="number" 
                    value={editData.max_uses} onChange={(e) => setEditData({...editData, max_uses: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Expiration (Manual)</label>
                  <input 
                    className="glass-input w-full px-3 py-2 rounded-xl text-xs" type="datetime-local" 
                    value={editData.expires_at} onChange={(e) => setEditData({...editData, expires_at: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Seller Tag</label>
                <input 
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs" 
                  value={editData.seller_tag} onChange={(e) => setEditData({...editData, seller_tag: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest px-1">Note</label>
                <textarea 
                  className="glass-input w-full px-3 py-2 rounded-xl text-xs resize-none h-20" 
                  value={editData.note} onChange={(e) => setEditData({...editData, note: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditModal(null)} className="flex-1 py-3 rounded-xl border border-white/5 font-bold text-xs uppercase">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-[var(--vault-primary)] text-[var(--vault-on-primary)] font-bold text-xs uppercase">Update Key</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
