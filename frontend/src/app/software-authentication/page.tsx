import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Software Authentication | Protect Your Applications | RinoxAuth',
  description: 'Enterprise-grade software authentication platform. Protect your desktop and web applications with HWID locking, license keys, and AI-powered threat detection.',
  alternates: { canonical: 'https://authsys.dpdns.org/software-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Software Authentication | Protect Your Applications | RinoxAuth"
      description="Enterprise-grade software authentication platform. Protect your desktop and web applications with HWID locking, license keys, and AI-powered threat detection."
      h1="Enterprise Software Authentication Platform"
      intro="Protect your software from piracy and unauthorized access with RinoxAuth\u2019s comprehensive authentication platform. Trusted by thousands of developers worldwide."
      features={[
        'Hardware ID (HWID) device locking prevents license sharing',
        'Automated license key generation and real-time validation',
        'AI-powered threat detection and anomaly monitoring',
        'Cross-platform SDK support for Windows, macOS, and Linux',
        'Real-time session monitoring and instant revocation',
        '99.9% uptime with global cloud infrastructure',
      ]}
      breadcrumbs={[{ name: 'Software Authentication', path: '/software-authentication' }]}
      faqItems={[
        { question: 'What is software authentication?', answer: 'Software authentication is the process of verifying that a user or device is authorized to access and use a software application. It prevents unauthorized use, piracy, and license sharing.' },
        { question: 'How does HWID authentication work?', answer: 'HWID (Hardware ID) authentication generates a unique fingerprint based on the user\'s hardware components. The license is bound to this fingerprint, preventing it from being used on unauthorized devices.' },
        { question: 'Can I integrate RinoxAuth with my existing software?', answer: 'Yes. RinoxAuth provides SDKs for C++, C#, Python, JavaScript, Java, and more. Integration typically takes less than 30 minutes.' },
        { question: 'Is your authentication platform cloud-based?', answer: 'Yes, RinoxAuth is fully cloud-based with global CDN distribution, ensuring low latency and high availability for your users worldwide.' },
      ]}
    />
  )
}
