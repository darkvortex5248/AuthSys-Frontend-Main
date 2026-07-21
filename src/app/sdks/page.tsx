'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Download, ArrowLeft, Box, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

export default function PublicSDKPage() {
  const [sdks, setSdks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSdks = async () => {
      try {
        const res = await api.get('/admin/sdks/public');
        setSdks(res.data.filter((s: any) => s.is_active));
      } catch (err) {
        console.error("Failed to fetch SDKs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSdks();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[#F8F8FF] font-sans selection:bg-[var(--primary)]/30 pb-20">
      {/* Header */}
      <nav className="h-16 border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
            <span className="text-sm font-medium text-[var(--muted-foreground)] group-hover:text-white transition-colors">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--primary)]" />
            <span className="font-bold tracking-tight">AuthSys <span className="text-[var(--primary)]">SDKs</span></span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 pt-20">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Box className="w-3 h-3" />
            Binary Distribution
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Developer SDKs</h1>
          <p className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto leading-relaxed">
            Integrate AuthSys into your software with our native binaries. High-performance, secure, and easy to use.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sdks.map((sdk, i) => (
              <motion.div 
                key={sdk.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all hover:shadow-[0_0_30px_rgba(108,92,231,0.1)]"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                     <span className="material-symbols-outlined text-3xl">{sdk.icon_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest block mb-1">Version</span>
                    <span className="text-sm font-mono text-white">v{sdk.version}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2">{sdk.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-8 leading-relaxed">
                  Native binary for {sdk.name} environments with built-in HWID protection and AI core sync.
                </p>

                <div className="space-y-3 mb-8">
                   {[
                     "Multi-layer HWID binding",
                     "Encrypted API communication",
                     "Real-time threat callbacks",
                     "Automatic updates support"
                   ].map(feat => (
                     <div key={feat} className="flex items-center gap-2 text-xs text-[#666688]">
                       <CheckCircle2 className="w-3 h-3 text-[#00D4AA]" />
                       {feat}
                     </div>
                   ))}
                </div>

                <a 
                  href={sdk.download_url} 
                  target="_blank"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-[var(--primary)] hover:bg-[#7D6FF0] text-white font-bold transition-all shadow-lg shadow-[var(--primary)]/20 active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  Download Binary
                </a>
              </motion.div>
            ))}
            {sdks.length === 0 && (
              <div className="col-span-2 py-20 text-center border border-dashed border-[var(--border)] rounded-3xl">
                <Terminal className="w-12 h-12 text-[#1E1E2E] mx-auto mb-4" />
                <p className="text-[var(--muted-foreground)]">No public SDKs available at this moment.</p>
              </div>
            )}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-16 p-8 rounded-3xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 flex flex-col md:flex-row items-center gap-8">
           <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white shrink-0">
             <FileCode className="w-6 h-6" />
           </div>
           <div className="flex-1 text-center md:text-left">
              <h4 className="text-lg font-bold mb-2">Need a custom implementation?</h4>
              <p className="text-sm text-[#8888AA]">Our enterprise clients get access to custom-built wrappers and source-code access for audit purposes.</p>
           </div>
           <Link href="/register">
             <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-bold transition-all">
               Contact Enterprise
             </button>
           </Link>
        </div>
      </main>
    </div>
  );
}
