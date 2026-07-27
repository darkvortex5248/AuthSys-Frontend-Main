import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'RinoxAuth cookie policy. Learn about the cookies we use, how we use them, and your choices regarding cookie preferences on our authentication platform.',
  alternates: { canonical: 'https://authsys.dpdns.org/cookies' },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
