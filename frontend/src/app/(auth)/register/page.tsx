'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api';
import Turnstile from '@/components/Turnstile';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
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
      await api.post('/developer/auth/register', { ...formData, turnstile_token: turnstileToken });
      toast.success('Account created! Please verify your email.');
      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
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
           <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Initialize <span className="text-purple-500">Identity</span></h2>
           <p className="text-zinc-500 text-sm font-medium">Join the AuthSys secure infrastructure.</p>
        </div>

        <div className="glass-card p-8 rounded-3xl border border-white/5 shadow-2xl bg-white/[0.01] backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[20px] group-focus-within:text-purple-400 transition-all">account_circle</span>
                <input 
                  id="username"
                  type="text" 
                  placeholder="Unique ID"
                  className="w-full h-[54px] bg-white/[0.02] border border-white/5 pl-12 pr-4 rounded-2xl text-white placeholder:text-zinc-700 focus:border-purple-500/50 focus:bg-white/[0.04] outline-none transition-all text-sm font-medium"
                  value={formData.username}
                  onChange={(e) => handleInputChange(e, 'username')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Communication</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[20px] group-focus-within:text-purple-400 transition-all">mail</span>
                <input 
                  id="email"
                  type="email" 
                  placeholder="Email Address"
                  className="w-full h-[54px] bg-white/[0.02] border border-white/5 pl-12 pr-4 rounded-2xl text-white placeholder:text-zinc-700 focus:border-purple-500/50 focus:bg-white/[0.04] outline-none transition-all text-sm font-medium"
                  value={formData.email}
                  onChange={(e) => handleInputChange(e, 'email')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Security Key</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[20px] group-focus-within:text-purple-400 transition-all">lock</span>
                <input 
                  id="password"
                  type="password" 
                  placeholder="Strong Password"
                  className="w-full h-[54px] bg-white/[0.02] border border-white/5 pl-12 pr-4 rounded-2xl text-white placeholder:text-zinc-700 focus:border-purple-500/50 focus:bg-white/[0.04] outline-none transition-all text-sm font-medium"
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
               Create Identity
               <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">how_to_reg</span>
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-600"><span className="bg-[#0a0a0a] px-4">Existing Member?</span></div>
          </div>

          <Link href="/login" className="w-full h-[56px] rounded-2xl border border-white/5 bg-white/[0.02] text-zinc-400 font-bold text-xs tracking-widest uppercase hover:bg-white/[0.05] hover:text-white transition-all flex items-center justify-center">
             Sign In to Vault
          </Link>
        </div>

        <p className="text-center mt-8 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          Enterprise Security Infrastructure &copy; 2024
        </p>
      </div>
    </>
  );
}
