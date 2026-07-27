import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Integrations | RinoxAuth',
  description: 'Explore RinoxAuth integrations with Discord, Telegram, GitHub, and more. Connect your authentication platform with the tools you use.',
  alternates: { canonical: 'https://authsys.dpdns.org/integrations' },
}

export default function IntegrationsPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: 'Integrations', path: '/integrations' }]} />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Integrations</h1>
          <p className="text-lg text-gray-400 mb-8">Explore RinoxAuth integrations with Discord, Telegram, GitHub, and more. Connect your authentication platform with the tools you use.</p>
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
