'use client';
import { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0d0d0d] text-[#e5e2e1] selection:bg-[#d97757]/30 selection:text-[#541400] font-sans">
      <style jsx global>{`
        @keyframes shake { 
          10%, 90% { transform: translate3d(-1px, 0, 0); } 
          20%, 80% { transform: translate3d(2px, 0, 0); } 
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 
          40%, 60% { transform: translate3d(4px, 0, 0); } 
        }
      `}</style>
      
      {/* Main Content Canvas */}
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background glow elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d97757] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5edac7] opacity-5 blur-[120px] rounded-full pointer-events-none"></div>
        
        {children}
      </main>
      
      {/* Footer Section */}
      <footer className="w-full py-8 flex flex-col items-center justify-center gap-4 bg-[#131313]">
        <div className="text-[10.5px] font-medium leading-[16px] tracking-[0.07em] text-[#c8c6c5] uppercase">AUTHSYS CORE</div>
        <p className="text-[13.5px] font-normal leading-[20px] text-[#c8c6c5]">© {new Date().getFullYear()} AuthSys. All rights reserved.</p>
        <div className="flex gap-6">
          <Link className="text-[13.5px] font-normal leading-[20px] text-[#c8c6c5] hover:text-[#d97757] transition-opacity duration-200" href="#">Privacy Policy</Link>
          <Link className="text-[13.5px] font-normal leading-[20px] text-[#c8c6c5] hover:text-[#d97757] transition-opacity duration-200" href="#">Terms of Service</Link>
          <Link className="text-[13.5px] font-normal leading-[20px] text-[#c8c6c5] hover:text-[#d97757] transition-opacity duration-200" href="#">Help Center</Link>
        </div>
      </footer>
    </div>
  );
}
