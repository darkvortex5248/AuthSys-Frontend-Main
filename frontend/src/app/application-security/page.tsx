import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Application Security Platform | RinoxAuth',
  description: 'Multi-layered security to protect your applications from piracy, tampering, and unauthorized access.',
  alternates: { canonical: 'https://authsys.dpdns.org/application-security' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Application Security Platform | RinoxAuth"
      description="Multi-layered security to protect your applications from piracy, tampering, and unauthorized access."
      h1="Application Security Platform"
      intro="Multi-layered security to protect your applications from piracy, tampering, and unauthorized access."
      features={['Code obfuscation', 'Anti-tamper protection', 'Integrity checking', 'Memory protection', 'Debugger detection']}
      breadcrumbs={[{ name: 'Application Security Platform', path: '/application-security' }]}
      faqItems={[
        { question: 'What is application security platform?', answer: 'Application Security Platform is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with application security platform?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for application security platform?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
