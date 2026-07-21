'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useDeveloperMe } from '@/hooks/use-developer-queries';
import api from '@/lib/api';
import PricingGrid from '@/components/pricing/PricingGrid';
import { DEFAULT_PLANS } from '@/lib/pricing';

export default function PricingPage() {
  const { token } = useAuthStore();
  const { data: profile } = useDeveloperMe(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/billing/plans");
        if (res.data?.length > 0) {
          setPlans([...res.data].sort((a, b) => a.sort_order - b.sort_order).filter((p: any) => (p.is_active ?? true) && p.sort_order >= 1 && p.sort_order <= 4 && !/tester/i.test(p.name)));
        } else {
          setPlans(DEFAULT_PLANS);
        }
      } catch (err) {
        console.error("Failed to fetch plans", err);
        setPlans(DEFAULT_PLANS);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="page-wrapper pt-6 space-y-6">
      <div>
        <h2 className="page-title mb-2">
          Choose Your <span className="text-gradient">Plan</span>
        </h2>
        <p className="page-subtitle">
          Select the perfect plan for your needs. Upgrade or downgrade at any time.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="premium-card p-6 space-y-4">
              <div className="h-6 w-32 bg-[var(--accent-opacity-8)] rounded animate-pulse" />
              <div className="h-4 w-24 bg-[var(--accent-opacity-8)] rounded animate-pulse" />
              <div className="h-8 w-20 bg-[var(--accent-opacity-8)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <PricingGrid
          plans={plans}
          isYearly={yearly}
          onToggleYearly={setYearly}
          onSelectPlan={(plan) => window.location.href = '/billing'}
        />
      )}

      <p className="text-center text-xs text-[var(--muted-foreground)]">
        All plans include SSL encryption, 99.9% uptime SLA, and community support.
      </p>
    </div>
  );
}
