import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema, FAQSchema } from '@/lib/seo/json-ld'
import { siteConfig } from '@/lib/seo/site-config'

export const metadata: Metadata = {
  title: 'Features | RinoxAuth - Enterprise Authentication Platform',
  description: 'Explore RinoxAuth features: HWID locking, license management, AI threat detection, developer SDKs, and more. Everything you need to protect your software.',
  alternates: { canonical: 'https://authsys.dpdns.org/features' },
}

const features = [
  { icon: '🔒', title: 'HWID Locking', desc: 'Bind licenses to specific hardware with unique device fingerprinting. Prevent license sharing and piracy.' },
  { icon: '🔑', title: 'License Management', desc: 'Full lifecycle management for license keys including generation, validation, expiration, and revocation.' },
  { icon: '🤖', title: 'AI Threat Detection', desc: 'Real-time AI-powered analysis of authentication patterns to detect and block suspicious activity.' },
  { icon: '📦', title: 'Developer SDKs', desc: 'Native SDKs for C++, C#, Python, JavaScript, Java, Rust, and more. Quick integration in any language.' },
  { icon: '🔐', title: 'JWT Authentication', desc: 'Secure JWT-based authentication with automatic token refresh and session management.' },
  { icon: '🌐', title: 'REST API', desc: 'Full-featured REST API for programmatic access to all authentication and license management features.' },
  { icon: '⚡', title: 'Real-time Monitoring', desc: 'Live dashboard showing active sessions, license usage, and security events as they happen.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Comprehensive analytics with charts, reports, and exportable data about your user base and license usage.' },
  { icon: '🔔', title: 'Webhook Integration', desc: 'Real-time webhooks for license validation, user activity, and security events. Integrate with your existing tools.' },
  { icon: '🛡️', title: 'Anti-Piracy', desc: 'Multi-layered protection including code obfuscation, integrity checking, and anti-debugging measures.' },
  { icon: '🤝', title: 'Discord Integration', desc: 'Authenticate users through Discord OAuth and verify guild membership for community-based access control.' },
  { icon: '📱', title: 'Telegram Bot', desc: 'Telegram bot integration for authentication, license management, and user notifications.' },
]

const category = {
  authentication: ['HWID Locking', 'JWT Authentication', 'REST API', 'Discord Integration', 'Telegram Bot'],
  protection: ['Anti-Piracy', 'AI Threat Detection', 'Code Obfuscation', 'Integrity Checking'],
  management: ['License Management', 'Analytics Dashboard', 'Real-time Monitoring', 'Webhook Integration'],
  development: ['Developer SDKs', 'API Documentation', 'Quick-start Guides', 'Code Examples'],
}

export default function FeaturesPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: 'Features', path: '/features' }]} />
      <FAQSchema questions={[
        { question: 'What is HWID locking?', answer: 'HWID locking binds a software license to a specific computer\'s hardware fingerprint. This prevents the license from being used on unauthorized devices.' },
        { question: 'What programming languages are supported?', answer: 'RinoxAuth provides SDKs for C++, C#, Python, JavaScript, TypeScript, Java, Rust, Go, and more.' },
        { question: 'How does the AI threat detection work?', answer: 'Our AI analyzes authentication patterns in real-time, identifying anomalies such as rapid-fire login attempts, suspicious IP addresses, and unusual usage patterns.' },
      ]} />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Enterprise-Grade Features</h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Everything you need to authenticate users, manage licenses, and protect your software from piracy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/pricing" className="inline-flex px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all">View Pricing</Link>
          </div>
        </div>
      </div>
    </>
  )
}
