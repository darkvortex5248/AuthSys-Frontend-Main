'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

export default function BillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, paymentsRes] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/my-payments')
      ]);
      setPlans(plansRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      console.error("Failed to fetch billing data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#d97757]/20 border-t-[#d97757] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Billing & Plans</h1>
          <p className="text-zinc-500 mt-1">Upgrade your workspace and manage subscriptions</p>
        </div>

        {/* Yearly Toggle */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
           <button 
            onClick={() => setIsYearly(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!isYearly ? 'bg-[#d97757] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             Monthly
           </button>
           <button 
            onClick={() => setIsYearly(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isYearly ? 'bg-[#d97757] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             Yearly
             <span className="text-[9px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Save 20%</span>
           </button>
        </div>
      </div>

      {/* Plans Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const price = isYearly ? plan.price_yearly : plan.price_monthly;
          const isCustom = price === -1;
          
          return (
            <div key={plan.id} className="glass-card bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden group hover:border-[#d97757]/50 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#d97757]/5 blur-3xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100"></div>
              
              <div className="mb-8 relative">
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">
                    {isCustom ? 'Custom' : `$${(price / 100).toFixed(2)}`}
                  </span>
                  {!isCustom && <span className="text-zinc-500 font-bold text-sm">/{isYearly ? 'year' : 'mo'}</span>}
                </div>
              </div>

              {/* Dynamic Features List */}
              <div className="space-y-4 mb-10 flex-1 relative">
                 {(plan.features_json || []).map((feature: string, idx: number) => (
                   <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-green-500 text-[14px] font-bold">check</span>
                      </div>
                      <span className="text-sm text-zinc-300 font-medium">{feature}</span>
                   </div>
                 ))}
                 
                 {/* System Quotas */}
                 <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase tracking-widest font-bold text-[9px]">Apps Limit</span>
                      <span className="text-white font-bold">{plan.max_apps > 100 ? 'Unlimited' : plan.max_apps}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 uppercase tracking-widest font-bold text-[9px]">Keys Quota</span>
                      <span className="text-white font-bold">{plan.max_keys_per_month.toLocaleString()}/mo</span>
                    </div>
                 </div>
              </div>

              <Link 
                href={plan.price_monthly === 0 ? '#' : `/billing/checkout/${plan.id}`}
                className={`w-full py-5 rounded-2xl font-black transition-all text-center uppercase tracking-widest text-xs ${
                  plan.price_monthly === 0 
                    ? 'bg-white/5 text-zinc-500 cursor-not-allowed pointer-events-none' 
                    : 'bg-[#d97757] hover:bg-[#d97757] text-white shadow-xl shadow-[#d97757]/40 hover:-translate-y-1 active:translate-y-0'
                }`}
              >
                {plan.price_monthly === 0 ? 'Active Forever' : `Get ${plan.name}`}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Transaction History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-[#d97757]">history</span>
            Transaction History
          </h2>
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            Manual Verification
          </div>
        </div>
        
        <div className="glass-card bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Order Reference</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Processed On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                     <p className="text-xs font-mono text-zinc-400">#ORD-{p.id.toString().padStart(5, '0')}</p>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-white">
                    ${(p.amount / 100).toFixed(2)}
                  </td>
                  <td className="px-8 py-6">
                     <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                       p.status === 'completed' ? 'bg-green-500/10 text-green-500' : 
                       p.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                     }`}>
                       {p.status}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right text-xs text-zinc-500 font-mono">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-zinc-500 text-sm">
                    No order history found in this workspace.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
