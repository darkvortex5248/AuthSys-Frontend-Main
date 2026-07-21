'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SystemRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/settings/system/domains'); }, [router]);
  return null;
}
