'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

type AIConfig = {
  provider: string;
  model: string;
  enabled: boolean;
  api_key_set: boolean;
  api_key_preview: string;
  supported_models: string[];
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
  const [enabled, setEnabled] = useState(true);

  const load = async () => {
    try {
      const res = await adminApi.get<AIConfig>('/admin/ai/config');
      setConfig(res.data);
      setProvider(res.data.provider || 'google');
      setModel(res.data.model || 'gemini-2.0-flash');
      setEnabled(res.data.enabled);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load AI config');
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const res = await adminApi.get<{ models: string[] }>('/admin/ai/models');
      setLiveModels(res.data.models || []);
      if (res.data.models?.length) {
        toast.success(`Found ${res.data.models.length} models from Google API`);
      }
    } catch {
      toast.error('Could not list models — save API key first');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        provider,
        model,
        enabled,
      };
      if (apiKey.trim()) {
        payload.api_key = apiKey.trim();
      }
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
      if (apiKey.trim()) {
        await adminApi.put('/admin/ai/config', { api_key: apiKey.trim() });
      }
      const res = await adminApi.post<{ success: boolean; message: string; model?: string }>(
        '/admin/ai/test',
      );
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
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

  const modelOptions = [
    ...new Set([
      ...(config?.supported_models || []),
      ...liveModels,
      model,
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
    ]),
  ].filter(Boolean);

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <div>
        <h1 className="text-3xl font-bold text-[#e5e2e1] tracking-tight">AI Control Center</h1>
        <p className="text-[#8e8ea0] mt-1">
          Switch API keys and models anytime — dashboard chat updates instantly.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-8 border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#e5e2e1]">AI Assistant</p>
            <p className="text-xs text-[#8e8ea0] mt-1">
              {enabled ? 'Developers can use the chat widget' : 'Chat is disabled platform-wide'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
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
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full bg-[#131313]/80 border border-white/10 rounded-xl py-3 px-4 text-sm text-[#e5e2e1]"
          >
            <option value="google">Google Gemini</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-2">
            Model
          </label>
          <div className="flex gap-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="flex-1 bg-[#131313]/80 border border-white/10 rounded-xl py-3 px-4 text-sm text-[#e5e2e1] font-mono"
            >
              {modelOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={loadModels}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#d97757] hover:bg-[#d97757]/10"
            >
              Fetch live
            </button>
          </div>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Or type custom model id e.g. gemini-2.0-flash"
            className="mt-2 w-full bg-[#131313]/50 border border-white/10 rounded-xl py-2.5 px-4 text-xs font-mono text-[#e5e2e1]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#8e8ea0] uppercase tracking-widest mb-2">
            Gemini API Key
          </label>
          {config?.api_key_set && (
            <p className="text-xs text-[#8e8ea0] mb-2 font-mono">
              Current: {config.api_key_preview}
            </p>
          )}
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste new key to replace (leave empty to keep current)"
            className="w-full bg-[#131313]/50 border border-white/10 rounded-xl py-3 px-4 text-sm text-[#e5e2e1] font-mono"
          />
          <p className="text-[10px] text-[#8e8ea0] mt-2">
            Get a key from Google AI Studio. Falls back to GEMINI_API_KEY in server .env if empty.
          </p>
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
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[#e5e2e1] font-bold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6 border border-[#d97757]/20 bg-[#d97757]/5">
        <p className="text-[10px] font-bold text-[#d97757] uppercase tracking-widest mb-2">
          Recommended
        </p>
        <p className="text-sm text-[#8e8ea0] leading-relaxed">
          Use <span className="font-mono text-[#e5e2e1]">gemini-2.0-flash</span> for speed and free
          tier. If you see model not found errors, click Fetch live and pick a listed model.
        </p>
      </div>
    </div>
  );
}


