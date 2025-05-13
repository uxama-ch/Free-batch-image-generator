import type { Metadata } from "next"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

interface SearchPageProps {
  searchParams: { q?: string }
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const query = searchParams.q || ""
  return {
    title: `Search Results for "${query}"`,
    description: `Search results for "${query}" on Free Batch Image Generator`,
    robots: {
      index: false,
      follow: true,
    },
  }
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""

  // In a real application, you would search your content here
  // For now, we'll just show some static results
  const searchResults = [
    {
      title: "Batch Image Generator",
      description: "Generate multiple AI images at once with our free batch image generator.",
      url: "/",
    },
    {
      title: "How to Use",
      description: "Learn how to use the Free Batch Image Generator to create beautiful images.",
      url: "/how-to-use",
    },
    {
      title: "About",
      description: "Learn more about the Free Batch Image Generator and how it works.",
      url: "/about",
    },
  ].filter(
    (result) =>
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb items={[{ label: "Search Results" }]} />

      <h1 className="text-4xl font-bold tracking-tight mb-2">Search Results</h1>
      <p className="text-xl text-muted-foreground mb-8">
        {searchResults.length} results for "{query}"
      </p>

      {searchResults.length > 0 ? (
        <div className="space-y-4">
          {searchResults.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Link href={result.url} className="hover:underline">
                  <CardTitle>{result.title}</CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <CardDescription>{result.description}</CardDescription>
                <Link href={result.url} className="text-primary hover:underline text-sm mt-2 inline-block">
                  View page
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p>No results found for "{query}". Please try another search term.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
