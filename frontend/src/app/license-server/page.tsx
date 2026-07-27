import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Cloud License Server | RinoxAuth',
  description: 'Host your license management in the cloud with real-time validation and instant scalability.',
  alternates: { canonical: 'https://authsys.dpdns.org/license-server' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Cloud License Server | RinoxAuth"
      description="Host your license management in the cloud with real-time validation and instant scalability."
      h1="Cloud License Server"
      intro="Host your license management in the cloud with real-time validation and instant scalability."
      features={['Cloud-hosted infrastructure', 'Real-time license validation', 'Automatic scaling', '99.9% uptime SLA', 'Global CDN distribution']}
      breadcrumbs={[{ name: 'Cloud License Server', path: '/license-server' }]}
      faqItems={[
        { question: 'What is cloud license server?', answer: 'Cloud License Server is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with cloud license server?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for cloud license server?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
