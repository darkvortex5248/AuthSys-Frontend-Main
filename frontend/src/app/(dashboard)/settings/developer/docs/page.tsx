'use client';
import Link from 'next/link';

export default function DocsPage() {
  const categories = [
    { title: 'Getting Started', icon: 'rocket_launch', href: '/docs/getting-started', pages: ['Installation & Setup', 'Quickstart Guide', 'Authentication', 'Your First App'], color: '#8b5cf6' },
    { title: 'Security', icon: 'shield', href: '/docs/security', pages: ['HWID Locking', 'Encryption Overview', 'Anti-Tamper', 'Threat Monitoring'], color: '#ef4444' },
    { title: 'SDK Integration', icon: 'code', href: '/docs/sdk', pages: ['JavaScript/TypeScript', 'Python', 'C#/.NET', 'C++'], color: '#06b6d4' },
    { title: 'API Reference', icon: 'api', href: '/docs/api-reference', pages: ['Authentication', 'License Keys', 'User Management', 'Webhooks'], color: '#f59e0b' },
    { title: 'License Keys', icon: 'vpn_key', href: '/docs/license-keys', pages: ['Creating Keys', 'Validation Flow', 'Key Types', 'Best Practices'], color: '#10b981' },
    { title: 'Dashboard Guide', icon: 'dashboard', href: '/docs/dashboard', pages: ['Analytics', 'Audit Logs', 'Blacklist', 'Variables', 'Team Management'], color: '#3b82f6' },
    { title: 'FAQ', icon: 'quiz', href: '/docs/faq', pages: ['General Questions', 'Troubleshooting', 'Billing & Plans'], color: '#ec4899' },
  ];

  return (
    <section className="premium-card p-8 md:p-10">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-1">Documentation</h3>
        <p className="text-sm text-[var(--muted-foreground)]">Explore guides, references, and FAQs to get the most out of the platform.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <Link key={cat.title} href={cat.href}
            className="group premium-card p-5 hover:border-white/20 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="stat-icon-circle" style={{ background: cat.color + '15', color: cat.color }}>
                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
              </div>
              <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{cat.title}</h4>
            </div>
            <ul className="space-y-1.5">
              {cat.pages.map(p => (
                <li key={p} className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Browse {cat.title}</span>
              <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
