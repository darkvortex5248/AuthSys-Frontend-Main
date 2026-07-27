import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'API Security Platform | RinoxAuth',
  description: 'Secure your REST and WebSocket APIs with enterprise-grade authentication and protection.',
  alternates: { canonical: 'https://authsys.dpdns.org/api-security' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="API Security Platform | RinoxAuth"
      description="Secure your REST and WebSocket APIs with enterprise-grade authentication and protection."
      h1="API Security Platform"
      intro="Secure your REST and WebSocket APIs with enterprise-grade authentication and protection."
      features={['API key authentication', 'JWT token validation', 'Rate limiting', 'IP whitelisting', 'Request logging']}
      breadcrumbs={[{ name: 'API Security Platform', path: '/api-security' }]}
      faqItems={[
        { question: 'What is api security platform?', answer: 'API Security Platform is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with api security platform?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for api security platform?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
