import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'REST Authentication API | RinoxAuth',
  description: 'Simple and secure REST API for authenticating users and managing sessions across all platforms.',
  alternates: { canonical: 'https://authsys.dpdns.org/rest-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="REST Authentication API | RinoxAuth"
      description="Simple and secure REST API for authenticating users and managing sessions across all platforms."
      h1="REST Authentication API"
      intro="Simple and secure REST API for authenticating users and managing sessions across all platforms."
      features={['RESTful endpoints', 'JSON request/response', 'Bearer token auth', 'Rate limiting', 'API versioning']}
      breadcrumbs={[{ name: 'REST Authentication API', path: '/rest-authentication' }]}
      faqItems={[
        { question: 'What is rest authentication api?', answer: 'REST Authentication API is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with rest authentication api?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for rest authentication api?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
