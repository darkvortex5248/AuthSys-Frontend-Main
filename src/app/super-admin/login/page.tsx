'use client';
import { useState } from 'react';
import api from '@/lib/api';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/admin/login', { username, password });
      localStorage.setItem('admin_token', res.data.access_token);
      window.location.href = '/super-admin/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <style jsx global>{`
        body {
            background-color: var(--background);
            background-image: radial-gradient(circle at 50% -20%, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 50%),
                              radial-gradient(circle at 0% 100%, color-mix(in srgb, var(--primary) 3%, transparent) 0%, transparent 40%);
        }
      `}</style>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
           <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center shadow-2xl border border-[var(--primary)]/20 mx-auto mb-6">
             <span className="material-symbols-outlined text-3xl text-[var(--primary)]">security</span>
           </div>
           <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2 tracking-tight">System Root Login</h1>
           <p className="text-[var(--primary)] font-medium text-sm uppercase tracking-widest">AuthSys Control Panel</p>
        </div>

        <div className="bg-[var(--card)]/60 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--primary)]"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] mb-2 px-1">Identifier</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-lg group-focus-within:text-[var(--primary)] transition-colors">person</span>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all placeholder:text-[#525250]"
                  placeholder="Root username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-[0.2em] mb-2 px-1">Security Key</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-lg group-focus-within:text-[var(--primary)] transition-colors">lock</span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--card)]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 transition-all placeholder:text-[#525250]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-[#93000a]/10 border border-[#93000a]/20 text-[#ffb4ab] text-xs py-3 px-4 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white font-bold py-4 rounded-xl shadow-xl shadow-[var(--primary)]/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined">key</span>
                  Authorize Access
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-[var(--muted-foreground)] text-[10px] uppercase tracking-widest font-bold">
          Authorized Personnel Only • IP: 127.0.0.1
        </p>
      </div>
    </div>
  );
}
