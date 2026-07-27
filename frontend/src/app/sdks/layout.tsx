import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SDKs & Libraries',
  description: 'Download RinoxAuth SDKs for C#, C++, Python, JavaScript, and more. Integrate secure authentication, license key validation, and HWID locking into your applications.',
  alternates: { canonical: 'https://authsys.dpdns.org/sdks' },
}

export default function SDKsLayout({ children }: { children: React.ReactNode }) {
  return children
}
