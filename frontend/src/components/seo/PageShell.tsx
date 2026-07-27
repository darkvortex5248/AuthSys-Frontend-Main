import { BreadcrumbSchema, OrganizationSchema, WebSiteSchema } from '@/lib/seo/json-ld'

export function SEOShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      {children}
    </>
  )
}
