import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'HWID Authentication System | RinoxAuth',
  description: 'Bind licenses to specific hardware using unique device identifiers for maximum security against piracy.',
  alternates: { canonical: 'https://authsys.dpdns.org/hwid-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="HWID Authentication System | RinoxAuth"
      description="Bind licenses to specific hardware using unique device identifiers for maximum security against piracy."
      h1="HWID Authentication System"
      intro="Bind licenses to specific hardware using unique device identifiers for maximum security against piracy."
      features={['Hardware fingerprinting', 'Multi-component HWID', 'HWID reset management', 'Device group management', 'Anti-spoofing protection']}
      breadcrumbs={[{ name: 'HWID Authentication System', path: '/hwid-authentication' }]}
      faqItems={[
        { question: 'What is hwid authentication system?', answer: 'HWID Authentication System is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with hwid authentication system?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for hwid authentication system?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
