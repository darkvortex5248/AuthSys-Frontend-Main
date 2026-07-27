import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Authentication SDK for Developers | RinoxAuth',
  description: 'Ready-to-use SDKs that make implementing authentication in your application simple and fast.',
  alternates: { canonical: 'https://authsys.dpdns.org/authentication-sdk' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Authentication SDK for Developers | RinoxAuth"
      description="Ready-to-use SDKs that make implementing authentication in your application simple and fast."
      h1="Authentication SDK for Developers"
      intro="Ready-to-use SDKs that make implementing authentication in your application simple and fast."
      features={['Native C++ SDK', 'C# .NET SDK', 'Python SDK', 'JavaScript/TypeScript SDK', 'Java SDK', 'Rust SDK']}
      breadcrumbs={[{ name: 'Authentication SDK for Developers', path: '/authentication-sdk' }]}
      faqItems={[
        { question: 'What is authentication sdk for developers?', answer: 'Authentication SDK for Developers is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with authentication sdk for developers?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for authentication sdk for developers?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
