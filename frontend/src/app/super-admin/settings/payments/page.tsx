'use client';
import { useEffect, useState } from 'react';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ui/confirm-dialog';

export default function PaymentMethodsPage() {
  const confirm = useConfirm();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await adminApi.get<any[]>('/admin/payment-methods');
      setMethods(res.data);
    } catch (err) {
      toast.error('Failed to load payment methods');
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
      if (editing?.id) {
        await adminApi.put(`/admin/payment-methods/${editing.id}`, data);
      } else {
        await adminApi.post('/admin/payment-methods', data);
      }
      setShowModal(false);
      setEditing(null);
      fetchMethods();
      toast.success('Payment method saved');
    } catch (err) {
      toast.error('Failed to save payment method');
    }
  };

  const deleteMethod = async (id: number) => {
    const ok = await confirm({
      title: 'Delete payment method?',
      message: 'Are you sure you want to delete this payment method?',
      confirmLabel: 'Yes, delete',
      cancelLabel: 'No, cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await adminApi.delete(`/admin/payment-methods/${id}`);
      fetchMethods();
      toast.success('Payment method deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Payment Gateways</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Configure manual and local payment options</p>
        </div>
        <button
          onClick={() => {
            setEditing({});
            setShowModal(true);
          }}
          className="px-4 py-2 bg-[var(--primary)] text-[#131313] rounded-xl font-bold text-xs uppercase"
        >
          Add method
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {methods.map((m) => (
            <div
              key={m.id}
              className="glass-card p-6 rounded-xl flex justify-between items-center border border-white/5"
            >
              <div>
                <p className="font-bold text-[var(--foreground)]">{m.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 uppercase">{m.type}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(m);
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteMethod(m.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <form
            onSubmit={handleSave}
            className="glass-card w-full max-w-md p-8 rounded-2xl space-y-4"
          >
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {editing?.id ? 'Edit' : 'Add'} payment method
            </h2>
            <input
              name="name"
              defaultValue={editing?.name}
              placeholder="Name"
              className="w-full bg-[var(--card)] border border-white/10 rounded-xl py-2 px-3 text-sm"
              required
            />
            <input
              name="type"
              defaultValue={editing?.type}
              placeholder="Type (local / international)"
              className="w-full bg-[var(--card)] border border-white/10 rounded-xl py-2 px-3 text-sm"
              required
            />
            <textarea
              name="instructions"
              defaultValue={editing?.instructions}
              placeholder="Instructions"
              className="w-full bg-[var(--card)] border border-white/10 rounded-xl py-2 px-3 text-sm h-24"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[var(--primary)] text-[#131313] font-bold text-sm"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
