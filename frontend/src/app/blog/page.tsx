import { Metadata } from 'next'
import Link from 'next/link'
import { OrganizationSchema, WebSiteSchema } from '@/lib/seo/json-ld'
import { siteConfig } from '@/lib/seo/site-config'

export const metadata: Metadata = {
  title: 'Blog | RinoxAuth - Authentication & Security Insights',
  description: 'Expert articles on software authentication, license management, HWID protection, and application security. Learn best practices for protecting your software.',
  alternates: { canonical: 'https://authsys.dpdns.org/blog' },
  openGraph: { title: 'Blog | RinoxAuth', description: 'Expert articles on software authentication and security.', type: 'website' },
}

const articles = [
  { slug: 'what-is-hwid', title: 'What is HWID? How Hardware ID Authentication Works', date: '2026-07-28', excerpt: 'Learn what Hardware ID (HWID) is, how HWID authentication works, and why it is essential for software protection against piracy.' },
  { slug: 'how-license-keys-work', title: 'How License Keys Work: A Complete Guide', date: '2026-07-27', excerpt: 'A comprehensive guide to software license keys. Understand key generation, validation, and management for your applications.' },
  { slug: 'how-authentication-apis-work', title: 'How Authentication APIs Work', date: '2026-07-26', excerpt: 'Deep dive into authentication APIs, JWT tokens, session management, and how to integrate secure auth into your applications.' },
  { slug: 'how-to-secure-desktop-applications', title: 'How to Secure Desktop Applications', date: '2026-07-25', excerpt: 'Best practices for securing desktop applications against cracking, reverse engineering, and unauthorized distribution.' },
  { slug: 'software-licensing-guide', title: 'Software Licensing Guide: Choose the Right Model', date: '2026-07-24', excerpt: 'A complete guide to software licensing models including subscription, perpetual, usage-based, and feature-based licensing.' },
  { slug: 'keyauth-alternative', title: 'KeyAuth Alternative: Why RinoxAuth is Better', date: '2026-07-23', excerpt: 'Looking for a KeyAuth alternative? Compare features, pricing, and reliability. Discover why developers choose RinoxAuth.' },
  { slug: 'how-to-prevent-cracking', title: 'How to Prevent Cracking: Software Protection Strategies', date: '2026-07-22', excerpt: 'Effective strategies to prevent software cracking including HWID locking, code obfuscation, integrity checking, and more.' },
  { slug: 'desktop-security-guide', title: 'Desktop Security Guide for Developers', date: '2026-07-21', excerpt: 'A comprehensive security guide for desktop application developers covering authentication, encryption, and anti-tamper techniques.' },
  { slug: 'best-authentication-platform', title: 'Best Authentication Platform for Developers in 2026', date: '2026-07-20', excerpt: 'Compare the best authentication platforms for developers. Features, pricing, SDK support, and more to help you choose.' },
  { slug: 'license-key-best-practices', title: 'License Key Best Practices for Software Vendors', date: '2026-07-19', excerpt: 'Best practices for implementing license key systems. Key generation, validation, security, and user experience tips.' },
  { slug: 'csharp-authentication-tutorial', title: 'C# Authentication Tutorial: Integrate Secure Login', date: '2026-07-18', excerpt: 'Step-by-step tutorial for integrating authentication into your C# .NET applications using RinoxAuth SDK.' },
  { slug: 'cpp-authentication-tutorial', title: 'C++ Authentication Tutorial: Native App Security', date: '2026-07-17', excerpt: 'Learn how to add authentication to your C++ desktop applications with our native SDK. Complete code examples included.' },
  { slug: 'developer-authentication-guide', title: 'Developer Authentication Guide: Best Practices', date: '2026-07-16', excerpt: 'A developer-focused guide to implementing authentication. Covers API design, SDK integration, security patterns, and more.' },
]

export default function BlogPage() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      <div className="min-h-screen bg-[var(--background)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">RinoxAuth Blog</h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Expert insights on software authentication, license management, and application security.
            </p>
          </div>
          <div className="grid gap-8">
            {articles.map((article) => (
              <article key={article.slug} className="group">
                <Link href={`/blog/${article.slug}`} className="block p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-[background-color,box-shadow,border-color] duration-200 ease-out">
                  <time className="text-sm text-gray-500">{article.date}</time>
                  <h2 className="text-xl font-bold text-white mt-2 group-hover:text-blue-400 transition-colors">{article.title}</h2>
                  <p className="text-gray-400 mt-2 leading-relaxed">{article.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm text-blue-400 mt-4 font-medium">
                    Read more <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
