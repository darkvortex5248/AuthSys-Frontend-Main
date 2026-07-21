'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import adminApi from '@/lib/admin-api';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, DollarSign, Save, X, CheckCircle
} from 'lucide-react';

interface PricingItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: string;
  features: string[] | null;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_cycle: string;
  features: string;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

export default function PricingItemsPage() {
  const [items, setItems] = useState<PricingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PricingItem | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billing_cycle: 'monthly',
    features: '',
    is_active: true,
    is_popular: false,
    sort_order: 0,
  });

  const fetchItems = async () => {
    try {
      const res = await adminApi.get<PricingItem[]>('/admin/pricing/items');
      setItems(res.data || []);
    } catch (error) {
      toast.error('Failed to load pricing items');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item?: PricingItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price,
        currency: item.currency,
        billing_cycle: item.billing_cycle,
        features: item.features?.join('\n') || '',
        is_active: item.is_active,
        is_popular: item.is_popular,
        sort_order: item.sort_order,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: '',
        is_active: true,
        is_popular: false,
        sort_order: items.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billing_cycle: 'monthly',
      features: '',
      is_active: true,
      is_popular: false,
      sort_order: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim()),
      };

      if (editingItem) {
        await adminApi.put(`/admin/pricing/items/${editingItem.id}`, payload);
        toast.success('Pricing item updated successfully');
      } else {
        await adminApi.post('/admin/pricing/items', payload);
        toast.success('Pricing item created successfully');
      }

      handleCloseModal();
      fetchItems();
    } catch (error) {
      toast.error(editingItem ? 'Failed to update pricing item' : 'Failed to create pricing item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this pricing item?')) return;
    
    try {
      await adminApi.delete(`/admin/pricing/items/${id}`);
      toast.success('Pricing item deleted successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete pricing item');
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Pricing Items</h1>
          <p className="text-[var(--muted-foreground)] mt-1">Manage pricing menu items and add-ons</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="h-6 w-32 bg-[var(--accent-opacity-8)] rounded animate-pulse" />
              <div className="h-4 w-24 bg-[var(--accent-opacity-8)] rounded animate-pulse" />
              <div className="h-8 w-20 bg-[var(--accent-opacity-8)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-xl bg-[var(--accent-opacity-8)] border border-[var(--border)] flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No pricing items yet</h3>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Create your first pricing item to get started
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-6 relative overflow-hidden group ${
                item.is_popular ? 'border-[var(--primary)]/50' : ''
              }`}
            >
              {item.is_popular && (
                <div className="absolute top-0 right-0 bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">{item.description}</p>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-[var(--foreground)]">
                    {formatPrice(item.price, item.currency)}
                  </span>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    /{item.billing_cycle}
                  </span>
                </div>

                {item.features && item.features.length > 0 && (
                  <div className="space-y-2">
                    {item.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                        <CheckCircle className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border)]">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    item.is_active 
                      ? 'bg-[var(--success)]/10 text-[var(--success)]' 
                      : 'bg-[var(--destructive)]/10 text-[var(--destructive)]'
                  }`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Order: {item.sort_order}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-[var(--foreground)] px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            >
              <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-[var(--foreground)]">
                    {editingItem ? 'Edit Pricing Item' : 'Add Pricing Item'}
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="w-8 h-8 rounded-lg bg-[var(--accent-opacity-8)] hover:bg-[var(--destructive)]/15 text-[var(--muted-foreground)] hover:text-[var(--destructive)] flex items-center justify-center transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      placeholder="e.g., Pro Plan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      placeholder="Plan description..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Price (cents)</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                        placeholder="9900"
                        required
                      />
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
                        Enter price in cents (e.g., 9900 = $99.00)
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Billing Cycle</label>
                      <select
                        value={formData.billing_cycle}
                        onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="one-time">One-time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest mb-2">Features (one per line)</label>
                    <textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Active</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_popular}
                        onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-[var(--foreground)]">Popular</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-[var(--foreground)] px-4 py-3 rounded-lg text-sm font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[var(--primary)] text-white px-4 py-3 rounded-lg text-sm font-bold hover:brightness-110 transition-all"
                    >
                      <Save className="w-4 h-4 inline mr-2" />
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
