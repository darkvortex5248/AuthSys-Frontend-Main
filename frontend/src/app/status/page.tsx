import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Status | RinoxAuth',
  description: 'Check the current status of RinoxAuth services. Real-time uptime monitoring for authentication, API, and license validation services.',
  alternates: { canonical: 'https://authsys.dpdns.org/status' },
}

export default function StatusPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: 'Status', path: '/status' }]} />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">System Status</h1>
          <p className="text-lg text-gray-400 mb-8">Check the current status of RinoxAuth services. Real-time uptime monitoring for authentication, API, and license validation services.</p>
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400">This page is under active development. Check back soon for updates.</p>
          </div>
          <div className="mt-12">
            <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</Link>
          </div>
        </div>
      </div>
    </>
  )
}
