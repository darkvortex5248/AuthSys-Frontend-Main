import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Telegram Authentication Integration | RinoxAuth',
  description: 'Authenticate users through Telegram with seamless bot integration and OAuth support.',
  alternates: { canonical: 'https://authsys.dpdns.org/telegram-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Telegram Authentication Integration | RinoxAuth"
      description="Authenticate users through Telegram with seamless bot integration and OAuth support."
      h1="Telegram Authentication Integration"
      intro="Authenticate users through Telegram with seamless bot integration and OAuth support."
      features={['Telegram OAuth login', 'Bot-based verification', 'Group membership checks', 'Push notifications', 'Auto-registration']}
      breadcrumbs={[{ name: 'Telegram Authentication Integration', path: '/telegram-authentication' }]}
      faqItems={[
        { question: 'What is telegram authentication integration?', answer: 'Telegram Authentication Integration is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with telegram authentication integration?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for telegram authentication integration?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
