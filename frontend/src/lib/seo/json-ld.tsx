import { siteConfig } from './site-config'

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function OrganizationSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    address: { '@type': 'PostalAddress', addressLocality: siteConfig.contact.address },
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.discord,
      siteConfig.links.telegram,
    ],
  }
  return <JsonLd data={data} />
}

export function WebSiteSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return <JsonLd data={data} />
}

export function SoftwareApplicationSchema({
  name,
  description,
  applicationCategory = 'DeveloperApplication',
  operatingSystem = 'Windows, macOS, Linux',
}: {
  name: string
  description: string
  applicationCategory?: string
  operatingSystem?: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    applicationCategory,
    operatingSystem,
    url: siteConfig.url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    author: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  }
  return <JsonLd data={data} />
}

export function BreadcrumbSchema({ items }: { items: { name: string; path: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  }
  return <JsonLd data={data} />
}

export function FAQSchema({ questions }: { questions: { question: string; answer: string }[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  }
  return <JsonLd data={data} />
}

export function ArticleSchema({
  headline,
  description,
  datePublished,
  authorName,
  imageUrl,
}: {
  headline: string
  description: string
  datePublished: string
  authorName: string
  imageUrl?: string
}) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: imageUrl || `${siteConfig.url}/logo.png`,
    datePublished,
    author: { '@type': 'Person', name: authorName },
    publisher: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    mainEntityOfPage: { '@type': 'WebPage', '@id': siteConfig.url },
  }
  return <JsonLd data={data} />
}

export function ProductSchema() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: siteConfig.name,
    description: siteConfig.description,
    applicationCategory: 'DeveloperApplication',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: '0',
      highPrice: '299',
      offerCount: '4',
    },
  }
  return <JsonLd data={data} />
}
