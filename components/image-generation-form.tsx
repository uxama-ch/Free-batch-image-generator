"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { useImageStore } from "@/lib/stores/image-store"
import { useFolderStore } from "@/lib/stores/folder-store"

const formSchema = z.object({
  prompt: z.string().min(1, {
    message: "Prompt is required.",
  }),
  negativePrompt: z.string().optional(),
  size: z.string().default("1:1"),
  seed: z.number().int().min(0).max(2147483647).optional(),
  steps: z.number().int().min(1).max(4).default(2),
  folderId: z.string().optional(),
})

const COOLDOWN_TIME = 15 // seconds

export function ImageGenerationForm() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const { toast } = useToast()
  const router = useRouter()
  const { addImage } = useImageStore()
  const { folders, activeFolder } = useFolderStore()

  // Use refs to avoid re-renders and update loops
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const endTimeRef = useRef<number | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      negativePrompt: "",
      size: "1:1",
      steps: 2,
      folderId: activeFolder?.id,
    },
  })

  // Function to start the cooldown timer
  function startCooldown(durationSeconds: number) {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Set the end time
    const now = Date.now()
    endTimeRef.current = now + durationSeconds * 1000
    setCooldownSeconds(durationSeconds)

    // Store in localStorage for persistence
    localStorage.setItem("cooldownEndTime", endTimeRef.current.toString())

    // Set up the timer
    timerRef.current = setInterval(() => {
      const remaining = calculateRemainingTime()
      setCooldownSeconds(remaining)

      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        timerRef.current = null
        endTimeRef.current = null
        localStorage.removeItem("cooldownEndTime")
      }
    }, 1000)
  }

  // Calculate remaining time based on the end time
  function calculateRemainingTime(): number {
    if (!endTimeRef.current) return 0
    const now = Date.now()
    const remaining = Math.ceil((endTimeRef.current - now) / 1000)
    return remaining > 0 ? remaining : 0
  }

  // Initialize on mount - check for existing cooldown
  useEffect(() => {
    const storedEndTime = localStorage.getItem("cooldownEndTime")

    if (storedEndTime) {
      const endTime = Number.parseInt(storedEndTime)
      endTimeRef.current = endTime
      const remaining = calculateRemainingTime()

      if (remaining > 0) {
        setCooldownSeconds(remaining)

        // Start the timer
        timerRef.current = setInterval(() => {
          const remaining = calculateRemainingTime()
          setCooldownSeconds(remaining)

          if (remaining <= 0) {
            clearInterval(timerRef.current!)
            timerRef.current = null
            endTimeRef.current = null
            localStorage.removeItem("cooldownEndTime")
          }
        }, 1000)
      } else {
        // Cooldown has expired
        localStorage.removeItem("cooldownEndTime")
      }
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (cooldownSeconds > 0) return

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error("Failed to generate image")
      }

      const data = await response.json()

      // Add the generated image to the store
      addImage({
        id: crypto.randomUUID(),
        prompt: values.prompt,
        negativePrompt: values.negativePrompt || "",
        size: values.size,
        seed: values.seed || Math.floor(Math.random() * 2147483647),
        steps: values.steps,
        url: data.imageUrl,
        createdAt: new Date().toISOString(),
        folderId: values.folderId === "none" ? null : values.folderId,
      })

      toast({
        title: "Image generated successfully",
        description: "Your image has been generated and added to your gallery.",
      })

      // Start the cooldown timer
      startCooldown(COOLDOWN_TIME)

      router.refresh()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error generating image",
        description: "There was an error generating your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A beautiful landscape with mountains and a lake..."
                      className="resize-none h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Describe what you want to generate in detail.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="negativePrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Negative Prompt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="blurry, low quality, distorted..." className="resize-none h-20" {...field} />
                  </FormControl>
                  <FormDescription>Describe what you want to avoid in the generated image.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aspect Ratio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                      <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the aspect ratio of the generated image.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seed (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Random"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>Set a specific seed for reproducible results.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="steps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={4}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of diffusion steps (1-4). Higher values may produce better results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Folder</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select a folder to save the generated image.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isGenerating || cooldownSeconds > 0}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : cooldownSeconds > 0 ? (
            <>
              <Timer className="mr-2 h-4 w-4" />
              Wait {cooldownSeconds}s
            </>
          ) : (
            "Generate Image"
          )}
        </Button>
      </form>
    </Form>
  )
}
