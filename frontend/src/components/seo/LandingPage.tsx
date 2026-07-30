import Link from 'next/link'
import { BreadcrumbSchema, FAQSchema, OrganizationSchema, ProductSchema, SoftwareApplicationSchema, WebSiteSchema } from '@/lib/seo/json-ld'
import { siteConfig } from '@/lib/seo/site-config'

const SITE_URL = siteConfig.url

interface LandingPageProps {
  title: string
  description: string
  h1: string
  intro: string
  features: string[]
  faqItems: { question: string; answer: string }[]
  breadcrumbs: { name: string; path: string }[]
}

export function LandingPageShell({
  description,
  h1,
  intro,
  features,
  faqItems,
  breadcrumbs,
  children,
}: LandingPageProps & { children?: React.ReactNode }) {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <ProductSchema />
      <SoftwareApplicationSchema name={siteConfig.name} description={description} />
      <BreadcrumbSchema items={breadcrumbs} />
      <FAQSchema questions={faqItems} />

      <div className="min-h-screen bg-[var(--background)]">
        <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-xl font-bold text-white">{siteConfig.name}</Link>
              <div className="hidden md:flex items-center gap-8">
                <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">Features</Link>
                <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">Pricing</Link>
                <Link href="/docs" className="text-sm text-gray-300 hover:text-white transition-colors">Docs</Link>
                <Link href="/api-docs" className="text-sm text-gray-300 hover:text-white transition-colors">API</Link>
                <Link href="/sdks" className="text-sm text-gray-300 hover:text-white transition-colors">SDK</Link>
                <Link href="/blog" className="text-sm text-gray-300 hover:text-white transition-colors">Blog</Link>
                <Link href="/faq" className="text-sm text-gray-300 hover:text-white transition-colors">FAQ</Link>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Sign In</Link>
                <Link href="/pricing" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">Get Started</Link>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 via-transparent to-transparent" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/" className="hover:text-white">Home</Link>
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.path} className="flex items-center gap-2">
                    <span>/</span>
                    <Link href={crumb.path} className="hover:text-white">{crumb.name}</Link>
                  </span>
                ))}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
                {h1}
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-10">
                {intro}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Link
                  href="/pricing"
                  className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-[background-color,box-shadow,border-color] duration-200 ease-out hover:shadow-lg"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/docs"
                  className="px-8 py-3 border border-white/10 0 text-gray-300 hover:text-white font-semibold rounded-xl transition-[background-color,box-shadow,border-color] duration-200 ease-out"
                >
                  View Documentation
                </Link>
              </div>
            </div>
          </section>

          <section className="py-20 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white text-center mb-12">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center mb-4">
                      <span className="text-blue-400 font-bold">{i + 1}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature}</h3>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {children}

          <section className="py-20 border-t border-white/5 bg-white/[0.01]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqItems.map((item, i) => (
                  <details key={i} className="group rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                    <summary className="px-6 py-4 cursor-pointer text-white font-medium flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      {item.question}
                      <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="px-6 pb-4 text-gray-400 leading-relaxed">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="py-20 border-t border-white/5">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Join thousands of developers protecting their software with RinoxAuth.
              </p>
              <Link
                href="/pricing"
                className="inline-flex px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-[background-color,box-shadow,border-color] duration-200 ease-out hover:shadow-lg"
              >
                Choose Your Plan
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/5 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h4 className="font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2">
                  {siteConfig.footerItems.product.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Developers</h4>
                <ul className="space-y-2">
                  {siteConfig.footerItems.developers.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Resources</h4>
                <ul className="space-y-2">
                  {siteConfig.footerItems.resources.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">{item.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Company</h4>
                <p className="text-sm text-gray-400">{siteConfig.name}<br />{siteConfig.contact.address}</p>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
