import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'License Key Authentication System | License Management | RinoxAuth',
  description: 'Secure license key authentication and management system. Generate, validate, and manage software license keys with ease.',
  alternates: { canonical: 'https://authsys.dpdns.org/license-key-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="License Key Authentication System | License Management | RinoxAuth"
      description="Secure license key authentication and management system. Generate, validate, and manage software license keys with ease."
      h1="License Key Authentication & Management"
      intro="Full-featured license key system with support for time-based, lifetime, and usage-based licenses. Manage thousands of keys from a single dashboard."
      features={[
        'Automatic license key generation with bulk import',
        'Time-based, lifetime, and usage-based license types',
        'Real-time key validation and status tracking',
        'Bulk key generation for enterprise deployments',
        'REST API for programmatic license management',
        'Automated expiration and renewal notifications',
      ]}
      breadcrumbs={[{ name: 'License Key Authentication', path: '/license-key-authentication' }]}
      faqItems={[
        { question: 'What types of license keys are supported?', answer: 'RinoxAuth supports time-based (subscription), lifetime (perpetual), and usage-based (metered) license keys. Each can be customized with specific features.' },
        { question: 'Can I generate keys in bulk?', answer: 'Yes. You can generate thousands of license keys at once through the dashboard or API. Support for CSV import is also available for migrating existing keys.' },
        { question: 'How are license keys validated?', answer: 'License keys are validated in real-time through our REST API. Each validation checks key status, expiration date, and hardware binding status.' },
      ]}
    />
  )
}
