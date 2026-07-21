"use client";
import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

export default function AgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'agent', text: string, data?: any}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: cmd }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/developer/agent/command', { command: cmd, context: {} });
      setMessages(prev => [...prev, { role: 'agent', text: res.data.details || 'Action completed.', data: res.data }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'agent', text: 'Error: ' + (e.response?.data?.detail || e.message) }]);
    }
    setLoading(false);
  };

  const quickCommands = ["Generate 10 keys", "Check suspicious activity", "Ban user"];

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-xl z-50 bg-[var(--primary)] hover:bg-[var(--primary)] text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <MessageSquare />}
      </Button>

      {open && (
        <Card className="fixed bottom-24 right-6 w-[400px] h-[550px] shadow-2xl z-50 flex flex-col bg-zinc-950 border-zinc-800 text-zinc-100 overflow-hidden">
          <CardHeader className="border-b border-zinc-800 pb-3 flex-shrink-0 bg-zinc-900/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-[var(--primary)] p-1.5 rounded-md text-white"><MessageSquare size={16} /></span>
              AuthSys AI Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col h-full">
            <div className="flex-1 space-y-4 overflow-y-auto min-h-0">
              {messages.length === 0 && (
                <div className="text-center text-zinc-500 mt-10">
                  <p>How can I help manage your apps today?</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 text-sm rounded-2xl max-w-[85%] ${m.role === 'user' ? 'bg-[var(--primary)] text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'}`}>
                    {m.text}
                  </div>
                  {m.data && m.data.action && (
                    <Badge variant="outline" className="mt-1 text-[10px] border-zinc-700 bg-zinc-900 text-[var(--primary)]">
                      Action: {m.data.action}
                    </Badge>
                  )}
                </div>
              ))}
              {loading && <div className="text-zinc-500 text-xs flex items-center gap-2"><div className="h-1.5 w-1.5 bg-zinc-500 rounded-full animate-bounce"></div> Agent is typing...</div>}
            </div>
            
            <div className="flex-shrink-0 space-y-3 pt-2 mt-auto">
              <div className="flex flex-wrap gap-2">
                {quickCommands.map(cmd => (
                  <Badge key={cmd} variant="secondary" className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-xs font-normal" onClick={() => sendCommand(cmd)}>
                    {cmd}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input 
                  value={input} 
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendCommand(input)}
                  placeholder="Ask me to do anything..." 
                  className="bg-zinc-900 border-zinc-800 text-zinc-100 focus-visible:ring-1 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-0"
                />
                <Button size="icon" onClick={() => sendCommand(input)} disabled={loading} className="bg-[var(--primary)] hover:bg-[var(--primary)] text-white flex-shrink-0">
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
