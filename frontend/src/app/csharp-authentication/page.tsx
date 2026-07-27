import { Metadata } from 'next'
import { LandingPageShell } from '@/components/seo/LandingPage'

export const metadata: Metadata = {
  title: 'C# Authentication for .NET | RinoxAuth',
  description: 'Integrate authentication into your C# applications with our native .NET SDK.',
  alternates: { canonical: 'https://authsys.dpdns.org/csharp-authentication' },
}

export default function Page() {
  return (
    <LandingPageShell
      title="C# Authentication for .NET | RinoxAuth"
      description="Integrate authentication into your C# applications with our native .NET SDK."
      h1="C# Authentication for .NET"
      intro="Integrate authentication into your C# applications with our native .NET SDK."
      features={['.NET Framework support', '.NET Core/5+ support', 'Unity integration', 'Async/await API', 'NuGet package']}
      breadcrumbs={[{ name: 'C# Authentication for .NET', path: '/csharp-authentication' }]}
      faqItems={[
        { question: 'What is c# authentication for .net?', answer: 'C# Authentication for .NET is RinoxAuth\u2019s solution for secure authentication and license management. It provides enterprise-grade features to protect your software.' },
        { question: 'How do I get started with c# authentication for .net?', answer: 'Getting started is easy. Sign up for a free account, choose your plan, and follow our quick-start documentation. Most integrations take under 30 minutes.' },
        { question: 'Does RinoxAuth offer support for c# authentication for .net?', answer: 'Yes. All plans include access to our comprehensive documentation, community forum, and email support. Enterprise plans include dedicated support.' },
      ]}
    />
  )
}
