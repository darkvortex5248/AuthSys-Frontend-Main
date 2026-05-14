'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await api.get('/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMethods(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const token = localStorage.getItem('admin_token');
      if (editing?.id) {
        await api.put(`/admin/payment-methods/${editing.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await api.post('/admin/payment-methods', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(false);
      setEditing(null);
      fetchMethods();
    } catch (err) {
      alert("Failed to save payment method");
    }
  };

  const deleteMethod = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem('admin_token');
      await api.delete(`/admin/payment-methods/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMethods();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#e1e2ec]">Payment Gateways</h1>
          <p className="text-[#8c909f] mt-1">Configure your bKash, Nagad, Rocket and Card settings</p>
        </div>
        <button 
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="px-6 py-2 bg-[#adc6ff] text-[#0b0e15] rounded-xl font-bold hover:bg-white transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          New Method
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {methods.map((m) => (
          <div key={m.id} className="glass-card rounded-2xl p-6 border border-white/5 relative group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#adc6ff]">
                   <span className="material-symbols-outlined text-3xl">{m.icon_name}</span>
                 </div>
                 <div>
                   <h3 className="font-bold text-white">{m.name}</h3>
                   <span className="text-[10px] uppercase tracking-widest text-zinc-500">{m.type}</span>
                 </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditing(m); setShowModal(true); }} className="p-2 hover:bg-white/10 rounded-lg text-blue-400">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onClick={() => deleteMethod(m.id)} className="p-2 hover:bg-red-400/10 rounded-lg text-red-400">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
               <div className="p-3 rounded-xl bg-[#0b0e15]/50 border border-white/5">
                 <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Instructions</p>
                 <p className="text-xs text-[#adc6ff] font-mono break-all line-clamp-2">{m.instructions}</p>
               </div>
               <div className="flex justify-between items-center px-1">
                 <span className="text-[10px] text-zinc-500">Rate: 1 USD = {m.exchange_rate} BDT</span>
                 <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${m.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                   {m.is_active ? 'Active' : 'Disabled'}
                 </span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl animate-in zoom-in duration-200">
             <h2 className="text-xl font-bold mb-6">{editing ? 'Edit Method' : 'New Payment Method'}</h2>
             <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Name</label>
                     <input name="name" defaultValue={editing?.name} placeholder="e.g. bKash" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#adc6ff]" required />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                     <select name="type" defaultValue={editing?.type || 'local'} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#adc6ff]">
                       <option value="local">Local (BD)</option>
                       <option value="international">International</option>
                     </select>
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Instructions / Number</label>
                   <textarea name="instructions" defaultValue={editing?.instructions} placeholder="Send Money to: 017..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#adc6ff] h-24 resize-none" required></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Exchange Rate (BDT)</label>
                     <input type="number" name="exchange_rate" defaultValue={editing?.exchange_rate || 120} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#adc6ff]" required />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 ml-1">Icon (Material)</label>
                     <input name="icon_name" defaultValue={editing?.icon_name || 'payments'} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-[#adc6ff]" required />
                   </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                   <input type="checkbox" name="is_active" defaultChecked={editing ? editing.is_active : true} className="w-4 h-4 rounded border-white/10 bg-white/5 accent-[#adc6ff]" />
                   <span className="text-sm text-zinc-400">Method is active</span>
                </div>

                <div className="flex gap-3 pt-6">
                   <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-colors">Cancel</button>
                   <button type="submit" className="flex-1 py-3 rounded-xl bg-[#adc6ff] text-[#0b0e15] font-bold hover:bg-white transition-colors">Save Gateway</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
