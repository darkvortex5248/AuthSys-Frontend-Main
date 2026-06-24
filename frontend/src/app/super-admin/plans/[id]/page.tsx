'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

const ICONS = ['explore', 'diamond', 'workspace_premium', 'card_membership', 'rocket', 'stars', 'verified', 'shield', 'lock', 'key', 'speed', 'group'];

const LIMIT_FIELDS = [
  { key: 'max_apps', label: 'Applications' },
  { key: 'max_licenses', label: 'Users & Licenses' },
  { key: 'max_variables', label: 'Cloud Variables' },
  { key: 'max_logs', label: 'Activity Logs' },
  { key: 'max_hashes', label: 'App Hashes' },
  { key: 'max_staff', label: 'Staff / Roles / Resellers' },
  { key: 'max_chatrooms', label: 'Chat Channels' },
  { key: 'audit_log_limit', label: 'Audit Logs Limit' },
];

const BOOLEAN_FIELDS = [
  { key: 'has_ip_tracking', label: 'IP Tracking' },
  { key: 'has_location_tracking', label: 'Location Tracking' },
  { key: 'has_user_panel', label: 'User Panel Access' },
  { key: 'has_staff_management', label: 'Staff Management' },
  { key: 'has_discord_integration', label: 'Discord Bot Integration' },
  { key: 'has_telegram_integration', label: 'Telegram Bot Integration' },
  { key: 'has_api_access', label: 'API Access' },
  { key: 'has_custom_domain', label: 'Custom Domain' },
  { key: 'has_live_chat', label: 'Live Chat' },
  { key: 'has_audit_logs', label: 'Audit Logs' },
  { key: 'has_webhooks', label: 'Webhooks' },
  { key: 'has_white_label', label: 'White Label' },
  { key: 'has_priority_support', label: 'Priority Support' },
  { key: 'has_ssl', label: 'SSL Support' },
  { key: 'has_global_chat', label: 'Global Chat Access' },
  { key: 'has_custom_bot', label: 'Custom Bot Integration' },
  { key: 'has_behavioral_threat_intel', label: 'Behavioral Threat Intelligence' },
  { key: 'has_version_whitelist', label: 'Version Whitelisting' },
];

const FEATURE_PRESETS = [...LIMIT_FIELDS, ...BOOLEAN_FIELDS];

