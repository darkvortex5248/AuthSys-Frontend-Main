import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'JWT Authentication Service | RinoxAuth',
  description: 'Implement secure JWT-based authentication with automatic token refresh and session management.',
  alternates: { canonical: 'https://authsys.dpdns.org/jwt-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="JWT Authentication Service | RinoxAuth"
      description="Implement secure JWT-based authentication with automatic token refresh and session management."
      h1="JWT Authentication Service"
      intro="Implement secure JWT-based authentication with automatic token refresh and session management."
      features={['JWT access and refresh tokens', 'Automatic token rotation', 'Custom claims support', 'RS256 and HS256', 'Token blacklisting']}
      breadcrumbs={[{ name: 'JWT Authentication Service', path: '/jwt-authentication' }]}
      faqItems={[
        { question: 'What is jwt authentication service?', answer: 'JWT Authentication Service is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with jwt authentication service?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for jwt authentication service?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
