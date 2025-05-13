import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata: Metadata = {
  title: "About Our AI Image Generator",
  description:
    "Learn about the Free Batch Image Generator, the technology behind it, and the developer who created it.",
  keywords: "AI image generator, batch image generation, Together AI, FLUX model, about, technology stack, developer",
  alternates: {
    canonical: "/about",
  },
}

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold tracking-tight mb-2">About Our AI Image Generator</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Learn more about the Free Batch Image Generator and how it works
      </p>

      <Tabs defaultValue="about" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About the Project</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="developer">Developer</TabsTrigger>
        </TabsList>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About the Project</CardTitle>
              <CardDescription>
                The Free Batch Image Generator is a tool for creating AI-generated images using Together AI's models.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This project was created to provide an easy-to-use interface for generating images with Together AI's
                FLUX.1-schnell-Free model. The application allows users to generate multiple images in batch mode,
                making it perfect for content creators, designers, and anyone who needs to create multiple images based
                on text descriptions.
              </p>

              <p>The key features of this application include:</p>

              <ul className="list-disc list-inside space-y-2">
                <li>Batch image generation from text prompts</li>
                <li>Support for multiple API keys to increase generation capacity</li>
                <li>Automatic handling of rate limits</li>
                <li>Concurrent processing for faster generation</li>
                <li>Automatic retry for failed generations</li>
                <li>Detailed progress tracking and error reporting</li>
                <li>Image gallery with download options</li>
              </ul>

              <p>
                This project is open-source and contributions are welcome. If you have any suggestions or would like to
                contribute, please reach out to the developer.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technology">
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
              <CardDescription>The technologies and tools used to build this application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>The Free Batch Image Generator is built using modern web technologies and frameworks:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Frontend</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Next.js (React framework)</li>
                    <li>TypeScript</li>
                    <li>Tailwind CSS</li>
                    <li>shadcn/ui components</li>
                    <li>Zustand (state management)</li>
                    <li>Lucide React (icons)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">AI & Backend</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Together AI API</li>
                    <li>FLUX.1-schnell-Free model</li>
                    <li>AI SDK</li>
                    <li>Next.js API Routes</li>
                    <li>Custom rate limiting implementation</li>
                  </ul>
                </div>
              </div>

              <h3 className="text-lg font-semibold mt-4">How It Works</h3>
              <p>
                The application uses the Together AI API to generate images based on text prompts. It implements a
                custom rate limiting system to handle the model's rate limits and ensure reliable generation. The
                frontend is built with Next.js and uses Zustand for state management, providing a smooth and responsive
                user experience.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="developer">
          <Card>
            <CardHeader>
              <CardTitle>About the Developer</CardTitle>
              <CardDescription>Meet the developer behind the Free Batch Image Generator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center md:flex-row md:items-start gap-6">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-4xl font-bold">UR</span>
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-bold">Usama Riaz</h3>
                  <p className="text-muted-foreground">Full Stack Developer & AI Enthusiast</p>

                  <p className="mt-4">
                    Usama is a passionate developer with expertise in web development and artificial intelligence. He
                    specializes in creating user-friendly applications that leverage the power of AI to solve real-world
                    problems.
                  </p>

                  <div className="mt-4 space-y-2">
                    <p>
                      <strong>Email:</strong>{" "}
                      <a href="mailto:Usamariaz558@gmail.com" className="text-primary hover:underline">
                        Usamariaz558@gmail.com
                      </a>
                    </p>
                    <p>
                      <strong>GitHub:</strong>{" "}
                      <a
                        href="https://github.com/uxama-ch"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        github.com/uxama-ch
                      </a>
                    </p>
                    <p>
                      <strong>LinkedIn:</strong>{" "}
                      <a
                        href="https://linkedin.com/in/usama-riaz-6a9748248"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        linkedin.com/in/usama-riaz-6a9748248
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
