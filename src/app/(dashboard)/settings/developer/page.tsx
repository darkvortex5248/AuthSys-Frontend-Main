'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeveloperRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/settings/developer/docs'); }, [router]);
  return null;
}