export default function PlanEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params.id === 'new';
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [plan, setPlan] = useState<any>({
    name: '', description: '', icon: 'card_membership',
    price_monthly: 0, price_yearly: 0, discount: 0,
    badge_text: '', badge_color: '#6D5DF6',
    is_recommended: false, is_active: true,
    button_text: 'Choose Plan', button_color: 'var(--primary)',
    sort_order: 1,
    features: [],
    ...Object.fromEntries(LIMIT_FIELDS.map(f => [f.key, 0])),
    ...Object.fromEntries(BOOLEAN_FIELDS.map(f => [f.key, false])),
  });

  useEffect(() => {
    if (isNew) return;
    const fetch = async () => {
      try {
        const res = await adminApi.get<any>(`/admin/plans/${params.id}`);
        const data = res.data;
        setPlan({
          ...Object.fromEntries(LIMIT_FIELDS.map(f => [f.key, data[f.key] ?? 0])),
          ...Object.fromEntries(BOOLEAN_FIELDS.map(f => [f.key, data[f.key] ?? false])),
          ...data,
          features: data.features || [],
        });
      } catch {
        toast.error('Failed to load plan');
        router.push('/super-admin/plans');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [params.id, isNew, router]);

  const set = (key: string, val: any) => setPlan((prev: any) => ({ ...prev, [key]: val }));

  const addFeature = () => {
    const newFeat = { key: `custom_${Date.now()}`, label: 'New Feature', included: true };
    setPlan((prev: any) => ({ ...prev, features: [...(prev.features || []), newFeat] }));
  };

  const removeFeature = (idx: number) => {
    setPlan((prev: any) => ({ ...prev, features: prev.features.filter((_: any, i: number) => i !== idx) }));
  };

  const updateFeature = (idx: number, field: string, val: any) => {
    setPlan((prev: any) => ({
      ...prev,
      features: prev.features.map((f: any, i: number) => i === idx ? { ...f, [field]: val } : f),
    }));
  };

  const moveFeature = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= (plan.features || []).length) return;
    setPlan((prev: any) => {
      const arr = [...prev.features];
      [arr[idx], arr[to]] = [arr[to], arr[idx]];
      return { ...prev, features: arr };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...plan,
        price_monthly: Math.round(plan.price_monthly),
        price_yearly: Math.round(plan.price_yearly),
      };

      if (isNew) {
        await adminApi.post('/admin/plans', payload);
        toast.success('Plan created');
      } else {
        await adminApi.put(`/admin/plans/${params.id}`, payload);
        toast.success('Plan saved');
      }
      router.push('/super-admin/plans');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-1">
            <Link href="/super-admin/plans" className="hover:text-[var(--foreground)]">Plans</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-[var(--foreground)]">{isNew ? 'New Plan' : plan.name}</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">{isNew ? 'Create Plan' : `Edit ${plan.name}`}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/super-admin/plans" className="px-5 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all">Cancel</Link>
          <button onClick={save} disabled={saving}
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</> : 'Save Plan'}
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Plan Name">
            <input value={plan.name} onChange={e => set('name', e.target.value)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" placeholder="e.g., Free, Basic, Plus" />
          </Field>
          <Field label="Icon">
            <select value={plan.icon} onChange={e => set('icon', e.target.value)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]">
              {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
          </Field>
          <Field label="Description" className="md:col-span-2">
            <input value={plan.description || ''} onChange={e => set('description', e.target.value)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" placeholder="Short one-line description" />
          </Field>
        </div>
      </div>

      {/* Pricing */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Monthly Price (cents)">
            <input type="number" value={plan.price_monthly} onChange={e => set('price_monthly', parseInt(e.target.value) || 0)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          </Field>
          <Field label="Yearly Price (cents)">
            <input type="number" value={plan.price_yearly} onChange={e => set('price_yearly', parseInt(e.target.value) || 0)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          </Field>
          <Field label="Discount %">
            <input type="number" value={plan.discount} onChange={e => set('discount', parseInt(e.target.value) || 0)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          </Field>
        </div>
        <div className="text-xs text-[var(--muted-foreground)]">
          Display price: <strong>${(plan.price_monthly / 100).toFixed(0)}</strong> /month or <strong>${(plan.price_yearly / 100).toFixed(0)}</strong> /year
        </div>
      </div>

      {/* Button & Badge */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">Button &amp; Badge</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="CTA Button Text">
            <input value={plan.button_text || ''} onChange={e => set('button_text', e.target.value)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" placeholder="Get Started / Choose Plan" />
          </Field>
          <Field label="Badge Text (optional)">
            <input value={plan.badge_text || ''} onChange={e => set('badge_text', e.target.value)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" placeholder="e.g., Most Popular" />
          </Field>
          <Field label="Badge Color">
            <div className="flex items-center gap-3">
              <input type="color" value={plan.badge_color || '#6D5DF6'} onChange={e => set('badge_color', e.target.value)} className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer" />
              <span className="text-xs text-[var(--muted-foreground)] font-mono">{plan.badge_color}</span>
            </div>
          </Field>
          <Field label="Sort Order">
            <input type="number" value={plan.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
          </Field>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={plan.is_recommended} onChange={e => set('is_recommended', e.target.checked)} className="w-4 h-4 rounded border-white/20 text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-sm text-[var(--foreground)]">Recommended plan</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={plan.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded border-white/20 text-[var(--primary)] focus:ring-[var(--primary)]" />
            <span className="text-sm text-[var(--foreground)]">Active / Visible</span>
          </label>
        </div>
      </div>

      {/* Limits */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">Limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LIMIT_FIELDS.map(f => (
            <Field key={f.key} label={f.label}>
              <input type="number" value={(plan as any)[f.key]} onChange={e => set(f.key, parseInt(e.target.value) || 0)} className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--foreground)]" />
            </Field>
          ))}
        </div>
      </div>

      {/* Boolean Features */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">Feature Toggles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {BOOLEAN_FIELDS.map(f => (
            <label key={f.key} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)]/30 border border-white/5 cursor-pointer hover:bg-[var(--card)]/50 transition-colors">
              <input type="checkbox" checked={(plan as any)[f.key]} onChange={e => set(f.key, e.target.checked)} className="w-4 h-4 rounded border-white/20 text-[var(--primary)] focus:ring-[var(--primary)]" />
              <span className="text-sm text-[var(--foreground)]">{f.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Features (Pricing Card Display) */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-widest">Pricing Card Features</h2>
          <button onClick={addFeature} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:brightness-110">
            <span className="material-symbols-outlined text-sm">add</span> Add Feature
          </button>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">These features appear on the pricing card. Only included features are shown.</p>

        {(plan.features || []).length === 0 ? (
          <div className="text-center py-8 text-sm text-[var(--muted-foreground)]">
            No custom features yet. Click &quot;Add Feature&quot; to add one.
          </div>
        ) : (
          <div className="space-y-2">
            {(plan.features || []).map((feat: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)]/30 border border-white/5">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveFeature(idx, -1)} className="w-5 h-4 flex items-center justify-center rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-[10px]">
                    <span className="material-symbols-outlined" style={{fontSize: '14px'}}>expand_less</span>
                  </button>
                  <button onClick={() => moveFeature(idx, 1)} className="w-5 h-4 flex items-center justify-center rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-[10px]">
                    <span className="material-symbols-outlined" style={{fontSize: '14px'}}>expand_more</span>
                  </button>
                </div>
                <input value={feat.label} onChange={e => updateFeature(idx, 'label', e.target.value)}
                  className="flex-1 bg-transparent border-b border-transparent hover:border-white/10 focus:border-[var(--primary)] px-2 py-1 text-sm text-[var(--foreground)] outline-none transition-colors"
                  placeholder="Feature label" />
                <select value={feat.key} onChange={e => updateFeature(idx, 'key', e.target.value)}
                  className="bg-[var(--card)]/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-[var(--muted-foreground)]">
                  <option value="">— No mapping —</option>
                  {FEATURE_PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                  <input type="checkbox" checked={feat.included} onChange={e => updateFeature(idx, 'included', e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/20 text-[var(--primary)]" />
                  <span className="text-[10px] text-[var(--muted-foreground)]">Show</span>
                </label>
                <button onClick={() => removeFeature(idx)}
                  className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--muted-foreground)] hover:text-red-400 transition-all shrink-0">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview hint */}
      <div className="text-center text-xs text-[var(--muted-foreground)] pb-8">
        Changes are only applied after clicking <strong className="text-[var(--foreground)]">Save Plan</strong>.
        {(plan.features || []).filter((f: any) => f.included).length > 7 && (
          <p className="text-amber-400 mt-1">Only the first 7 included features are shown on pricing cards.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}
