'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/admin/login', { username, password });
      localStorage.setItem('admin_token', res.data.access_token);
      router.push('/super-admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10131a] flex items-center justify-center p-6">
      <style jsx global>{`
        body {
            background-color: #10131a;
            background-image: radial-gradient(circle at 50% -20%, rgba(87, 27, 193, 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 0% 100%, rgba(173, 198, 255, 0.05) 0%, transparent 40%);
        }
      `}</style>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
           <div className="w-16 h-16 rounded-2xl bg-[#adc6ff]/10 flex items-center justify-center shadow-2xl border border-[#adc6ff]/20 mx-auto mb-6">
             <span className="material-symbols-outlined text-3xl text-[#adc6ff]">security</span>
           </div>
           <h1 className="text-3xl font-bold text-[#e1e2ec] mb-2 tracking-tight">System Root Login</h1>
           <p className="text-[#adc6ff] font-medium text-sm uppercase tracking-widest">RinoxAuth Control Panel</p>
        </div>

        <div className="bg-[#1d2027]/60 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#adc6ff]"></div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-[#8c909f] uppercase tracking-[0.2em] mb-2 px-1">Identifier</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8c909f] text-lg group-focus-within:text-[#adc6ff] transition-colors">person</span>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0b0e15]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-[#e1e2ec] focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 transition-all placeholder:text-[#424754]"
                  placeholder="Root username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#8c909f] uppercase tracking-[0.2em] mb-2 px-1">Security Key</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8c909f] text-lg group-focus-within:text-[#adc6ff] transition-colors">lock</span>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0b0e15]/50 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-[#e1e2ec] focus:outline-none focus:ring-2 focus:ring-[#adc6ff]/50 transition-all placeholder:text-[#424754]"
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
              className="w-full bg-[#adc6ff] text-[#00285d] font-bold py-4 rounded-xl shadow-xl shadow-[#adc6ff]/10 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#00285d]/30 border-t-[#00285d] rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined">key</span>
                  Authorize Access
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-[#8c909f] text-[10px] uppercase tracking-widest font-bold">
          Authorized Personnel Only • IP: 127.0.0.1
        </p>
      </div>
    </div>
  );
}
