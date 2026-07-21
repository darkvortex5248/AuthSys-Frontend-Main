'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Cookie, Shield, Clock, Settings, Database, Mail } from 'lucide-react';

const sections = [
  {
    Icon: Cookie,
    title: 'What Are Cookies',
    body: 'Cookies are small text files stored on your device by your web browser. They help us remember your preferences, authenticate your sessions, and improve your overall experience on the AuthSys platform. Cookies cannot execute code or access your hard drive — they are purely functional data carriers.',
  },
  {
    Icon: Shield,
    title: 'How We Use Cookies',
    body: 'We use cookies for essential platform operations — session authentication, security threat detection, and remembering your UI preferences (sidebar state, theme, accent color). Some cookies are strictly necessary for the platform to function; others help us analyze usage patterns to improve our service.',
    list: [
      'Essential / Strictly Necessary — required for login, API authentication, and basic platform functionality',
      'Preference Cookies — remember your theme, sidebar layout, and dashboard widget order',
      'Analytics Cookies — help us understand which features are most used so we can prioritize development',
      'Security Cookies — detect brute-force attempts, credential stuffing, and unusual access patterns',
    ],
  },
  {
    Icon: Clock,
    title: 'Cookie Duration',
    body: 'Session cookies expire when you close your browser. Persistent cookies remain on your device for up to 30 days unless cleared manually. Authentication tokens are stored securely and rotated regularly. You can clear all cookies at any time through your browser settings.',
  },
  {
    Icon: Settings,
    title: 'Managing Cookies',
    body: 'Most browsers allow you to control cookies through their settings. You can block or delete cookies, but doing so may impact platform functionality — particularly authentication and session management. We recommend keeping essential cookies enabled for the best experience.',
  },
  {
    Icon: Database,
    title: 'Third-Party Cookies',
    body: 'We do not use third-party advertising cookies or sell your browsing data. Limited third-party cookies may be set by our payment processor (Stripe) during checkout transactions. These are strictly confined to the payment page and are governed by Stripe\'s own privacy policy.',
  },
  {
    Icon: Mail,
    title: 'Contact',
    body: 'If you have questions about our use of cookies or want to request a copy of the data we hold, reach out to our privacy team. We respond to all inquiries within 48 hours.',
  },
];

export default function CookiesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] font-sans p-4 md:p-8"
    >
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/25 flex items-center justify-center">
            <Cookie className="w-6 h-6 text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Cookie Policy</h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">Last updated: June 15, 2026</p>
          </div>
        </div>

        <div className="space-y-8">
          {sections.map(({ Icon, title, body, list }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="p-6 rounded-2xl border border-white/5 bg-[var(--color-bg-elevated)]/50 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-lg font-bold text-white">{title}</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{body}</p>
                  {list && (
                    <ul className="space-y-2">
                      {list.map((item: string) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]/50 mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/10 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            By continuing to use AuthSys, you consent to our use of cookies as described in this policy.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
