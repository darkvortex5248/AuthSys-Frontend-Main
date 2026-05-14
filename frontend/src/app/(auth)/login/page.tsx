'use client';
import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { signIn, useSession } from 'next-auth/react';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import Turnstile from '@/components/Turnstile';

export default function LoginPage() {
  const router = useRouter();
  const { token, setToken, setUser } = useAuthStore();
  const { data: session, status } = useSession();

  // 1. Redirect if already logged in via token
  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  // 2. If next-auth session has the backend token, save it
  useEffect(() => {
    if (status === "authenticated" && (session as any)?.backendToken) {
      const backendToken = (session as any).backendToken;
      if (token !== backendToken) {
        setToken(backendToken);
        toast.success('Logged in with Google');
      }
    }
  }, [status, session, setToken, token]);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement>,
    name: keyof typeof formData
  ) => {
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!turnstileToken) {
      toast.error('Please complete the security check');
      return;
    }
    try {
      const formBody = new FormData();
      formBody.append('username', formData.username);
      formBody.append('password', formData.password);
      formBody.append('turnstile_token', turnstileToken as string);
      
      const res = await api.post('/developer/auth/login', formBody);
      setToken(res.data.access_token);
      // Fetch user profile
      const userRes = await api.get('/developer/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` }
      });
      setUser(userRes.data);
      toast.success('Logged in successfully');
      // Redirect will be handled by the useEffect watching 'token'
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    }
  };

  const handleGoogleLogin = () => {
    signIn("google");
  };

  return (
    <>
      <div className="animate-in fade-in zoom-in-95 duration-500 max-w-md w-full">
        <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-white/5 mb-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img src="/favicon.ico" alt="AuthSys Logo" className="w-12 h-12 relative z-10 drop-shadow-2xl animate-pulse-slow" />
           </div>
           <h2 className="text-3xl font-bold text-white tracking-tight mb-2">AuthSys <span className="text-purple-500">Gateway</span></h2>
           <p className="text-zinc-500 text-sm font-medium">Secure orchestration for your infrastructure.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-2xl bg-white/[0.01] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Identity</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[20px] group-focus-within:text-purple-400 transition-all">account_circle</span>
                <input 
                  id="username"
                  type="text" 
                  placeholder="Username or Email"
                  className="w-full h-[56px] bg-white/[0.02] border border-white/5 pl-12 pr-4 rounded-2xl text-white placeholder:text-zinc-700 focus:border-purple-500/50 focus:bg-white/[0.04] outline-none transition-all text-sm font-medium"
                  value={formData.username}
                  onChange={(e) => handleInputChange(e, 'username')}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 group">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Security Key</label>
                <Link href="/forgot-password" title="Forgot Password" className="text-[10px] font-bold text-purple-500/60 hover:text-purple-400 transition-all uppercase tracking-widest">Recovery?</Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[20px] group-focus-within:text-purple-400 transition-all">lock</span>
                <input 
                  id="password"
                  type="password" 
                  placeholder="Password"
                  className="w-full h-[56px] bg-white/[0.02] border border-white/5 pl-12 pr-4 rounded-2xl text-white placeholder:text-zinc-700 focus:border-purple-500/50 focus:bg-white/[0.04] outline-none transition-all text-sm font-medium"
                  value={formData.password}
                  onChange={(e) => handleInputChange(e, 'password')}
                  required
                />
              </div>
            </div>
            
            <div className="py-2 opacity-80 hover:opacity-100 transition-opacity">
              <Turnstile onVerify={(token) => setTurnstileToken(token)} />
            </div>

            <button type="submit" className="w-full h-[56px] rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm tracking-widest uppercase shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group">
               Access Vault
               <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">login</span>
            </button>
          </form>

          <div className="relative my-10">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600"><span className="bg-[#0a0a0a] px-4">New to AuthSys?</span></div>
          </div>

          <Link href="/register" className="w-full h-[56px] rounded-2xl border border-white/5 bg-white/[0.02] text-zinc-400 font-bold text-xs tracking-widest uppercase hover:bg-white/[0.05] hover:text-white transition-all flex items-center justify-center">
             Create Secure Account
          </Link>
        </div>

        <p className="text-center mt-8 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          Enterprise Security Infrastructure &copy; 2024
        </p>
      </div>
    </>
  );
}
