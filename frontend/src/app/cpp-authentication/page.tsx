import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'C++ Authentication SDK | RinoxAuth',
  description: 'Native C++ SDK for high-performance authentication in desktop applications.',
  alternates: { canonical: 'https://authsys.dpdns.org/cpp-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="C++ Authentication SDK | RinoxAuth"
      description="Native C++ SDK for high-performance authentication in desktop applications."
      h1="C++ Authentication SDK"
      intro="Native C++ SDK for high-performance authentication in desktop applications."
      features={['Native performance', 'Header-only option', 'CMake integration', 'Cross-platform support', 'Minimal dependencies']}
      breadcrumbs={[{ name: 'C++ Authentication SDK', path: '/cpp-authentication' }]}
      faqItems={[
        { question: 'What is c++ authentication sdk?', answer: 'C++ Authentication SDK is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with c++ authentication sdk?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for c++ authentication sdk?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
