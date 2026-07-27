import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'RinoxAuth privacy policy. Learn how we collect, use, and protect your personal information when you use our authentication and license management platform.',
  alternates: { canonical: 'https://authsys.dpdns.org/privacy' },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
