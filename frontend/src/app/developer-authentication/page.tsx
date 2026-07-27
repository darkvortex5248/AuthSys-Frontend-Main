import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Developer Authentication Toolkit | RinoxAuth',
  description: 'Everything developers need to implement secure authentication in their applications with minimal code.',
  alternates: { canonical: 'https://authsys.dpdns.org/developer-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Developer Authentication Toolkit | RinoxAuth"
      description="Everything developers need to implement secure authentication in their applications with minimal code."
      h1="Developer Authentication Toolkit"
      intro="Everything developers need to implement secure authentication in their applications with minimal code."
      features={['SDKs for all major languages', 'Comprehensive documentation', 'Quick-start examples', 'API playground', 'Community support']}
      breadcrumbs={[{ name: 'Developer Authentication Toolkit', path: '/developer-authentication' }]}
      faqItems={[
        { question: 'What is developer authentication toolkit?', answer: 'Developer Authentication Toolkit is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with developer authentication toolkit?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for developer authentication toolkit?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
