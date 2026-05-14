'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function FunctionsPage() {
  const { selectedAppId } = useAuthStore();
  const [variables, setVariables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchVariables = async () => {
    if (!selectedAppId) return;
    try {
      setLoading(true);
      const res = await api.get(`/developer/variables/${selectedAppId}`);
      setVariables(res.data);
    } catch (err) {
      console.error("Failed to fetch variables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariables();
  }, [selectedAppId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return toast.error("Select an app first");
    if (!newKey || !newValue) return toast.error("Fill all fields");

    try {
      setIsCreating(true);
      await api.post('/developer/variables/create', {
        app_id: selectedAppId,
        key_name: newKey,
        key_value: newValue,
        is_global: isGlobal
      });
      toast.success("Variable/Function added!");
      setNewKey('');
      setNewValue('');
      fetchVariables();
    } catch (err) {
      toast.error("Failed to create variable");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/developer/variables/${id}`);
      toast.success("Variable deleted");
      fetchVariables();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  if (!selectedAppId) return (
    <div className="flex items-center justify-center h-[60vh] text-zinc-500 italic">
      Please select an application from the top menu to manage functions.
    </div>
  );

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-bold text-white tracking-tight">Cloud Functions</h2>
        <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
          <span>Server-side</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[var(--vault-primary)]">Variable & Logic Injections</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1">
            <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
               <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">New Variable</h4>
               <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest ml-1">Key Name</label>
                    <input 
                      type="text"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="e.g. API_ENDPOINT"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest ml-1">Secret Value</label>
                    <textarea 
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter sensitive data..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all min-h-[100px]"
                    />
                  </div>
                  <div className="flex items-center gap-3 px-1">
                     <button 
                       type="button"
                       onClick={() => setIsGlobal(!isGlobal)}
                       className={`w-10 h-5 rounded-full transition-all relative ${isGlobal ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                     >
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isGlobal ? 'left-6' : 'left-1'}`}></div>
                     </button>
                     <span className="text-[10px] font-bold text-white uppercase tracking-widest">Global Access</span>
                  </div>
                  <button 
                    disabled={isCreating}
                    className="w-full py-4 bg-indigo-500 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {isCreating ? 'Adding...' : 'Inject Variable'}
                  </button>
               </form>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div></div>
            ) : variables.length === 0 ? (
              <div className="glass-card p-20 rounded-[2.5rem] border border-white/5 text-center">
                 <p className="text-zinc-500 italic">No variables configured yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                 {variables.map(v => (
                   <div key={v.id} className="glass-card p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400">
                            <span className="material-symbols-outlined">code</span>
                         </div>
                         <div>
                            <h4 className="text-sm font-bold text-white font-mono">{v.key_name}</h4>
                            <p className="text-[10px] text-white/20 truncate max-w-[200px]">{v.key_value}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${v.is_global ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            {v.is_global ? 'Global' : 'Scoped'}
                         </span>
                         <button 
                           onClick={() => handleDelete(v.id)}
                           className="p-2 rounded-xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                         >
                            <span className="material-symbols-outlined text-sm">delete</span>
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
