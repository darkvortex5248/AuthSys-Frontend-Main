import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Hardware ID (HWID) Locking | RinoxAuth',
  description: 'Bind your software licenses to specific hardware configurations to prevent unauthorized sharing and piracy.',
  alternates: { canonical: 'https://authsys.dpdns.org/hwid-lock' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Hardware ID (HWID) Locking | RinoxAuth"
      description="Bind your software licenses to specific hardware configurations to prevent unauthorized sharing and piracy."
      h1="Hardware ID (HWID) Locking"
      intro="Bind your software licenses to specific hardware configurations to prevent unauthorized sharing and piracy."
      features={['Hardware-bound licensing', 'Tamper-resistant HWID', 'Controlled HWID resets', 'Device management dashboard', 'Cross-platform HWID']}
      breadcrumbs={[{ name: 'Hardware ID (HWID) Locking', path: '/hwid-lock' }]}
      faqItems={[
        { question: 'What is hardware id (hwid) locking?', answer: 'Hardware ID (HWID) Locking is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with hardware id (hwid) locking?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for hardware id (hwid) locking?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
