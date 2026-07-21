export type DocCategory = {
  title: string;
  href: string;
  icon: string;
  pages: { title: string; href: string; }[];
};

export const DOCS_NAV: DocCategory[] = [
  {
    title: 'Getting Started',
    href: '/docs/getting-started',
    icon: 'rocket_launch',
    pages: [
      { title: 'Installation & Setup',     href: '/docs/getting-started/installation' },
      { title: 'Quickstart Guide',         href: '/docs/getting-started/quickstart' },
      { title: 'Authentication',           href: '/docs/getting-started/authentication' },
      { title: 'Your First App',           href: '/docs/getting-started/first-app' },
    ],
  },
  {
    title: 'Security',
    href: '/docs/security',
    icon: 'shield',
    pages: [
      { title: 'HWID Locking',             href: '/docs/security/hwid' },
      { title: 'Encryption Overview',      href: '/docs/security/encryption' },
      { title: 'Anti-Tamper',              href: '/docs/security/anti-tamper' },
      { title: 'Threat Monitoring',        href: '/docs/security/threat-monitoring' },
    ],
  },
  {
    title: 'SDK Integration',
    href: '/docs/sdk',
    icon: 'code',
    pages: [
      { title: 'JavaScript / TypeScript',  href: '/docs/sdk/javascript' },
      { title: 'Python',                   href: '/docs/sdk/python' },
      { title: 'C# / .NET',               href: '/docs/sdk/csharp' },
      { title: 'C++',                      href: '/docs/sdk/cpp' },
    ],
  },
  {
    title: 'API Reference',
    href: '/docs/api-reference',
    icon: 'api',
    pages: [
      { title: 'Authentication',           href: '/docs/api-reference/auth' },
      { title: 'License Keys',             href: '/docs/api-reference/license-keys' },
      { title: 'User Management',          href: '/docs/api-reference/users' },
      { title: 'Webhooks',                 href: '/docs/api-reference/webhooks' },
    ],
  },
  {
    title: 'License Keys',
    href: '/docs/license-keys',
    icon: 'vpn_key',
    pages: [
      { title: 'Creating Keys',            href: '/docs/license-keys/creating' },
      { title: 'Validation Flow',          href: '/docs/license-keys/validation' },
      { title: 'Key Types',                href: '/docs/license-keys/types' },
      { title: 'Best Practices',           href: '/docs/license-keys/best-practices' },
    ],
  },
  {
    title: 'Dashboard Guide',
    href: '/docs/dashboard',
    icon: 'dashboard',
    pages: [
      { title: 'Analytics',                href: '/docs/dashboard/analytics' },
      { title: 'Audit Logs',               href: '/docs/dashboard/audit-logs' },
      { title: 'Blacklist',                href: '/docs/dashboard/blacklist' },
      { title: 'Variables',                href: '/docs/dashboard/variables' },
      { title: 'Team Management',          href: '/docs/dashboard/team' },
    ],
  },
  {
    title: 'Advanced Features',
    href: '/docs/advanced',
    icon: 'auto_awesome',
    pages: [
      { title: 'AI Assistant',             href: '/docs/advanced/ai-assistant' },
      { title: 'Discord & Telegram Bots',  href: '/docs/advanced/bots' },
      { title: 'In-App Live Chat',         href: '/docs/advanced/chat-rooms' },
      { title: 'Custom Domains',           href: '/docs/advanced/custom-domains' },
      { title: 'Webhooks Guide',           href: '/docs/advanced/webhooks' },
      { title: 'Organizations',            href: '/docs/advanced/organizations' },
      { title: 'Seller API',               href: '/docs/advanced/seller-api' },
      { title: 'Custom Responses',         href: '/docs/advanced/custom-responses' },
      { title: 'Scheduled Actions',        href: '/docs/advanced/scheduled-actions' },
    ],
  },
  {
    title: 'Account Settings',
    href: '/docs/account',
    icon: 'settings',
    pages: [
      { title: 'Two-Factor Auth',          href: '/docs/account/two-factor' },
      { title: 'API Key Management',       href: '/docs/account/api-keys' },
      { title: 'IP Whitelist',             href: '/docs/account/ip-whitelist' },
      { title: 'Notifications',            href: '/docs/account/notifications' },
      { title: 'App Backup & Restore',     href: '/docs/account/backups' },
      { title: 'App Environments',         href: '/docs/account/environments' },
      { title: 'Health Monitoring',        href: '/docs/account/health' },
    ],
  },
  {
    title: 'FAQ',
    href: '/docs/faq',
    icon: 'quiz',
    pages: [
      { title: 'General Questions',        href: '/docs/faq/general' },
      { title: 'Troubleshooting',          href: '/docs/faq/troubleshooting' },
      { title: 'Billing & Plans',          href: '/docs/faq/billing' },
    ],
  },
];

export function getDocPageMeta(href: string): { category: DocCategory; page: { title: string; href: string; } } | null {
  for (const cat of DOCS_NAV) {
    if (cat.href === href) return { category: cat, page: { title: cat.title, href: cat.href } };
    const found = cat.pages.find(p => p.href === href);
    if (found) return { category: cat, page: found };
  }
  return null;
}
