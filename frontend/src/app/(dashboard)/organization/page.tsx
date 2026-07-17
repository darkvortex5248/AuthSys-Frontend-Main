'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/settings/workspace/organization'); }, [router]);
  return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
}
