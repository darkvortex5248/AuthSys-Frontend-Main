'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';

export default function TransactionLogsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await adminApi.get<any[]>('/admin/payments');
      setPayments(res.data);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await adminApi.put(`/admin/payments/${id}/status?status=${status}`, {});
      fetchPayments();
      toast.success('Payment status updated');
    } catch (err) {
      toast.error('Failed to update status');
      console.error("Failed to update status", err);
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const exportCSV = () => {
    const headers = ['Transaction ID', 'Developer', 'Method', 'TRX ID', 'Wallet', 'Amount', 'Plan', 'Status', 'Date'];
    const rows = payments.map((p: any) => [
      `#TRX-${p.id.toString().padStart(6, '0')}`,
      p.developer,
      p.method || 'Manual',
      p.trx_id || 'N/A',
      p.wallet || 'None',
      `$${(p.amount / 100).toFixed(2)}`,
      p.plan,
      p.status,
      new Date(p.date).toLocaleString(),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success('Payments exported to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Financial Ledger</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Transaction history and revenue tracking</p>
        </div>
        <div className="flex gap-4 flex-wrap">
           <div className="glass-card rounded-xl px-6 py-2 border border-white/5">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-0.5">Total Revenue</p>
              <p className="text-xl font-black text-green-500">${(totalRevenue / 100).toFixed(2)}</p>
           </div>
           <button onClick={exportCSV} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[var(--foreground)] font-bold transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">download</span>
              Export CSV
            </button>
        </div>
      </div>

      <div className="glass-card rounded-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Transaction</th>
                <th className="px-8 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Developer</th>
                <th className="px-8 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Payment Info</th>
                <th className="px-8 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Plan & Amount</th>
                <th className="px-8 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-5">
                     <p className="text-xs font-mono text-[var(--muted-foreground)]">#TRX-{p.id.toString().padStart(6, '0')}</p>
                  </td>
                  <td className="px-8 py-5">
                     <p className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{p.developer}</p>
                  </td>
                  <td className="px-8 py-5">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] text-[9px] font-black uppercase tracking-tighter">
                             {p.method || 'Manual'}
                           </span>
                           <span className="text-[10px] text-white font-mono">{p.trx_id || 'N/A'}</span>
                        </div>
                        <p className="text-[9px] text-[var(--muted-foreground)]">Wallet: {p.wallet || 'None'}</p>
                     </div>
                  </td>
                  <td className="px-8 py-5">
                     <div className="flex flex-col">
                        <span className="text-sm font-black text-[var(--foreground)]">${(p.amount / 100).toFixed(2)}</span>
                        <span className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{p.plan}</span>
                     </div>
                  </td>
                  <td className="px-8 py-5">
                     <select 
                      value={p.status} 
                      onChange={(e) => updateStatus(p.id, e.target.value)}
                      className={`bg-transparent text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-transparent hover:border-white/20 outline-none cursor-pointer ${p.status === 'completed' ? 'text-green-500' : 'text-[#ffb4ab]'}`}
                     >
                       <option value="pending" className="bg-[#0b0e15] text-[#ffb4ab]">Pending</option>
                       <option value="completed" className="bg-[#0b0e15] text-green-500">Completed</option>
                       <option value="failed" className="bg-[#0b0e15] text-[#ffb4ab]">Failed</option>
                     </select>
                  </td>
                  <td className="px-8 py-5 text-right text-[10px] text-[var(--muted-foreground)] font-mono">
                     {new Date(p.date).toLocaleString()}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-[var(--muted-foreground)] text-sm italic">
                    No transaction records found in the system.
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
