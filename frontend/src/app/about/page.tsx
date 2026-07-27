import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema, BreadcrumbSchema } from '@/lib/seo/json-ld'
import { siteConfig } from '@/lib/seo/site-config'

export const metadata: Metadata = {
  title: 'About | RinoxAuth - Enterprise Authentication Platform',
  description: 'Learn about RinoxAuth, our mission to protect software developers from piracy, and our team of security experts.',
  alternates: { canonical: 'https://authsys.dpdns.org/about' },
}

export default function AboutPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: 'About', path: '/about' }]} />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">About RinoxAuth</h1>
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              RinoxAuth is an enterprise-grade authentication and license management platform designed to help software developers protect their applications from piracy and unauthorized access.
            </p>
            <p className="text-gray-400 leading-relaxed mb-6">
              Founded with the mission of making software protection accessible to developers of all sizes, RinoxAuth provides a comprehensive suite of tools for authentication, license management, HWID locking, and real-time threat detection.
            </p>
            <p className="text-gray-400 leading-relaxed mb-6">
              Our platform is trusted by thousands of developers worldwide, protecting everything from indie games to enterprise desktop applications. We are committed to providing reliable, secure, and developer-friendly authentication solutions.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
