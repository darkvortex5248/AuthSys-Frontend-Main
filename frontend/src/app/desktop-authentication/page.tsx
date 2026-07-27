import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'Desktop Authentication | Secure Desktop Applications | RinoxAuth',
  description: 'Secure desktop application authentication with HWID locking, offline mode, and cross-platform SDK support for Windows, macOS, and Linux.',
  alternates: { canonical: 'https://authsys.dpdns.org/desktop-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="Desktop Authentication | Secure Desktop Applications | RinoxAuth"
      description="Secure desktop application authentication with HWID locking, offline mode, and cross-platform SDK support."
      h1="Desktop Application Authentication"
      intro="Protect your desktop applications with hardware-bound authentication that works across Windows, macOS, and Linux."
      features={['Windows, macOS, Linux support', 'Hardware ID (HWID) binding', 'Offline authentication mode', 'C++ and C# native SDKs', 'Automatic updates integration']}
      breadcrumbs={[{ name: 'Desktop Authentication', path: '/desktop-authentication' }]}
      faqItems={[
        { question: 'Does RinoxAuth support offline authentication?', answer: 'Yes. RinoxAuth supports offline authentication mode with periodic online validation, ensuring your users can use your software without an internet connection.' },
        { question: 'Which desktop platforms are supported?', answer: 'RinoxAuth supports Windows, macOS, and Linux with native SDKs for C++ and C#. Our REST API can be used with any programming language.' },
      ]}
    />
  )
}
