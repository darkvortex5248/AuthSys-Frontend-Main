'use client';
import { Turnstile as ReactTurnstile } from '@marsidev/react-turnstile';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export default function Turnstile({ onVerify }: TurnstileProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  
  if (!siteKey) return null;

  return (
    <div className="flex justify-center my-4 min-h-[65px]">
      <ReactTurnstile 
        siteKey={siteKey} 
        onSuccess={onVerify}
        options={{
          theme: 'dark' // Or 'light' or 'auto', auto is default, but your app looks dark
        }}
      />
    </div>
  );
}
