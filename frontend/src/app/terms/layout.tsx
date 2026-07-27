import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'RinoxAuth terms of service. Read the terms and conditions for using our authentication, license management, and software protection platform.',
  alternates: { canonical: 'https://authsys.dpdns.org/terms' },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
