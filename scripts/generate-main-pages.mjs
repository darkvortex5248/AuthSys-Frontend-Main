import { writeFileSync } from 'fs'
import { join } from 'path'

const base = 'D:\\TESTING_ALL\\new_web\\RinoxAuth\\frontend\\src\\app'

const pages = {
  'status': { h1: 'System Status', desc: 'Check the current status of RinoxAuth services. Real-time uptime monitoring for authentication, API, and license validation services.', bread: 'Status' },
  'changelog': { h1: 'Changelog', desc: 'Stay up to date with the latest RinoxAuth platform updates, new features, bug fixes, and improvements.', bread: 'Changelog' },
  'integrations': { h1: 'Integrations', desc: 'Explore RinoxAuth integrations with Discord, Telegram, GitHub, and more. Connect your authentication platform with the tools you use.', bread: 'Integrations' },
  'downloads': { h1: 'Downloads', desc: 'Download RinoxAuth SDKs and tools for C++, C#, Python, JavaScript, Java, and more. Start protecting your software today.', bread: 'Downloads' },
  'api-docs': { h1: 'API Documentation', desc: 'Complete API reference for RinoxAuth authentication and license management REST API. Integrate secure auth into any application.', bread: 'API Docs' },
}

const template = (path, p) => `import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: '${p.bread} | RinoxAuth',
  description: '${p.desc}',
  alternates: { canonical: 'https://authsys.dpdns.org/${path}' },
}

export default function ${p.bread.replace(/ /g, '')}Page() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: '${p.bread}', path: '/${path}' }]} />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">${p.h1}</h1>
          <p className="text-lg text-gray-400 mb-8">${p.desc}</p>
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
`

for (const [path, p] of Object.entries(pages)) {
  const content = template(path, p)
  writeFileSync(join(base, path, 'page.tsx'), content, 'utf8')
  console.log(`Created ${path}`)
}
