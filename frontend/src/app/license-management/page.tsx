import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'License Management Platform | Software Licensing | RinoxAuth',
  description: 'Complete license management platform for software vendors. Track, manage, and validate software licenses in real-time.',
  alternates: { canonical: 'https://authsys.dpdns.org/license-management' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="License Management Platform | Software Licensing | RinoxAuth"
      description="Complete license management platform for software vendors. Track, manage, and validate software licenses in real-time."
      h1="Software License Management Platform"
      intro="Manage all your software licenses from a single dashboard with real-time analytics, automated notifications, and comprehensive reporting."
      features={['Centralized license dashboard', 'Real-time license tracking and analytics', 'Automated license expiration handling', 'License revocation and suspension tools', 'Detailed usage reports and export']}
      breadcrumbs={[{ name: 'License Management', path: '/license-management' }]}
      faqItems={[
        { question: 'What is license management?', answer: 'License management is the process of creating, distributing, tracking, and maintaining software licenses. It ensures compliance and prevents unauthorized use.' },
        { question: 'Can I automate license renewals?', answer: 'Yes. RinoxAuth supports automated license renewal workflows with email notifications and webhook integration for payment processing.' },
      ]}
    />
  )
}
