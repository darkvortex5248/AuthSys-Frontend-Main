'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { canAccessAI } from '@/lib/plan-access';
import { useDeveloperMe } from '@/hooks/use-developer-queries';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export default function AIChatWidget() {
  const { data: profile } = useDeveloperMe(true);
  const userTier = profile?.subscription_tier;
  const hasAIAccess = canAccessAI(userTier);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with:\n\n• Creating license keys\n• Managing users\n• Getting analytics\n• Documentation and help\n\nWhat would you like to do today?',
      timestamp: new Date()
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);
  const [modelLabel, setModelLabel] = useState('AI');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Don't render if user doesn't have AI access
  if (!hasAIAccess) {
    return null;
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      api
        .get('/ai/providers')
        .then((res) => {
          const defaultProvider = res.data?.default || 'ai';
          setModelLabel(defaultProvider);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input, timestamp: new Date() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setActionResult(null);

    try {
      const res = await api.post('/ai/chat', {
        messages: updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        context: {},
        execute_actions: true
      });

      if (res.data?.content) {
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          content: res.data.content,
          timestamp: new Date()
        }]);
        
        if (res.data.model) {
          setModelLabel(res.data.model);
        }

        if (res.data.action_executed) {
          setActionResult({
            success: res.data.action_result?.success || false,
            message: res.data.action_result?.message || '',
            data: res.data.action_result?.data,
            error: res.data.action_result?.error
          });

          if (res.data.action_result?.success) {
            toast.success(res.data.action_result.message);
          } else {
            toast.error(res.data.action_result.message || 'Action failed');
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I received an empty response. Please try again.', timestamp: new Date() },
        ]);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const errorMsg =
        typeof detail === 'string'
          ? detail
          : 'Sorry, I encountered an error. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: errorMsg, timestamp: new Date() }]);
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#d97757] text-white rounded-full shadow-[0_8px_32px_rgba(217,119,87,0.4)] flex items-center justify-center active:scale-90 transition-transform group overflow-hidden"
      >
        <div
          className={`absolute inset-0 bg-white/10 animate-ping opacity-20 ${isOpen ? 'hidden' : ''}`}
        />
        <span
          className="material-symbols-outlined relative z-10 text-[28px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isOpen ? 'close' : 'smart_toy'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[380px] h-[500px] rounded-2xl shadow-2xl flex flex-col border border-white/[0.08] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[#131313] backdrop-blur-xl">
          <div className="p-4 border-b border-white/[0.08] bg-[#1a1a1a] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d97757]/20 flex items-center justify-center text-[#d97757]">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                smart_toy
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#e5e2e1]">AuthSys AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  {modelLabel}
                </p>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#d97757] text-white rounded-tr-none'
                      : 'bg-[#1a1a1a] text-[#e5e2e1] border border-white/[0.08] rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] p-3 rounded-2xl rounded-tl-none border border-white/[0.08]">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-[#c8c6c5] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#c8c6c5] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-[#c8c6c5] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {actionResult && (
            <div className={`px-4 py-2 border-t border-white/[0.08] ${
              actionResult.success ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}>
              <div className={`flex items-center gap-2 text-xs ${
                actionResult.success ? 'text-emerald-400' : 'text-red-400'
              }`}>
                <span className="material-symbols-outlined text-sm">
                  {actionResult.success ? 'check_circle' : 'error'}
                </span>
                <span>{actionResult.message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="p-4 border-t border-white/[0.08] bg-[#1a1a1a]">
            <div className="relative">
              <input
                className="w-full bg-[#212121] border border-white/[0.08] rounded-xl py-3 pl-4 pr-12 text-xs text-[#e5e2e1] placeholder:text-[#8e8ea0] focus:ring-1 focus:ring-[#d97757]/50 focus:border-[#d97757]/50 outline-none transition-all"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#d97757] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
            <p className="text-[9px] text-center text-[#c8c6c5] mt-3 uppercase tracking-tighter opacity-50 font-bold">
              Powered by {modelLabel}
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

