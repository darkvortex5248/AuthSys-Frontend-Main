import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Launcher Authentication System | RinoxAuth',
  description: 'Build and secure your game launcher with built-in authentication and automatic update capabilities.',
  alternates: { canonical: 'https://authsys.dpdns.org/launcher-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Launcher Authentication System | RinoxAuth"
      description="Build and secure your game launcher with built-in authentication and automatic update capabilities."
      h1="Launcher Authentication System"
      intro="Build and secure your game launcher with built-in authentication and automatic update capabilities."
      features={['Built-in auto-updater', 'License verification', 'Patch management', 'News system', 'User profiles']}
      breadcrumbs={[{ name: 'Launcher Authentication System', path: '/launcher-authentication' }]}
      faqItems={[
        { question: 'What is launcher authentication system?', answer: 'Launcher Authentication System is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with launcher authentication system?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for launcher authentication system?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
