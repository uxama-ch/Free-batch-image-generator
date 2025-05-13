import type { Metadata } from "next"

type SEOProps = {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  canonical?: string
  type?: "website" | "article"
}

export function generateMetadata({
  title,
  description,
  keywords = [],
  ogImage = "/og-image.jpg",
  canonical,
  type = "website",
}: SEOProps): Metadata {
  // Ensure title is not too long (Google typically displays 50-60 characters)
  const metaTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title

  // Ensure description is not too long (Google typically displays 155-160 characters)
  const metaDescription = description.length > 160 ? `${description.substring(0, 157)}...` : description

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords.join(", "),
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: canonical
      ? {
          canonical,
        }
      : undefined,
  }
}
