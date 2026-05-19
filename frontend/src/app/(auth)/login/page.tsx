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

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  // If next-auth session has the backend token, save it
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!turnstileToken) {
      toast.error('Please complete the security check');
      setHasError(true);
      setTimeout(() => setHasError(false), 400);
      return;
    }
    try {
      setIsSubmitting(true);
      const formBody = new FormData();
      formBody.append('username', formData.username);
      formBody.append('password', formData.password);
      formBody.append('turnstile_token', turnstileToken as string);
      
      const res = await api.post('/developer/auth/login', formBody);
      const accessToken = res.data.access_token as string;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
      }
      setToken(accessToken);
      const userRes = await api.get('/developer/auth/me');
      setUser(userRes.data);
      setIsSuccess(true);
      toast.success('Logged in successfully');
      router.replace('/dashboard');
      
    } catch (err: any) {
      setHasError(true);
      setTimeout(() => setHasError(false), 400);
      setIsSubmitting(false);
      toast.error(err.response?.data?.detail || 'Invalid credentials');
    }
  };

  const handleSocialSignIn = (provider: string) => {
    if (provider === 'telegram') {
      alert("Telegram authentication is coming soon!");
      return;
    }
    signIn(provider, { callbackUrl: '/dashboard' });
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`w-full max-w-[400px] bg-[#201f1f] rounded-xl border border-white/5 p-8 flex flex-col gap-8 shadow-2xl transition-all duration-300 ${hasError ? 'animate-[shake_0.4s_cubic-bezier(.36,.07,.19,.97)_both] !border-[#ffb4ab] !shadow-[0_0_12px_rgba(255,180,171,0.2)]' : ''} ${isSuccess ? '!border-[#5edac7] !shadow-[0_0_12px_rgba(94,218,199,0.3)]' : ''}`}>
      {/* Tab Switcher */}
      <div className="flex p-1 bg-[#0e0e0e] rounded-full border border-white/5 relative">
        <div className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-[#2a2a2a] rounded-full transition-all duration-300 ease-in-out" style={{ transform: 'translateX(0%)' }}></div>
        <Link href="/login" className="relative flex-1 py-2 text-[13.5px] font-medium leading-[1] text-center text-[#e5e2e1] z-10 transition-colors">Sign in</Link>
        <Link href="/register" className="relative flex-1 py-2 text-[13.5px] font-medium leading-[1] text-center text-[#c8c6c5] z-10 transition-colors">Sign up</Link>
      </div>

      {/* Header Section */}
      <header className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 bg-[#212121] border-[0.5px] border-white/10 rounded-lg flex items-center justify-center overflow-hidden">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12C4 7.58172 7.58172 4 12 4M12 4C16.4183 4 20 7.58172 20 12M12 4V20M4 12C4 16.4183 7.58172 20 12 20M12 20C16.4183 20 20 16.4183 20 12" stroke="#d97757" strokeLinecap="round" strokeWidth="2"></path>
            <circle cx="12" cy="12" fill="#d97757" r="2"></circle>
          </svg>
        </div>
        <div className="space-y-1">
          <h1 className="text-[20px] font-semibold leading-[28px] tracking-[-0.01em] text-[#e5e2e1]">AuthSys</h1>
          <p className="text-[13.5px] font-normal leading-[20px] text-[#c8c6c5]">Welcome back to AuthSys</p>
        </div>
      </header>

      {/* Sign In Form Content */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-2">
          <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#c8c6c5] uppercase">Email or Username</label>
          <div className="relative group rounded-lg border border-white/5 bg-[#212121] transition-all duration-200 focus-within:border-[#d97757] focus-within:shadow-[0_0_12px_rgba(217,119,87,0.13)]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c8c6c5] text-[20px] group-focus-within:text-[#d97757] transition-colors">person</span>
            <input 
              id="username"
              type="text" 
              placeholder="name@example.com"
              className="w-full h-[42px] bg-transparent border-none pl-10 pr-4 text-[13.5px] focus:ring-0 text-[#e5e2e1] placeholder:text-[#3a3a4a] outline-none"
              value={formData.username}
              onChange={(e) => handleInputChange(e, 'username')}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#c8c6c5] uppercase">Password</label>
            <Link href="/forgot-password" className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#d97757] hover:text-[#ffdbd0] transition-colors">Forgot password?</Link>
          </div>
          <div className="relative group rounded-lg border border-white/5 bg-[#212121] transition-all duration-200 focus-within:border-[#d97757] focus-within:shadow-[0_0_12px_rgba(217,119,87,0.13)]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c8c6c5] text-[20px] group-focus-within:text-[#d97757] transition-colors">lock</span>
            <input 
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full h-[42px] bg-transparent border-none pl-10 pr-12 text-[13.5px] focus:ring-0 text-[#e5e2e1] placeholder:text-[#3a3a4a] outline-none"
              value={formData.password}
              onChange={(e) => handleInputChange(e, 'password')}
              required
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8c6c5] hover:text-[#e5e2e1] transition-colors flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center h-5">
            <input 
              id="remember" 
              type="checkbox"
              className="w-4 h-4 rounded bg-[#212121] border-white/10 text-[#d97757] focus:ring-[#d97757] focus:ring-offset-[#131313] cursor-pointer"
            />
          </div>
          <label htmlFor="remember" className="text-[13.5px] font-normal leading-[20px] text-[#c8c6c5] select-none cursor-pointer">Keep me signed in</label>
        </div>

        <div className="py-1">
          <Turnstile onVerify={(token) => setTurnstileToken(token)} />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || isSuccess}
          className={`w-full h-[42px] text-[13.5px] font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]
            ${isSuccess 
              ? 'bg-[#09a493] text-[#00312b]' 
              : 'bg-[#d97757] hover:bg-[#99462a] text-[#541400]'
            }`}
        >
          {isSuccess ? (
            <><span className="material-symbols-outlined text-[20px]">check_circle</span> Success</>
          ) : isSubmitting ? (
            <><span className="material-symbols-outlined text-[20px] animate-spin">sync</span> Validating...</>
          ) : (
            <>Sign in to AuthSys <span className="material-symbols-outlined text-[20px]">login</span></>
          )}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="h-[1px] flex-grow bg-white/5"></div>
          <span className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#c8c6c5] uppercase whitespace-nowrap">OR CONTINUE WITH</span>
          <div className="h-[1px] flex-grow bg-white/5"></div>
        </div>

        {/* Social Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => handleSocialSignIn('google')} type="button" className="h-[42px] bg-[#212121] border border-white/5 hover:border-white/20 rounded-lg flex items-center justify-center transition-all group">
            <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          </button>
          <button onClick={() => handleSocialSignIn('discord')} type="button" className="h-[42px] bg-[#212121] border border-white/5 hover:border-white/20 rounded-lg flex items-center justify-center transition-all group">
            <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" fill="#5865F2" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.947 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.086 2.157 2.419c0 1.334-.946 2.419-2.157 2.419z"/></svg>
          </button>
          <button onClick={() => handleSocialSignIn('telegram')} type="button" className="h-[42px] bg-[#212121] border border-white/5 hover:border-white/20 rounded-lg flex items-center justify-center transition-all group">
            <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" fill="#0088CC" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.79 5.42-1.12 7.19c-.14.75-.42 1-.68 1.03c-.58.05-1.02-.38-1.58-.75c-.88-.58-1.38-.94-2.23-1.5c-.99-.65-.35-1.01.22-1.59c.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02c-.09.02-1.49.95-4.22 2.79c-.4.27-.76.41-1.08.4c-.36-.01-1.04-.2-1.55-.37c-.63-.2-1.12-.31-1.08-.66c.02-.18.27-.36.74-.55c2.92-1.27 4.86-2.11 5.83-2.51c2.78-1.16 3.35-1.36 3.73-1.36c.08 0 .27.02.39.12c.1.08.13.19.14.27c-.01.06.01.24 0 .38z"/></svg>
          </button>
          <button onClick={() => handleSocialSignIn('github')} type="button" className="h-[42px] bg-[#212121] border border-white/5 hover:border-white/20 rounded-lg flex items-center justify-center transition-all group">
            <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" fill="#FFFFFF" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.419 2.865 8.166 6.839 9.489c.5.092.682-.217.682-.482c0-.237-.008-.866-.013-1.7c-2.782.603-3.369-1.341-3.369-1.341c-.454-1.152-1.11-1.459-1.11-1.459c-.908-.62.069-.608.069-.608c1.003.07 1.531 1.03 1.531 1.03c.892 1.529 2.341 1.087 2.91.832c.092-.647.35-1.088.636-1.338c-2.22-.253-4.555-1.11-4.555-4.943c0-1.091.39-1.984 1.029-2.683c-.103-.253-.446-1.27.098-2.647c0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025c.546 1.377.203 2.394.1 2.647c.64.699 1.028 1.592 1.028 2.683c0 3.842-2.339 4.687-4.566 4.935c.359.309.678.92.678 1.855c0 1.338-.012 2.419-.012 2.747c0 .268.18.58.688.482C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
