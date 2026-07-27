import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Discord Authentication Integration | RinoxAuth',
  description: 'Authenticate and verify users through Discord with OAuth integration and guild membership checks.',
  alternates: { canonical: 'https://authsys.dpdns.org/discord-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Discord Authentication Integration | RinoxAuth"
      description="Authenticate and verify users through Discord with OAuth integration and guild membership checks."
      h1="Discord Authentication Integration"
      intro="Authenticate and verify users through Discord with OAuth integration and guild membership checks."
      features={['Discord OAuth login', 'Guild membership verification', 'Role-based access control', 'Discord bot integration', 'Webhook notifications']}
      breadcrumbs={[{ name: 'Discord Authentication Integration', path: '/discord-authentication' }]}
      faqItems={[
        { question: 'What is discord authentication integration?', answer: 'Discord Authentication Integration is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with discord authentication integration?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for discord authentication integration?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
