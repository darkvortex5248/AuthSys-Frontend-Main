import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema, FAQSchema, BreadcrumbSchema } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'FAQ | RinoxAuth - Frequently Asked Questions',
  description: 'Find answers to common questions about RinoxAuth authentication platform, license management, HWID locking, SDK integration, and pricing.',
  alternates: { canonical: 'https://authsys.dpdns.org/faq' },
}

const faqs = [
  { q: 'What is RinoxAuth?', a: 'RinoxAuth is an enterprise-grade authentication and license management platform. It helps software developers protect their applications from piracy, manage license keys, and authenticate users.' },
  { q: 'How does HWID locking work?', a: 'HWID locking generates a unique fingerprint based on the user\'s hardware components and binds the license to it. This prevents the license from being shared or used on unauthorized devices.' },
  { q: 'What programming languages are supported?', a: 'We provide native SDKs for C++, C#, Python, JavaScript/TypeScript, Java, Rust, Go, and more. Our REST API can be used with any language.' },
  { q: 'Is there a free plan?', a: 'Yes. Our Free plan includes essential features like HWID locking, license keys, and device activation for up to 2 applications. Upgrade as your needs grow.' },
  { q: 'Can I migrate from KeyAuth?', a: 'Yes. We provide migration guides and tools to help you transition from KeyAuth to RinoxAuth quickly and smoothly.' },
  { q: 'How secure is the platform?', a: 'RinoxAuth uses industry-standard encryption, secure JWT tokens, and AI-powered threat detection. Our infrastructure is protected by DDoS mitigation and 24/7 monitoring.' },
  { q: 'Do you offer support?', a: 'All plans include access to our documentation and community forum. Paid plans include email support, and Enterprise plans include dedicated support.' },
  { q: 'Can I use RinoxAuth with Unity?', a: 'Yes. We provide a Unity SDK that integrates seamlessly with both Unity and Unreal Engine for game authentication.' },
  { q: 'How do I get started?', a: 'Sign up for a free account, create your application, download the appropriate SDK, and follow our quick-start guide. Most integrations take under 30 minutes.' },
  { q: 'What is the uptime guarantee?', a: 'We guarantee 99.9% uptime for our authentication and license validation services, backed by our global CDN infrastructure.' },
]

export default function FAQPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: 'FAQ', path: '/faq' }]} />
      <FAQSchema questions={faqs.map(f => ({ question: f.q, answer: f.a }))} />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-400 text-center mb-12">Everything you need to know about RinoxAuth.</p>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <summary className="px-6 py-4 cursor-pointer text-white font-medium flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  {faq.q}
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-6 pb-4 text-gray-400 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">Still have questions?</p>
            <Link href="/contact" className="inline-flex px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all">Contact Support</Link>
          </div>
        </div>
      </div>
    </>
  )
}
