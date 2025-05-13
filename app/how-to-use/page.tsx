import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Key, Upload, Settings, Play, ImageIcon } from "lucide-react"

export default function HowToUsePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold tracking-tight mb-2">How to Use</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Learn how to use the Together AI Image Generator to create beautiful images
      </p>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="step1">1. Upload Prompts</TabsTrigger>
          <TabsTrigger value="step2">2. Settings</TabsTrigger>
          <TabsTrigger value="step3">3. Generation</TabsTrigger>
          <TabsTrigger value="step4">4. Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>
                The Together AI Image Generator allows you to create multiple images from text prompts using the
                FLUX.1-schnell-Free model.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                This tool is designed to help you generate multiple images in batch mode, making it perfect for content
                creators, designers, and anyone who needs to create multiple images based on text descriptions.
              </p>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  The FLUX.1-schnell-Free model has a rate limit of 6 requests per minute. The application is designed
                  to handle these rate limits automatically, but you may experience delays during batch processing.
                </AlertDescription>
              </Alert>

              <h3 className="text-lg font-semibold mt-4">The process consists of 4 simple steps:</h3>
              <ol className="list-decimal list-inside space-y-2">
                <li>Upload or enter your text prompts</li>
                <li>Configure generation settings</li>
                <li>Start the generation process</li>
                <li>View and download your generated images</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step1">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Upload Prompts</CardTitle>
              <CardDescription>Start by uploading a text file with prompts or entering them manually.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Option 1: Upload a Text File</h3>
                  <p>
                    You can upload a text file where each line contains a different prompt. This is the fastest way to
                    add multiple prompts.
                  </p>
                  <div className="flex items-center">
                    <Upload className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>Click the "Upload File" button to select your text file.</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Option 2: Enter Prompts Manually</h3>
                  <p>
                    Alternatively, you can type your prompts directly into the text area. Enter one prompt per line.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Example prompts:
                    <br />A beautiful landscape with mountains and a lake
                    <br />A futuristic city with flying cars
                    <br />A portrait of a cyberpunk character
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">API Keys</h3>
                <p className="mb-2">
                  You can add your Together AI API keys to increase generation capacity and handle rate limits better.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p>
                    <strong>How to get API keys from Together.ai:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      Visit{" "}
                      <a
                        href="https://together.ai/signup"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Together.ai
                      </a>{" "}
                      and create an account
                    </li>
                    <li>After signing up and logging in, navigate to your account dashboard</li>
                    <li>Look for the "API Keys" or "Developer" section</li>
                    <li>Generate a new API key</li>
                    <li>Copy the API key and add it to this application</li>
                  </ol>
                  <p className="mt-3 text-amber-500 dark:text-amber-400">
                    <strong>Pro Tip:</strong> For faster batch processing, consider creating multiple Together.ai
                    accounts to get additional API keys. Each account gives you a separate rate limit allocation,
                    allowing you to process more images simultaneously.
                  </p>
                </div>
                <div className="flex items-center">
                  <Key className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>Click the "Add API Key" button to add your Together AI API keys.</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Note: Your API keys are stored locally in your browser and are never sent to our servers.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step2">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Settings</CardTitle>
              <CardDescription>Configure the generation settings for your images.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Image Settings</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Aspect Ratio:</span> Choose between square (1:1), landscape
                        (16:9), or portrait (9:16).
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Diffusion Steps:</span> Higher values may produce better quality
                        images but take longer to generate (1-4).
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Negative Prompt:</span> Specify elements you want to avoid in the
                        generated images.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Seed:</span> Use a random seed for each image or set a specific
                        seed for reproducible results.
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Processing Settings</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Concurrency Level:</span> Number of images to generate
                        simultaneously. Keep at 2 or less to avoid rate limits.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Automatic Retry:</span> Enable or disable automatic retry for
                        failed images.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Maximum Retry Attempts:</span> Set how many times the system
                        should retry failed generations.
                      </div>
                    </li>
                    <li className="flex items-start">
                      <Settings className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Retry Delay:</span> Set the delay between retry attempts in
                        seconds.
                      </div>
                    </li>
                  </ul>
                </div>
              </div>

              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Rate Limit Warning</AlertTitle>
                <AlertDescription>
                  The FLUX.1-schnell-Free model has a global rate limit of 6 requests per minute regardless of how many
                  API keys you use. To avoid hitting this limit, we recommend using a concurrency level of 2 or less.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step3">
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Generation</CardTitle>
              <CardDescription>Monitor the image generation process.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Generation Process</h3>
                <p>
                  Once you start the generation process, you can monitor the progress in real-time. The system will
                  process your prompts concurrently based on your settings.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Progress Monitoring</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Play className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Progress Bar:</span> Shows the overall completion percentage.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Play className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Statistics:</span> View total prompts, completed images, failed
                          generations, and active requests.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Play className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Processing Speed:</span> See how many images are being generated
                          per minute.
                        </div>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Controls</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <Play className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Pause/Resume:</span> Temporarily pause the generation process
                          and resume it later.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <Play className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Cancel:</span> Stop the generation process completely.
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-6">Generation Queue</h3>
                <p>
                  The Generation Queue shows the status of each prompt in the batch. You can see which prompts are
                  pending, processing, completed, or failed.
                </p>
                <p>
                  For each prompt, you can view its retry history, including any errors encountered and which API key
                  was used for each attempt.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="step4">
          <Card>
            <CardHeader>
              <CardTitle>Step 4: Gallery</CardTitle>
              <CardDescription>View, download, and manage your generated images.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gallery Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Viewing Images</h4>
                    <p>
                      The gallery displays all successfully generated images in a grid layout. You can click on any
                      image to view it in a larger size.
                    </p>
                    <div className="flex items-center">
                      <ImageIcon className="h-5 w-5 mr-2 text-muted-foreground" />
                      <span>Click the expand icon on an image to view it in full size.</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Managing Images</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <ImageIcon className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Download All:</span> Download all generated images as a zip
                          file.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <ImageIcon className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Reset Gallery:</span> Clear all images from the gallery to start
                          fresh.
                        </div>
                      </li>
                      <li className="flex items-start">
                        <ImageIcon className="h-5 w-5 mr-2 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="font-medium">Individual Download:</span> Download a specific image by
                          clicking the download icon.
                        </div>
                      </li>
                    </ul>
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
