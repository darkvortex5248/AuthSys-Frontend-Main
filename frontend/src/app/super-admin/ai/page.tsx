'use client';

import { useEffect, useMemo, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

type ProviderInfo = {
  id: string;
  label: string;
  default_model: string;
  models: string[];
  key_hint: string;
  docs: string;
};

type AIConfig = {
  provider: string;
  model: string;
  enabled: boolean;
  api_key_set: boolean;
  api_key_preview: string;
  base_url: string;
  supported_models: string[];
  providers: ProviderInfo[];
};

export default function AIControlPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [liveModels, setLiveModels] = useState<string[]>([]);

  const [provider, setProvider] = useState('google');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [enabled, setEnabled] = useState(true);

  const activeProvider = useMemo(
    () => config?.providers?.find((p) => p.id === provider),
    [config?.providers, provider],
  );

  const load = async () => {
    try {
      const res = await adminApi.get<AIConfig>('/admin/ai/config');
      setConfig(res.data);
      setProvider(res.data.provider || 'google');
      setModel(res.data.model || 'gemini-2.0-flash');
      setBaseUrl(res.data.base_url || '');
      setEnabled(res.data.enabled);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load AI config');
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      if (apiKey.trim()) {
        await adminApi.put('/admin/ai/config', {
          provider,
          api_key: apiKey.trim(),
          base_url: baseUrl.trim(),
        });
      }
      const res = await adminApi.get<{ models: string[] }>('/admin/ai/models');
      setLiveModels(res.data.models || []);
      if (res.data.models?.length) {
        toast.success(`Loaded ${res.data.models.length} models`);
      } else {
        toast.info('Using built-in model list for this provider');
      }
    } catch {
      toast.error('Could not fetch models — check API key');
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeProvider && !model) {
      setModel(activeProvider.default_model);
    }
  }, [activeProvider, model]);

  const handleProviderChange = (id: string) => {
    setProvider(id);
    const p = config?.providers?.find((x) => x.id === id);
    if (p) setModel(p.default_model);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { provider, model, enabled, base_url: baseUrl.trim() };
      if (apiKey.trim()) payload.api_key = apiKey.trim();
      const res = await adminApi.put<AIConfig>('/admin/ai/config', payload);
      setConfig(res.data);
      setApiKey('');
      toast.success('AI configuration saved');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      if (apiKey.trim() || baseUrl.trim()) {
        await adminApi.put('/admin/ai/config', {
          provider,
          api_key: apiKey.trim() || undefined,
          base_url: baseUrl.trim(),
          model,
        });
      }
      const res = await adminApi.post<{ success: boolean; message: string }>('/admin/ai/test');
      if (res.data.success) toast.success(res.data.message);
      else toast.error(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#d97757]/20 border-t-[#d97757] rounded-full animate-spin" />
      </div>
    );
  }

  const presetModels = [
    ...new Set([
      ...(activeProvider?.models || []),
      ...(config?.supported_models || []),
      ...liveModels,
      model,
    ]),
  ].filter(Boolean);

  return (
    <div className="space-y-8 max-w-5xl pb-20">
      <div>
        <h1 className="text-3xl font-bold text-[#e5e2e1] tracking-tight">AI Control Center</h1>
        <p className="text-[#8e8ea0] mt-1">
          Google Gemini, OpenAI, Claude, Groq, OpenRouter, or any OpenAI-compatible API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(config?.providers || []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleProviderChange(p.id)}
            className={`text-left glass-card rounded-2xl p-5 border transition-all ${
              provider === p.id
                ? 'border-[#d97757] bg-[#d97757]/10'
                : 'border-white/5 hover:border-white/20'
            }`}
          >
            <p className="font-bold text-[#e5e2e1]">{p.label}</p>
            <p className="text-[10px] text-[#8e8ea0] mt-1 uppercase tracking-widest">{p.id}</p>
            <p className="text-xs text-[#8e8ea0] mt-2 font-mono">{p.default_model}</p>
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-8 border border-white/5 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm font-bold text-[#e5e2e1]">Platform AI Assistant</p>
            <p className="text-xs text-[#8e8ea0] mt-1">
              {enabled ? 'Chat widget active for developers' : 'Chat disabled'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border ${
              enabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-2">
            API Key — {activeProvider?.key_hint || 'Provider key'}
          </label>
          {config?.api_key_set && (
            <p className="text-xs text-[#8e8ea0] mb-2 font-mono">Saved: {config.api_key_preview}</p>
          )}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste API key (leave empty to keep current)"
            className="w-full bg-[#131313]/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-[#e5e2e1]"
          />
          {activeProvider?.docs && (
            <a
              href={activeProvider.docs}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[#d97757] mt-2 inline-block hover:underline"
            >
              Get API key →
            </a>
          )}
        </div>

        {provider === 'custom' && (
          <div>
            <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-2">
              Base URL (OpenAI-compatible)
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full bg-[#131313]/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-[#e5e2e1]"
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-2">
            Model
          </label>
          <div className="flex gap-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="flex-1 bg-[#131313]/80 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-[#e5e2e1]"
            >
              {presetModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadModels}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#d97757]"
            >
              Fetch live
            </button>
          </div>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Custom model id"
            className="mt-2 w-full bg-[#131313]/50 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-mono text-[#e5e2e1]"
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#d97757] text-[#131313] font-bold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save configuration'}
          </button>
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        </div>
      </div>
    </div>
  );
}
