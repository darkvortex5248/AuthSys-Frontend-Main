import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Authentication API for Developers | RinoxAuth',
  description: 'Simple, powerful REST API that handles authentication, license validation, and session management for your applications.',
  alternates: { canonical: 'https://authsys.dpdns.org/authentication-api' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Authentication API for Developers | RinoxAuth"
      description="Simple, powerful REST API that handles authentication, license validation, and session management for your applications."
      h1="Authentication API for Developers"
      intro="Simple, powerful REST API that handles authentication, license validation, and session management for your applications."
      features={['RESTful API design', 'JWT-based authentication', 'Session management', 'Rate limiting', 'Webhook integration']}
      breadcrumbs={[{ name: 'Authentication API for Developers', path: '/authentication-api' }]}
      faqItems={[
        { question: 'What is authentication api for developers?', answer: 'Authentication API for Developers is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with authentication api for developers?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for authentication api for developers?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
