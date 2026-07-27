import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Support | RinoxAuth - Get Help',
  description: 'Get support for RinoxAuth. Access documentation, contact our team, or join our community for help with authentication and license management.',
  alternates: { canonical: 'https://authsys.dpdns.org/support' },
}

export default function SupportPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: 'Support', path: '/support' }]} />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Support</h1>
          <p className="text-lg text-gray-400 mb-12">We are here to help you succeed.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]"><h2 className="text-lg font-semibold text-white mb-2">Documentation</h2><p className="text-gray-400 text-sm mb-4">Comprehensive guides and API reference.</p><Link href="/docs" className="text-blue-400 text-sm font-medium">View Docs →</Link></div>
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]"><h2 className="text-lg font-semibold text-white mb-2">Community</h2><p className="text-gray-400 text-sm mb-4">Join our community of developers.</p><Link href="https://discord.gg/rinoxauth" className="text-blue-400 text-sm font-medium">Join Discord →</Link></div>
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]"><h2 className="text-lg font-semibold text-white mb-2">Email Support</h2><p className="text-gray-400 text-sm mb-4">Get help from our team.</p><Link href="/contact" className="text-blue-400 text-sm font-medium">Contact Us →</Link></div>
          </div>
        </div>
      </div>
    </>
  )
}
