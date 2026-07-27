import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Game Authentication Platform | RinoxAuth',
  description: 'Protect your games from piracy with hardware-bound authentication and anti-tamper protection.',
  alternates: { canonical: 'https://authsys.dpdns.org/game-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Game Authentication Platform | RinoxAuth"
      description="Protect your games from piracy with hardware-bound authentication and anti-tamper protection."
      h1="Game Authentication Platform"
      intro="Protect your games from piracy with hardware-bound authentication and anti-tamper protection."
      features={['Unity SDK support', 'Unreal Engine support', 'HWID-based licensing', 'Anti-cheat integration', 'Auto-updater']}
      breadcrumbs={[{ name: 'Game Authentication Platform', path: '/game-authentication' }]}
      faqItems={[
        { question: 'What is game authentication platform?', answer: 'Game Authentication Platform is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with game authentication platform?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for game authentication platform?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
