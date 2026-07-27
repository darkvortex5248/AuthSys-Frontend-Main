import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Secure Login System | RinoxAuth',
  description: 'Enterprise-grade login system with advanced security features to protect your users and applications.',
  alternates: { canonical: 'https://authsys.dpdns.org/secure-login-system' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Secure Login System | RinoxAuth"
      description="Enterprise-grade login system with advanced security features to protect your users and applications."
      h1="Secure Login System"
      intro="Enterprise-grade login system with advanced security features to protect your users and applications."
      features={['Multi-factor authentication', 'Session management', 'Brute force protection', 'Geolocation tracking', 'Suspicious activity alerts']}
      breadcrumbs={[{ name: 'Secure Login System', path: '/secure-login-system' }]}
      faqItems={[
        { question: 'What is secure login system?', answer: 'Secure Login System is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with secure login system?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for secure login system?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
