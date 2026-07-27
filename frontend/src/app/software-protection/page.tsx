import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Software Protection & Anti-Piracy | RinoxAuth',
  description: 'Multi-layered software protection to prevent cracking, reverse engineering, and unauthorized distribution.',
  alternates: { canonical: 'https://authsys.dpdns.org/software-protection' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Software Protection & Anti-Piracy | RinoxAuth"
      description="Multi-layered software protection to prevent cracking, reverse engineering, and unauthorized distribution."
      h1="Software Protection & Anti-Piracy"
      intro="Multi-layered software protection to prevent cracking, reverse engineering, and unauthorized distribution."
      features={['Anti-debugging protection', 'Code integrity verification', 'Memory protection', 'Network-based validation', 'Automated ban system']}
      breadcrumbs={[{ name: 'Software Protection & Anti-Piracy', path: '/software-protection' }]}
      faqItems={[
        { question: 'What is software protection & anti-piracy?', answer: 'Software Protection & Anti-Piracy is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with software protection & anti-piracy?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for software protection & anti-piracy?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
