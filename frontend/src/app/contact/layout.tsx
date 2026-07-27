import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Contact the RinoxAuth team. Get in touch for support, sales inquiries, partnership opportunities, or general questions about our authentication platform.',
  alternates: { canonical: 'https://authsys.dpdns.org/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
