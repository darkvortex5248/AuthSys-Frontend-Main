'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_MESSAGES: Record<string, string> = {
  license_created: 'License key has been created successfully.',
  license_revoked: 'License key has been revoked.',
  license_expired: 'License key has expired.',
  license_verified: 'License key verified successfully.',
  license_not_found: 'License key not found.',
  key_invalid: 'The provided key is invalid.',
  key_expired: 'The key has expired.',
  key_revoked: 'The key has been revoked.',
  key_disabled: 'The key is disabled.',
  user_banned: 'User has been banned.',
  user_unbanned: 'User has been unbanned.',
  user_not_found: 'User not found.',
  user_already_exists: 'User already exists.',
  hwid_mismatch: 'HWID does not match. Access denied.',
  hwid_not_set: 'HWID is not set for this key.',
  hwid_updated: 'HWID has been updated.',
  ip_blocked: 'Your IP address has been blocked.',
  ip_whitelisted: 'IP address has been whitelisted.',
  auth_failed: 'Authentication failed. Invalid credentials.',
  auth_success: 'Authentication successful.',
  session_expired: 'Session has expired. Please login again.',
  rate_limited: 'Too many requests. Please try again later.',
  invalid_request: 'Invalid request. Please check your input.',
  internal_error: 'An internal error occurred. Please contact support.',
  maintenance_mode: 'System is under maintenance. Please try again later.',
};

const EVENT_GROUPS = [
  {
    key: 'license', label: 'License Keys', icon: 'vpn_key',
    events: ['license_created','license_revoked','license_expired','license_verified','license_not_found'],
  },
  {
    key: 'key', label: 'Key Validation', icon: 'key',
    events: ['key_invalid','key_expired','key_revoked','key_disabled'],
  },
  {
    key: 'user', label: 'Users', icon: 'group',
    events: ['user_banned','user_unbanned','user_not_found','user_already_exists'],
  },
  {
    key: 'hwid', label: 'HWID Protection', icon: 'fingerprint',
    events: ['hwid_mismatch','hwid_not_set','hwid_updated'],
  },
  {
    key: 'security', label: 'Security & Access', icon: 'shield',
    events: ['ip_blocked','ip_whitelisted','auth_failed','auth_success','session_expired'],
  },
  {
    key: 'system', label: 'System', icon: 'settings',
    events: ['rate_limited','invalid_request','internal_error','maintenance_mode'],
  },
];

const ALL_EVENTS = EVENT_GROUPS.flatMap(g => g.events);

