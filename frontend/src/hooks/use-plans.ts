import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Plan } from '@/types/pricing';

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get<Plan[]>('/billing/plans');
        setPlans((res.data || []).filter(p => p.is_active !== false).sort((a, b) => a.sort_order - b.sort_order));
      } catch (err: any) {
        const { DEFAULT_PLANS } = await import('@/lib/pricing');
        setPlans(DEFAULT_PLANS.filter(p => p.is_active !== false).sort((a, b) => a.sort_order - b.sort_order));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { plans, loading, error, refetch: () => { setLoading(true); setError(null); } };
}
