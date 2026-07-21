"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] font-sans p-4 md:p-8"
    >
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition-colors mb-12 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <h1 className="text-4xl font-black mb-8 tracking-tight">Terms of Service</h1>
        
        <div className="prose prose-invert prose-lg max-w-none text-[var(--color-text-secondary)] space-y-6">
          <p className="text-white">Last updated: May 25, 2026</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using the AuthSys platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and AuthSys. If you do not agree to these terms, please do not access or use our Service.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Eligibility</h2>
          <p>You must be at least 18 years of age or the age of legal majority in your jurisdiction to use our Services. By using the Service, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Responsibilities and Conduct</h2>
          <p>You are solely responsible for all activities that occur under your account. You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
            <li>Violate or encourage others to violate any right of a third party, including by infringing or misappropriating any third-party intellectual property right.</li>
            <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of our security infrastructure or any software provided by us.</li>
            <li>Upload, transmit, or distribute any computer viruses, worms, or any software intended to damage or alter a computer system or data.</li>
            <li>Use the Service to facilitate the distribution of malicious or pirated software.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Intellectual Property</h2>
          <p>All content included as part of the Service, such as text, graphics, logos, images, as well as the compilation thereof, and any software used on the Service, is the property of AuthSys or its suppliers and protected by copyright and other laws that protect intellectual property and proprietary rights.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Termination</h2>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Limitation of Liability</h2>
          <p>In no event shall AuthSys, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which AuthSys operates, without regard to its conflict of law provisions.</p>
        </div>
      </div>
    </motion.div>
  );
}