export default function ResponsesPage() {
  const confirm = useConfirm();
  const [respMsgs, setRespMsgs] = useState<Record<string, string>>({});
  const [respLoading, setRespLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setRespLoading(true);
    api.get('/developer/responses').then(res => {
      if (res.data) {
        const flat: Record<string, string> = {};
        for (const [key, locales] of Object.entries(res.data)) {
          if (typeof locales === 'object' && locales !== null) {
            const msg = (locales as Record<string, string>).en;
            if (msg) flat[key] = msg;
          }
        }
        setRespMsgs(flat);
      }
    }).catch(() => {}).finally(() => setRespLoading(false));
  }, []);

  const getValue = (eventKey: string): string => {
    if (respMsgs[eventKey] !== undefined && respMsgs[eventKey] !== '') return respMsgs[eventKey];
    return DEFAULT_MESSAGES[eventKey] || '';
  };

  const isCustomized = (eventKey: string): boolean => {
    return respMsgs[eventKey] !== undefined && respMsgs[eventKey] !== '';
  };

  const handleSave = async () => {
    setRespLoading(true);
    try {
      const payload: Record<string, Record<string, string>> = {};
      for (const [key, val] of Object.entries(respMsgs)) {
        if (val.trim() && val !== DEFAULT_MESSAGES[key]) {
          payload[key] = { en: val.trim() };
        }
      }
      await api.put('/developer/responses', payload);
      toast.success('Response messages saved');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save responses');
    } finally {
      setRespLoading(false);
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset all response messages?',
      message: 'This will restore default messages. Custom messages will be lost.',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete('/developer/responses');
      setRespMsgs({});
      toast.success('Responses reset to defaults');
    } catch { toast.error('Failed to reset'); }
  };

  const handleResetEvent = async (eventKey: string) => {
    const newMsgs = { ...respMsgs };
    delete newMsgs[eventKey];
    setRespMsgs(newMsgs);
  };

  const customizedCount = ALL_EVENTS.filter(isCustomized).length;

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="premium-card p-8 md:p-10 space-y-6">
          <div className="sk h-6 w-44 rounded-lg" />
          <div className="sk h-4 w-72 rounded" />
          <div className="space-y-4 mt-6">
            {[1,2,3,4].map(i => <div key={i} className="space-y-3"><div className="sk h-5 w-28 rounded-lg" /><div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(j => <div key={j} className="sk h-14 rounded-xl" />)}</div></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="premium-card p-8 md:p-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold text-[var(--foreground)] mb-1">Response Messages</h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Customize API response messages — <span className="text-[var(--muted-foreground)]/60">{ALL_EVENTS.length} events total, {customizedCount} customized</span>
          </p>
        </div>
      </div>

      {respLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {EVENT_GROUPS.map(group => {
            const isOpen = expandedGroup === group.key;
            return (
              <div key={group.key} className="border border-white/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedGroup(isOpen ? null : group.key)}
                  className="w-full flex items-center gap-3 p-5 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/15 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-[var(--primary)]">{group.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--foreground)]">{group.label}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{group.events.length} events</p>
                  </div>
                  <span className={`material-symbols-outlined text-[20px] text-[var(--muted-foreground)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-5">
                        {group.events.map(eventKey => {
                          const isCustom = isCustomized(eventKey);
                          return (
                            <div key={eventKey} className={`rounded-xl p-4 space-y-3 transition-colors ${
                              isCustom ? 'border border-[var(--primary)]/20 bg-[var(--primary)]/[0.02]' : 'border border-white/5'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                    isCustom ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-white/5 text-[var(--muted-foreground)]'
                                  }`}>
                                    {eventKey}
                                  </span>
                                  {isCustom && (
                                    <span className="text-[9px] text-[var(--primary)] font-bold uppercase tracking-wider flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[11px]">edit</span>
                                      Modified
                                    </span>
                                  )}
                                </div>
                                {isCustom && (
                                  <button onClick={() => handleResetEvent(eventKey)}
                                    className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] hover:text-red-400 transition-colors">
                                    Reset
                                  </button>
                                )}
                              </div>
                              <div className="relative">
                                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--primary)]">chevron_right</span>
                                <input
                                  type="text"
                                  value={getValue(eventKey)}
                                  onChange={e => setRespMsgs(prev => ({ ...prev, [eventKey]: e.target.value }))}
                                  className={`w-full bg-white/5 border rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono outline-none transition-all ${
                                    isCustom
                                      ? 'text-[var(--foreground)] border-[var(--primary)]/30 focus:border-[var(--primary)]/60'
                                      : 'text-[var(--muted-foreground)] border-white/10 focus:border-[var(--primary)]/50'
                                  }`}
                                  placeholder={DEFAULT_MESSAGES[eventKey] || ''}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
        <button onClick={handleSave} disabled={respLoading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-all">
          {respLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[16px]">save</span>}
          Save changes
        </button>
        <button onClick={handleReset} disabled={respLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold disabled:opacity-40 transition-all">
          <span className="material-symbols-outlined text-[16px]">restart_alt</span>
          Reset all
        </button>
        <span className="ml-auto text-[11px] text-[var(--muted-foreground)]/60">
          {customizedCount}/{ALL_EVENTS.length} customized
        </span>
      </div>
    </section>
  );
}
