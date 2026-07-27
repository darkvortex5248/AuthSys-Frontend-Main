import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Cloud Authentication Service | RinoxAuth',
  description: 'Fully managed cloud authentication service that scales with your user base automatically.',
  alternates: { canonical: 'https://authsys.dpdns.org/cloud-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Cloud Authentication Service | RinoxAuth"
      description="Fully managed cloud authentication service that scales with your user base automatically."
      h1="Cloud Authentication Service"
      intro="Fully managed cloud authentication service that scales with your user base automatically."
      features={['Global CDN distribution', 'Automatic scaling', '99.9% uptime SLA', 'Multi-region deployment', 'DDoS protection']}
      breadcrumbs={[{ name: 'Cloud Authentication Service', path: '/cloud-authentication' }]}
      faqItems={[
        { question: 'What is cloud authentication service?', answer: 'Cloud Authentication Service is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with cloud authentication service?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for cloud authentication service?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
