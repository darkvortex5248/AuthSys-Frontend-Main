import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'License Validation API | RinoxAuth',
  description: 'Validate software licenses in real-time with our fast and reliable license verification API.',
  alternates: { canonical: 'https://authsys.dpdns.org/license-validation' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="License Validation API | RinoxAuth"
      description="Validate software licenses in real-time with our fast and reliable license verification API."
      h1="License Validation API"
      intro="Validate software licenses in real-time with our fast and reliable license verification API."
      features={['Real-time validation', 'Offline validation', 'Hardware binding checks', 'Expiration verification', 'Usage tracking']}
      breadcrumbs={[{ name: 'License Validation API', path: '/license-validation' }]}
      faqItems={[
        { question: 'What is license validation api?', answer: 'License Validation API is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with license validation api?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for license validation api?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
