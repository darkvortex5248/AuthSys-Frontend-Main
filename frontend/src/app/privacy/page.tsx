"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-black mb-8 tracking-tight">Privacy Policy</h1>
        
        <div className="prose prose-invert prose-lg max-w-none text-[var(--color-text-secondary)] space-y-6">
          <p className="text-white">Last updated: May 25, 2026</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Introduction</h2>
          <p>Welcome to AuthSys (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy or our practices with regards to your personal information, please contact us at support@authsys.com.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Information We Collect</h2>
          <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Services or otherwise contact us.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Data:</strong> Names, phone numbers, email addresses, mailing addresses, job titles, usernames, passwords, contact preferences, contact or authentication data, billing addresses, debit/credit card numbers, and other similar information.</li>
            <li><strong>Hardware Data:</strong> We collect hardware identifiers (HWID) to ensure our license validation system remains secure and prevents unauthorized software sharing.</li>
            <li><strong>Usage Data:</strong> Information about how you interact with our Services, including IP addresses, browser types, and activity logs within our dashboard.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. How We Use Your Information</h2>
          <p>We use the information we collect or receive:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To facilitate account creation and logon processes.</li>
            <li>To send you marketing and promotional communications.</li>
            <li>To request feedback and to contact you about your use of our Services.</li>
            <li>To enable user-to-user communications.</li>
            <li>To manage user accounts and keep our Services in working order.</li>
            <li>To respond to user inquiries and offer support to users.</li>
            <li>To protect our Services from fraudulent activity, including threat detection and IP/proxy/VPN monitoring.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Data Sharing and Disclosure</h2>
          <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We do not sell your personal data to any third party for marketing purposes.</p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Security of Your Information</h2>
          <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
          
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Policy Updates</h2>
          <p>We may update this privacy policy from time to time. The updated version will be indicated by an updated &quot;Last updated&quot; date and the updated version will be effective as soon as it is accessible.</p>
        </div>
      </div>
    </motion.div>
  );
}
