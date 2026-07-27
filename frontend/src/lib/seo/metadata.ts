import type { Metadata } from 'next'
import { siteConfig } from './site-config'

interface SeoProps {
  title: string
  description: string
  path: string
  ogImage?: string
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string
  author?: string
  keywords?: string[]
}

export function generateMetadata({
  title,
  description,
  path,
  ogImage,
  noIndex = false,
  type = 'website',
  publishedTime,
  author,
  keywords,
}: SeoProps): Metadata {
  const url = `${siteConfig.url}${path}`
  const image = ogImage || siteConfig.ogImage

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      locale: 'en_US',
      type,
      ...(publishedTime && type === 'article' ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    keywords: keywords?.join(', '),
    authors: author ? [{ name: author }] : undefined,
  }
}
