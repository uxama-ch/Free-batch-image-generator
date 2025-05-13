import type { Metadata } from "next"
import { BatchImageGenerator } from "@/components/batch-image-generator"
import { SoftwareAppSchema } from "@/components/seo/schema-markup"

export const metadata: Metadata = {
  title: "Create AI Images in Batch | Free Image Generator",
  description:
    "Generate multiple AI images at once with our free batch image generator. Perfect for YouTube thumbnails, social media content, and creative projects.",
  keywords:
    "AI image generator, batch processing, free image generation, Together AI, content creation, YouTube thumbnails, AI art",
  alternates: {
    canonical: "/",
  },
}

export default function Home() {
  return (
    <>
      <SoftwareAppSchema
        name="Free Batch Image Generator"
        description="Generate multiple AI images at once with our free batch image generator."
        url="https://yourdomain.com"
        applicationCategory="DesignApplication"
        operatingSystem="Web"
        offers={{
          price: "0",
          priceCurrency: "USD",
        }}
      />

      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Free Batch Image Generator</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Generate multiple AI images for your YouTube content, social media, and creative projects
        </p>

        <section aria-labelledby="features" className="mb-12">
          <h2 id="features" className="sr-only">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
              <p>Generate multiple images at once from text prompts to save time.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">High Quality AI</h3>
              <p>Powered by Together AI's FLUX.1-schnell-Free model for stunning results.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Completely Free</h3>
              <p>No hidden costs or premium tiers - all features available for free.</p>
            </div>
          </div>
        </section>

        <BatchImageGenerator />
      </div>
    </>
  )
}
