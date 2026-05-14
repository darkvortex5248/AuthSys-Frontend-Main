'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';

export default function SellerAPIPage() {
  const { selectedAppId } = useAuthStore();
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSellerName, setNewSellerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchSellers = async () => {
    try {
      const res = await api.get('/developer/sellers');
      setSellers(res.data);
    } catch (err) {
      console.error("Failed to fetch sellers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerName) return toast.error("Please enter a seller name");

    try {
      setIsCreating(true);
      await api.post('/developer/sellers', { name: newSellerName });
      toast.success("Seller created successfully!");
      setNewSellerName('');
      fetchSellers();
    } catch (err) {
      toast.error("Failed to create seller");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("API Key copied to clipboard!");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--vault-primary)]"></div>
    </div>
  );

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Seller API</h2>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[var(--vault-on-surface-variant)] uppercase tracking-widest mt-2">
            <span>Third-party</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[var(--vault-primary)]">Key Distribution</span>
          </nav>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
           <div className="text-right">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Public Endpoint</p>
              <p className="text-[11px] font-mono text-[var(--vault-primary)]">/api/v1/developer/sellers/generate-key</p>
           </div>
           <span className="material-symbols-outlined text-white/20">api</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
           <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[var(--vault-primary)]/10 blur-[60px] rounded-full"></div>
              <h4 className="text-sm font-bold text-white mb-6 uppercase tracking-widest relative z-10">Create New Seller</h4>
              <form onSubmit={handleCreateSeller} className="space-y-4 relative z-10">
                 <div className="space-y-2">
                   <label className="text-[10px] text-white/30 font-bold uppercase tracking-widest ml-1">Seller Name</label>
                   <input 
                     type="text"
                     value={newSellerName}
                     onChange={(e) => setNewSellerName(e.target.value)}
                     placeholder="e.g. Shoppy Reseller"
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--vault-primary)] transition-all"
                   />
                 </div>
                 <button 
                   disabled={isCreating}
                   className="w-full py-4 bg-white text-black rounded-2xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                   {isCreating ? 'Creating...' : <><span className="material-symbols-outlined text-sm">add</span> Add Seller</>}
                 </button>
              </form>
           </div>
        </div>

        <div className="lg:col-span-2">
           <div className="glass-card rounded-[2.5rem] border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5">
                    <th className="px-8 py-5 text-[10px] font-bold text-white/40 uppercase tracking-widest">Seller Name</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-white/40 uppercase tracking-widest">API Key</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-white/40 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sellers.map(seller => (
                    <tr key={seller.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-white">{seller.name}</p>
                        <p className="text-[10px] text-white/20 mt-1 uppercase font-bold tracking-tighter">Registered: {new Date(seller.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <code className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded">sk_••••••••••••</code>
                           <button 
                             onClick={() => copyToClipboard(seller.api_key)}
                             className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                           >
                             <span className="material-symbols-outlined text-sm">content_copy</span>
                           </button>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-widest rounded-full">Active</span>
                      </td>
                    </tr>
                  ))}
                  {sellers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center text-zinc-500 text-sm italic">No sellers registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
