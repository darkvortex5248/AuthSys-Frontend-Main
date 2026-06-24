'use client';
import { useSearchParams } from 'next/navigation';
import PremiumLocked from '@/components/PremiumLocked';

export default function PremiumLockedPage() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'Premium Feature';
  const tier = searchParams.get('tier') || 'Seller';

  return <PremiumLocked feature={feature} tier={tier} />;
}
