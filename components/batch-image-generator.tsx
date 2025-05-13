"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  Loader2,
  Upload,
  Settings,
  Play,
  Download,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  PauseCircle,
  RefreshCw,
  Clock,
  Key,
  Info,
  Zap,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { GenerationSettings } from "@/lib/types"
import { ImageGallery } from "@/components/image-gallery"
import { useToast } from "@/components/ui/use-toast"
import { RateLimiter } from "@/lib/rate-limiter"
import { ApiKeyManager } from "@/components/api-key-manager"
import { ConfirmDialog } from "@/components/confirm-dialog"

// Replace the JSZip import with our polyfill import
import { getJSZip } from "@/lib/jszip-polyfill"

// Model ID constant
const MODEL_ID = "black-forest-labs/FLUX.1-schnell-Free"

// Create a rate limiter for the FLUX.1-schnell-Free model
// 6 requests per minute = 1 request per 10 seconds
// Use a buffer factor of 0.7 to stay well below the limit (about 4 requests per minute)
const MODEL_RATE_LIMIT = 6 // requests per minute
const rateLimiter = new RateLimiter(MODEL_RATE_LIMIT, 60000, 0.7, MODEL_ID) // 6 tokens per 60 seconds with 70% buffer

// Type for tracking prompt status
interface PromptStatus {
  prompt: string
  index: number
  status: "pending" | "processing" | "completed" | "failed"
  attempts: number
  error?: string
  retryHistory?: RetryAttempt[]
  currentApiKey?: string // Track which API key is currently being used
}

interface RetryAttempt {
  timestamp: number
  error: string
  apiKeyUsed?: string // Masked key for privacy
  attemptNumber: number
}

interface ApiKeyStats {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rateLimitHits: number
  isRateLimited: boolean
  inUse: boolean
}

export function BatchImageGenerator() {
  const [prompts, setPrompts] = useState<string[]>([])
  const [promptStatus, setPromptStatus] = useState<PromptStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [retryPass, setRetryPass] = useState(0)
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; url: string; prompt: string }>>([])
  const [activeTab, setActiveTab] = useState("upload")
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: "1:1",
    steps: 2,
    batchSize: 3, // Reduced default batch size to respect rate limits
    negativePrompt: "",
    useRandomSeed: true,
    seed: Math.floor(Math.random() * 2147483647),
  })
  const [nextTokenTime, setNextTokenTime] = useState<number | null>(null)
  const [waitingForRateLimit, setWaitingForRateLimit] = useState(false)
  const [currentError, setCurrentError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [keyStats, setKeyStats] = useState<ApiKeyStats[]>([])
  const [allKeysRateLimited, setAllKeysRateLimited] = useState(false)
  const [modelRateLimited, setModelRateLimited] = useState(false)
  const [autoRetryEnabled, setAutoRetryEnabled] = useState(true)
  const [maxRetryAttempts, setMaxRetryAttempts] = useState(5)
  const [retryDelay, setRetryDelay] = useState(5) // seconds
  const [concurrencyLevel, setConcurrencyLevel] = useState(2) // Reduced default concurrency level
  const [activeRequests, setActiveRequests] = useState(0) // Track number of active requests
  const [processingSpeed, setProcessingSpeed] = useState<number | null>(null) // Images per minute
  const [recommendedConcurrency, setRecommendedConcurrency] = useState(2) // Recommended concurrency level
  // Add this with the other useState declarations at the top of the component
  const [isDownloading, setIsDownloading] = useState(false)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const generationCancelRef = useRef<boolean>(false)
  const processingStartTimeRef = useRef<number | null>(null)
  const { toast } = useToast()

  // Maximum number of retry passes
  const MAX_RETRY_PASSES = 5
  // Maximum attempts per prompt
  const MAX_ATTEMPTS_PER_PROMPT = maxRetryAttempts

  // Update the next token time display
  useEffect(() => {
    if (!waitingForRateLimit || nextTokenTime === null) return

    const interval = setInterval(() => {
      const now = Date.now()
      if (now >= nextTokenTime) {
        setWaitingForRateLimit(false)
        setNextTokenTime(null)
      } else {
        // Force a re-render to update the countdown
        setNextTokenTime(nextTokenTime)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [waitingForRateLimit, nextTokenTime])

  // Calculate processing speed
  useEffect(() => {
    if (!isGenerating || !processingStartTimeRef.current) return

    const updateSpeed = () => {
      if (!processingStartTimeRef.current) return

      const elapsedMinutes = (Date.now() - processingStartTimeRef.current) / 60000
      if (elapsedMinutes > 0 && completedCount > 0) {
        const speed = completedCount / elapsedMinutes
        setProcessingSpeed(speed)
      }
    }

    const interval = setInterval(updateSpeed, 5000)
    updateSpeed() // Initial calculation

    return () => clearInterval(interval)
  }, [isGenerating, completedCount])

  // Calculate recommended concurrency based on API key count
  useEffect(() => {
    // Get API key count safely
    if (typeof window !== "undefined") {
      const savedKeys = localStorage.getItem("togetherAiApiKeys")
      const apiKeyCount = savedKeys ? JSON.parse(savedKeys).length : 0

      // Calculate recommended concurrency based on model rate limit and API key count
      // For FLUX.1-schnell-Free, the rate limit is 6 requests per minute per API key
      // We want to stay under this limit, so we'll use a conservative approach

      // If we have no API keys, use the environment variable key with a concurrency of 1
      if (apiKeyCount === 0) {
        setRecommendedConcurrency(1)
      } else {
        // With multiple keys, we need to be careful about the model's global rate limit
        // The model has a rate limit of 6 requests per minute regardless of API key
        // So we'll limit concurrency to 2 to avoid hitting this limit
        setRecommendedConcurrency(Math.min(2, apiKeyCount))
      }

      // Update the concurrency level to the recommended value if it's higher than current
      setConcurrencyLevel((current) => Math.min(current, Math.min(2, apiKeyCount || 1)))
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      setPrompts(lines)
      if (textAreaRef.current) {
        textAreaRef.current.value = lines.join("\n")
      }
      setIsUploading(false)
      setActiveTab("review")

      toast({
        title: "File uploaded successfully",
        description: `Loaded ${lines.length} prompts from file.`,
      })
    }

    reader.onerror = () => {
      setIsUploading(false)
      toast({
        variant: "destructive",
        title: "Error uploading file",
        description: "There was an error reading the file. Please try again.",
      })
    }

    reader.readAsText(file)
  }

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
    setPrompts(lines)
  }

  const togglePause = () => {
    setIsPaused((prev) => !prev)
    if (isPaused) {
      toast({
        title: "Generation resumed",
        description: "The batch generation process has been resumed.",
      })
    } else {
      toast({
        title: "Generation paused",
        description: "The batch generation process has been paused. Click resume to continue.",
      })
    }
  }

  const cancelGeneration = () => {
    generationCancelRef.current = true
    setIsPaused(false)
    toast({
      title: "Generation cancelled",
      description: "The batch generation process has been cancelled.",
    })
  }

  // Initialize prompt status array
  const initializePromptStatus = (prompts: string[]): PromptStatus[] => {
    return prompts.map((prompt, index) => ({
      prompt,
      index,
      status: "pending" as const,
      attempts: 0,
      retryHistory: [],
    }))
  }

  // Update a single prompt's status
  const updatePromptStatus = (index: number, updates: Partial<PromptStatus>) => {
    setPromptStatus((current) =>
      current.map((status, i) =>
        i === index
          ? {
              ...status,
              ...updates,
              // Ensure retryHistory is initialized if not present
              retryHistory: [...(status.retryHistory || []), ...(updates.retryHistory || [])],
            }
          : status,
      ),
    )
  }

  // Add a retry attempt to the history
  const addRetryAttempt = (index: number, error: string, apiKeyUsed?: string) => {
    const promptData = promptStatus[index]
    if (!promptData) return

    const retryAttempt: RetryAttempt = {
      timestamp: Date.now(),
      error,
      apiKeyUsed: apiKeyUsed ? apiKeyUsed : undefined,
      attemptNumber: promptData.attempts + 1,
    }

    updatePromptStatus(index, {
      retryHistory: [...(promptData.retryHistory || []), retryAttempt],
    })
  }

  // Calculate overall progress
  const calculateProgress = (completed: number, total: number) => {
    return (completed / total) * 100
  }

  // Process a single prompt
  const processPrompt = async (promptData: PromptStatus): Promise<boolean> => {
    const { prompt, index } = promptData

    // Update status to processing
    updatePromptStatus(index, { status: "processing" })

    try {
      // Generate the image
      const imageNumber = index + 1
      const result = await generateImage(prompt, imageNumber, promptData.attempts)

      if (result.keyStats) {
        setKeyStats(result.keyStats)
      }

      // If we have an API key used, add it to the log
      if (result.apiKeyUsed) {
        addRetryAttempt(index, "Success", result.apiKeyUsed)
      }

      // Update status to completed
      updatePromptStatus(index, {
        status: "completed",
        attempts: promptData.attempts + 1,
        currentApiKey: undefined, // Clear the current API key
      })
      setCompletedCount((prev) => prev + 1)

      return true
    } catch (error) {
      console.error(`Error processing prompt ${index + 1}:`, error)

      // Check if this is a model rate limit error
      if (error instanceof Error && error.message.includes("model-specific rate limit")) {
        setModelRateLimited(true)
        const retryAfterMatch = error.message.match(/try again in (\d+) seconds/)
        if (retryAfterMatch && retryAfterMatch[1]) {
          const retryAfterSeconds = Number.parseInt(retryAfterMatch[1], 10)
          setNextTokenTime(Date.now() + retryAfterSeconds * 1000)
        }
      }

      // Check if all keys are rate limited
      else if (error instanceof Error && error.message.includes("All API keys are rate limited")) {
        setAllKeysRateLimited(true)
        const retryAfterMatch = error.message.match(/try again in (\d+) seconds/)
        if (retryAfterMatch && retryAfterMatch[1]) {
          const retryAfterSeconds = Number.parseInt(retryAfterMatch[1], 10)
          setNextTokenTime(Date.now() + retryAfterSeconds * 1000)
        }
      }

      // Extract API key from error if available
      let apiKeyUsed: string | undefined
      if (error instanceof Error && error.message.includes("API key:")) {
        const keyMatch = error.message.match(/API key: ([a-zA-Z0-9]+)/)
        if (keyMatch && keyMatch[1]) {
          apiKeyUsed = keyMatch[1]
        }
      }

      // Add to retry history
      addRetryAttempt(index, error instanceof Error ? error.message : String(error), apiKeyUsed)

      // Update status to failed
      updatePromptStatus(index, {
        status: "failed",
        attempts: promptData.attempts + 1,
        error: error instanceof Error ? error.message : String(error),
        currentApiKey: undefined, // Clear the current API key
      })

      setFailedCount((prev) => prev + 1)
      setCurrentError(error instanceof Error ? error.message : String(error))

      return false
    } finally {
      // Decrement active requests counter
      setActiveRequests((prev) => Math.max(0, prev - 1))
    }
  }

  // Process prompts concurrently with rate limiting
  const processConcurrently = async (promptsToProcess: PromptStatus[], maxConcurrent: number) => {
    // Create a queue of prompts to process
    const queue = [...promptsToProcess]
    const activePromises: Promise<void>[] = []
    const results: boolean[] = []

    // Process queue until empty
    while (queue.length > 0 || activePromises.length > 0) {
      // Check if generation was cancelled
      if (generationCancelRef.current) {
        return results
      }

      // Wait if paused
      if (isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }

      // If model is rate limited, wait for the cooldown
      if (modelRateLimited && nextTokenTime) {
        const waitTime = nextTokenTime - Date.now()
        if (waitTime > 0) {
          toast({
            title: "Model rate limited",
            description: `Waiting ${Math.ceil(waitTime / 1000)} seconds for model rate limit to reset...`,
          })
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
        setModelRateLimited(false)
      }

      // If all keys are rate limited, wait for the cooldown
      if (allKeysRateLimited && nextTokenTime) {
        const waitTime = nextTokenTime - Date.now()
        if (waitTime > 0) {
          toast({
            title: "All API keys rate limited",
            description: `Waiting ${Math.ceil(waitTime / 1000)} seconds for rate limits to reset...`,
          })
          await new Promise((resolve) => setTimeout(resolve, waitTime))
        }
        setAllKeysRateLimited(false)
      }

      // Start new tasks if we have capacity and queue items
      while (activePromises.length < maxConcurrent && queue.length > 0 && !isPaused && !generationCancelRef.current) {
        // Check if we need to wait for rate limiting
        const waitTime = await rateLimiter.waitForToken()
        if (waitTime > 0) {
          console.log(`Rate limit reached, waiting ${waitTime}ms before starting next request`)
          setWaitingForRateLimit(true)
          setNextTokenTime(Date.now() + waitTime)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          setWaitingForRateLimit(false)
          continue
        }

        const promptData = queue.shift()!

        // Increment active requests counter
        setActiveRequests((prev) => prev + 1)

        // Create a promise for this prompt processing
        const promise = processPrompt(promptData).then((result) => {
          results.push(result)

          // Update overall progress
          const totalProcessed = completedCount + failedCount
          const newProgress = calculateProgress(totalProcessed, prompts.length)
          setProgress(newProgress)

          // Remove this promise from active promises
          const index = activePromises.indexOf(promise)
          if (index !== -1) {
            activePromises.splice(index, 1)
          }
        })

        activePromises.push(promise)
      }

      // Wait for any promise to complete if we've reached max concurrency
      if (activePromises.length >= maxConcurrent || (queue.length === 0 && activePromises.length > 0)) {
        await Promise.race(activePromises)
      } else if (activePromises.length === 0 && queue.length === 0) {
        // No active promises and no queue items, we're done
        break
      } else {
        // Wait a short time to avoid tight loop
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return results
  }

  // Main generation function
  const startGeneration = async () => {
    if (prompts.length === 0) {
      toast({
        variant: "destructive",
        title: "No prompts found",
        description: "Please add at least one prompt before starting generation.",
      })
      return
    }

    // Initialize
    setIsGenerating(true)
    setProgress(0)
    setCompletedCount(0)
    setFailedCount(0)
    setGeneratedImages([])
    setCurrentError(null)
    setActiveTab("progress")
    setRetryPass(0)
    setAllKeysRateLimited(false)
    setModelRateLimited(false)
    setActiveRequests(0)
    generationCancelRef.current = false
    processingStartTimeRef.current = Date.now()

    // Initialize prompt status
    const initialPromptStatus = initializePromptStatus(prompts)
    setPromptStatus(initialPromptStatus)

    // Display rate limit information
    toast({
      title: "Batch generation started",
      description: `Processing ${prompts.length} prompts with concurrency level ${concurrencyLevel}. Respecting model rate limit of 6 requests per minute.`,
    })

    // First pass - process all prompts concurrently
    await processConcurrently(initialPromptStatus, concurrencyLevel)

    // Automatic retry passes
    if (autoRetryEnabled) {
      let currentPass = 0
      let failedPrompts: PromptStatus[] = []

      // Continue retrying until all images are generated or max retries reached
      do {
        // Get the current state of promptStatus for filtering
        const currentPromptStatus = [...promptStatus]
        failedPrompts = currentPromptStatus.filter((p) => p.status === "failed" && p.attempts < MAX_ATTEMPTS_PER_PROMPT)

        if (failedPrompts.length === 0 || currentPass >= MAX_RETRY_PASSES || generationCancelRef.current) {
          break
        }

        currentPass++
        setRetryPass(currentPass)

        // Wait between retry passes
        if (!generationCancelRef.current) {
          setIsRetrying(true)
          toast({
            title: `Starting retry pass ${currentPass}`,
            description: `Retrying ${failedPrompts.length} failed images after a ${retryDelay} second delay.`,
          })

          // Wait between retry passes
          await new Promise((resolve) => setTimeout(resolve, retryDelay * 1000))
          setIsRetrying(false)
        }

        // Process failed prompts concurrently
        await processConcurrently(failedPrompts, concurrencyLevel)
      } while (failedPrompts.length > 0 && currentPass < MAX_RETRY_PASSES && !generationCancelRef.current)
    }

    setIsGenerating(false)
    setActiveTab("gallery")

    const finalFailedCount = promptStatus.filter((p) => p.status === "failed").length
    const totalRetries = promptStatus.reduce((sum, p) => sum + Math.max(0, p.attempts - 1), 0)
    const totalTime = processingStartTimeRef.current ? (Date.now() - processingStartTimeRef.current) / 1000 : 0

    toast({
      title: "Batch generation complete",
      description: `Generated ${completedCount} images with ${finalFailedCount} failures after ${retryPass + 1} passes and ${totalRetries} total retries. Total time: ${Math.round(totalTime)}s`,
    })
  }

  const generateImage = async (prompt: string, imageNumber: number, attemptNumber = 0) => {
    const MAX_RETRIES = 3
    let retries = 0
    let lastError: Error | null = null
    let usedApiKey: string | undefined

    // Get API keys safely
    let apiKeys: string[] = []
    if (typeof window !== "undefined") {
      const savedKeys = localStorage.getItem("togetherAiApiKeys")
      apiKeys = savedKeys ? JSON.parse(savedKeys) : []
    }

    // Update the prompt status to show which API key is being used
    updatePromptStatus(imageNumber - 1, { currentApiKey: "Requesting..." })

    while (retries < MAX_RETRIES) {
      try {
        const response = await fetch("/api/generate-batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            negativePrompt: settings.negativePrompt,
            size: settings.aspectRatio,
            steps: settings.steps,
            seed: settings.useRandomSeed ? Math.floor(Math.random() * 2147483647) : settings.seed,
            imageNumber,
            retryAttempt: retries,
            attemptNumber,
            apiKeys, // Send all available API keys
          }),
        })

        // Check if the response is ok
        if (!response.ok) {
          // Try to parse error response as JSON
          let errorMessage: string
          let isRateLimit = false
          let isModelRateLimit = false
          let retryAfter = 0

          try {
            const errorData = await response.json()
            errorMessage = errorData.details || errorData.error || `HTTP error ${response.status}`

            // Check if this is a model-specific rate limit
            isModelRateLimit = errorData.isModelRateLimit === true

            // Capture the API key used if available
            if (errorData.apiKeyUsed) {
              usedApiKey = errorData.apiKeyUsed
              // Update the prompt status with the API key being used
              updatePromptStatus(imageNumber - 1, { currentApiKey: usedApiKey })
            }

            // Update key stats if available
            if (errorData.keyStats) {
              setKeyStats(errorData.keyStats)
            }

            // Check if this is a rate limit error
            isRateLimit =
              errorMessage.toLowerCase().includes("rate limit") ||
              errorMessage.toLowerCase().includes("too many requests") ||
              response.status === 429

            // Get retry-after time if available
            if (errorData.retryAfter) {
              retryAfter = errorData.retryAfter
            }
          } catch (parseError) {
            // If we can't parse JSON, use the status text
            errorMessage = `HTTP error ${response.status}: ${response.statusText}`
            isRateLimit = response.status === 429
          }

          // Handle model-specific rate limit errors
          if (isModelRateLimit) {
            console.log("Model-specific rate limit detected, applying extended cooldown")
            setModelRateLimited(true)

            if (retryAfter > 0) {
              setNextTokenTime(Date.now() + retryAfter)
              // Wait for the specified time
              await new Promise((resolve) => setTimeout(resolve, retryAfter))
            } else {
              // Default wait time if not specified
              await new Promise((resolve) => setTimeout(resolve, 30000))
            }

            setModelRateLimited(false)
            // Apply a rate limit to the local rate limiter as well
            rateLimiter.handleRateLimitError(30)

            // Throw a specific error for model rate limits
            throw new Error(`Model-specific rate limit reached for ${MODEL_ID}. Please try again in 30 seconds.`)
          }
          // Handle API key rate limit errors
          else if (isRateLimit) {
            console.log("Rate limit detected, applying extended cooldown")

            // If all keys are rate limited, set the flag and wait time
            if (errorMessage.includes("All API keys are rate limited")) {
              setAllKeysRateLimited(true)
              if (retryAfter > 0) {
                setNextTokenTime(Date.now() + retryAfter)
                // Wait for the specified time
                await new Promise((resolve) => setTimeout(resolve, retryAfter))
              } else {
                // Default wait time if not specified
                await new Promise((resolve) => setTimeout(resolve, 15000))
              }
              setAllKeysRateLimited(false)
            } else {
              // Just one key is rate limited, the server will try another
              rateLimiter.handleRateLimitError(30)
              await new Promise((resolve) => setTimeout(resolve, 5000))
            }
          }

          // Add API key info to error message for logging
          if (usedApiKey) {
            errorMessage += ` (API key: ${usedApiKey})`
          }

          throw new Error(errorMessage)
        }

        // Try to parse the response as JSON
        let data
        try {
          const text = await response.text()

          // Try to parse as JSON
          try {
            data = JSON.parse(text)
          } catch (jsonError) {
            console.error("JSON parse error:", jsonError)
            console.error("Response text:", text.substring(0, 200))
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`)
          }
        } catch (parseError) {
          console.error("Error reading response:", parseError)
          throw new Error("Failed to read response from server")
        }

        // Validate the response data
        if (!data || !data.imageUrl) {
          console.error("Invalid response format:", data)
          throw new Error("Invalid response format: missing image URL")
        }

        // Capture the API key used if available
        if (data.apiKeyUsed) {
          usedApiKey = data.apiKeyUsed
        }

        // Update key stats if available
        if (data.keyStats) {
          setKeyStats(data.keyStats)
        }

        setGeneratedImages((prev) => [
          ...prev,
          {
            id: `image-${imageNumber}`,
            url: data.imageUrl,
            prompt,
          },
        ])

        return { ...data, apiKeyUsed: usedApiKey }
      } catch (error) {
        retries++
        lastError = error instanceof Error ? error : new Error(String(error))

        // Check if this is a rate limit error
        const isRateLimit = lastError.message.includes("rate limit") || lastError.message.includes("too many requests")
        const isModelRateLimit = lastError.message.includes("model-specific rate limit")

        // If we've reached max retries, give up
        if (retries >= MAX_RETRIES) {
          console.error(`Failed after ${MAX_RETRIES} attempts. Last error:`, lastError)
          throw new Error(`Failed after ${MAX_RETRIES} attempts. Last error: ${lastError.message}`)
        }

        // For model rate limits, use a longer backoff
        if (isModelRateLimit) {
          const backoffTime = 30000 // 30 seconds for model rate limits
          console.log(`Model rate limit hit, retry ${retries}/${MAX_RETRIES} after ${backoffTime}ms`)
          await new Promise((resolve) => setTimeout(resolve, backoffTime))
        }
        // Otherwise, use exponential backoff
        else {
          // Use longer backoff for rate limit errors
          const backoffTime = isRateLimit
            ? Math.min(15000 * Math.pow(2, retries), 60000) // 15s, 30s, 60s for rate limits
            : Math.min(1000 * Math.pow(2, retries), 10000) // 1s, 2s, 4s for other errors

          console.log(`Retry ${retries}/${MAX_RETRIES} after ${backoffTime}ms${isRateLimit ? " (rate limit)" : ""}`)
          await new Promise((resolve) => setTimeout(resolve, backoffTime))
        }
      }
    }

    // This should never be reached due to the throw in the loop, but TypeScript doesn't know that
    throw lastError || new Error("Unknown error occurred")
  }

  // Find the downloadAllImages function and replace it with this improved version:
  // Update the downloadAllImages function to use the polyfill
  const downloadAllImages = async () => {
    if (generatedImages.length === 0) return

    // Show loading toast
    toast({
      title: "Preparing download",
      description: "Creating zip file with all generated images. This may take a moment...",
    })

    // Set downloading state
    setIsDownloading(true)

    try {
      // Get JSZip instance
      const JSZip = await getJSZip()
      const zip = new JSZip()

      // Add each image to the zip file
      const downloadPromises = generatedImages.map(async (image, index) => {
        try {
          // For data URLs, we need to convert them to blobs
          const fetchResponse = await fetch(image.url)
          const blob = await fetchResponse.blob()

          // Add to zip with a meaningful filename that includes the image number
          const filename = `image-${index + 1}.png`
          zip.file(filename, blob)

          return true
        } catch (error) {
          console.error(`Error processing image ${index + 1}:`, error)
          return false
        }
      })

      // Wait for all images to be processed
      await Promise.all(downloadPromises)

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" })

      // Create a download link
      const link = document.createElement("a")
      link.href = URL.createObjectURL(zipBlob)
      link.download = `together-ai-images-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the object URL
      URL.revokeObjectURL(link.href)

      // Show success toast
      toast({
        title: "Download complete",
        description: `Successfully downloaded ${generatedImages.length} images as a zip file.`,
      })
    } catch (error) {
      console.error("Error creating zip file:", error)
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error creating the zip file. Please try again.",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Add a new resetGallery function
  const resetGallery = () => {
    setIsResetDialogOpen(true)
  }

  // Add a new function to handle the actual reset after confirmation
  const handleResetConfirm = () => {
    // Reset all state related to generated images
    setGeneratedImages([])
    setCompletedCount(0)
    setFailedCount(0)
    setProgress(0)
    setPromptStatus([])

    toast({
      title: "Gallery reset",
      description: "All generated images have been cleared from the gallery.",
    })

    setIsResetDialogOpen(false)
  }

  // Calculate estimated time based on number of prompts and rate limit
  // With multiple keys, we can process more images per minute
  const [apiKeyCount, setApiKeyCount] = useState(0)

  // Get API key count safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKeys = localStorage.getItem("togetherAiApiKeys")
      setApiKeyCount(savedKeys ? JSON.parse(savedKeys).length : 0)
    }
  }, [])

  // Calculate effective rate limit based on concurrency and model rate limit
  // The model has a global rate limit of 6 requests per minute regardless of API key
  const effectiveRateLimit = Math.min(MODEL_RATE_LIMIT, concurrencyLevel)
  const estimatedMinutes = Math.ceil(prompts.length / effectiveRateLimit)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" disabled={isGenerating}>
            1. Upload Prompts
          </TabsTrigger>
          <TabsTrigger value="settings" disabled={isGenerating || prompts.length === 0}>
            2. Settings
          </TabsTrigger>
          <TabsTrigger value="progress" disabled={!isGenerating && activeTab !== "progress"}>
            3. Generation
          </TabsTrigger>
          <TabsTrigger value="gallery" disabled={generatedImages.length === 0}>
            4. Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4 mt-6">
          <ApiKeyManager />

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Upload Prompt File</h3>
                    <p className="text-slate-300">
                      Upload a text file with one prompt per line. Each line will generate one image.
                    </p>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".txt"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full">
                        {isUploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload File
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Or Enter Prompts Manually</h3>
                    <p className="text-slate-300">
                      Enter your prompts below, one per line. Each line will generate one image.
                    </p>
                    <Textarea
                      ref={textAreaRef}
                      placeholder="Enter prompts here, one per line..."
                      className="min-h-[150px]"
                      onChange={handleTextAreaChange}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => setActiveTab("settings")}
                    disabled={prompts.length === 0}
                    className="w-full md:w-auto"
                  >
                    Next: Configure Settings
                    <Settings className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {prompts.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Prompts loaded</AlertTitle>
              <AlertDescription>
                {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} ready for generation.
                <div className="mt-2 text-amber-400">
                  <strong>Note:</strong> Using {apiKeyCount > 0 ? apiKeyCount : "default"} API key
                  {apiKeyCount !== 1 ? "s" : ""} with concurrent processing. Estimated time: ~{estimatedMinutes} minute
                  {estimatedMinutes !== 1 ? "s" : ""}.
                </div>
                <div className="mt-2 text-amber-400">
                  <strong>Important:</strong> The FLUX.1-schnell-Free model has a global rate limit of 6 requests per
                  minute regardless of how many API keys you use.
                </div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Generation Settings</h3>

                <Alert variant="warning" className="bg-amber-900/20 border-amber-900 text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Model Rate Limit Warning</AlertTitle>
                  <AlertDescription>
                    The FLUX.1-schnell-Free model has a global rate limit of 6 requests per minute regardless of how
                    many API keys you use. To avoid hitting this limit, we recommend using a concurrency level of 2 or
                    less.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                      <Select
                        value={settings.aspectRatio}
                        onValueChange={(value) => setSettings({ ...settings, aspectRatio: value })}
                      >
                        <SelectTrigger id="aspect-ratio">
                          <SelectValue placeholder="Select aspect ratio" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">Square (1:1)</SelectItem>
                          <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                          <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="steps">Diffusion Steps: {settings.steps}</Label>
                      <Slider
                        id="steps"
                        min={1}
                        max={4}
                        step={1}
                        value={[settings.steps]}
                        onValueChange={(value) => setSettings({ ...settings, steps: value[0] })}
                      />
                      <p className="text-xs text-slate-400">
                        Higher values may produce better quality images but take longer to generate.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="negative-prompt">Negative Prompt</Label>
                      <Textarea
                        id="negative-prompt"
                        placeholder="Elements to avoid in generated images..."
                        value={settings.negativePrompt}
                        onChange={(e) => setSettings({ ...settings, negativePrompt: e.target.value })}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="random-seed"
                        checked={settings.useRandomSeed}
                        onCheckedChange={(checked) => setSettings({ ...settings, useRandomSeed: checked })}
                      />
                      <Label htmlFor="random-seed">Use random seed for each image</Label>
                    </div>

                    {!settings.useRandomSeed && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="seed">Seed Value</Label>
                        <Input
                          id="seed"
                          type="number"
                          value={settings.seed}
                          onChange={(e) => setSettings({ ...settings, seed: Number.parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Concurrency Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    Concurrent Processing Settings
                  </h4>

                  <div className="space-y-2">
                    <Label htmlFor="concurrency">Concurrency Level: {concurrencyLevel}</Label>
                    <Slider
                      id="concurrency"
                      min={1}
                      max={5}
                      step={1}
                      value={[concurrencyLevel]}
                      onValueChange={(value) => setConcurrencyLevel(value[0])}
                    />
                    <p className="text-xs text-slate-400">
                      Number of images to generate simultaneously. Due to model rate limits, we recommend a concurrency
                      level of {recommendedConcurrency} or less to avoid hitting rate limits.
                    </p>
                    {concurrencyLevel > 2 && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>High Concurrency Warning</AlertTitle>
                        <AlertDescription>
                          A concurrency level of {concurrencyLevel} may cause rate limit errors with the
                          FLUX.1-schnell-Free model. Consider reducing to 2 or less.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Retry Settings */}
                <div className="border rounded-lg p-4 space-y-4">
                  <h4 className="font-medium flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 text-blue-500" />
                    Automatic Retry Settings
                  </h4>

                  <div className="flex items-center space-x-2">
                    <Switch id="auto-retry" checked={autoRetryEnabled} onCheckedChange={setAutoRetryEnabled} />
                    <Label htmlFor="auto-retry">Enable automatic retry for failed images</Label>
                  </div>

                  {autoRetryEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="max-retries">Maximum Retry Attempts: {maxRetryAttempts}</Label>
                        <Slider
                          id="max-retries"
                          min={1}
                          max={10}
                          step={1}
                          value={[maxRetryAttempts]}
                          onValueChange={(value) => setMaxRetryAttempts(value[0])}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="retry-delay">Delay Between Retries (seconds): {retryDelay}</Label>
                        <Slider
                          id="retry-delay"
                          min={1}
                          max={30}
                          step={1}
                          value={[retryDelay]}
                          onValueChange={(value) => setRetryDelay(value[0])}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex flex-col md:flex-row gap-4">
                  <Button variant="outline" onClick={() => setActiveTab("upload")}>
                    Back to Prompts
                  </Button>
                  <Button
                    onClick={startGeneration}
                    disabled={prompts.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Batch Generation
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Review Prompts</h3>
                <p className="text-slate-300">
                  {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} will be processed concurrently.
                  <span className="block mt-1 text-amber-400">
                    Estimated time: ~{estimatedMinutes} minute{estimatedMinutes !== 1 ? "s" : ""}
                    (using {apiKeyCount > 0 ? apiKeyCount : "default"} API key{apiKeyCount !== 1 ? "s" : ""} with
                    concurrency level {concurrencyLevel}).
                  </span>
                </p>
                <ScrollArea className="h-[200px] rounded-md border p-4">
                  {prompts.map((prompt, index) => (
                    <div key={index} className="py-2">
                      <Badge className="mr-2">{index + 1}</Badge>
                      {prompt}
                      {index < prompts.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Generation Progress</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>
                      {completedCount + failedCount} of {prompts.length} processed
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{prompts.length}</div>
                    <div className="text-slate-400">Total Prompts</div>
                  </div>
                  <div className="bg-green-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{completedCount}</div>
                    <div className="text-green-400">Completed</div>
                  </div>
                  <div className="bg-red-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{failedCount}</div>
                    <div className="text-red-400">Failed</div>
                  </div>
                  <div className="bg-blue-900 p-4 rounded-lg">
                    <div className="text-2xl font-bold">{activeRequests}</div>
                    <div className="text-blue-400">Active Requests</div>
                  </div>
                </div>

                {/* Processing Speed */}
                {processingSpeed !== null && (
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 flex items-center justify-center">
                      <Zap className="h-4 w-4 mr-1 text-yellow-500" /> Processing Speed
                    </h4>
                    <div className="text-xl font-bold">{processingSpeed.toFixed(1)}</div>
                    <div className="text-slate-400">Images per minute</div>
                  </div>
                )}

                {/* API Key Stats */}
                {keyStats.length > 0 && (
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 flex items-center">
                      <Key className="h-4 w-4 mr-1" /> API Key Usage
                    </h4>
                    <div className="grid grid-cols-5 gap-2 text-xs text-center">
                      <div className="text-slate-400">Total</div>
                      <div className="text-green-400">Success</div>
                      <div className="text-red-400">Failed</div>
                      <div className="text-amber-400">Rate Limits</div>
                      <div className="text-blue-400">In Use</div>
                    </div>
                    {keyStats.map((stat, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2 text-xs text-center mt-1">
                        <div>{stat.totalRequests}</div>
                        <div className="text-green-400">{stat.successfulRequests}</div>
                        <div className="text-red-400">{stat.failedRequests}</div>
                        <div className="text-amber-400">{stat.rateLimitHits}</div>
                        <div className="text-blue-400">{stat.inUse ? "Yes" : "No"}</div>
                      </div>
                    ))}
                  </div>
                )}

                {retryPass > 0 && (
                  <Alert className="bg-blue-900/20 border-blue-900">
                    <RefreshCw className="h-4 w-4" />
                    <AlertTitle>Retry Pass {retryPass}</AlertTitle>
                    <AlertDescription>
                      Retrying failed images (pass {retryPass} of {MAX_RETRY_PASSES})
                    </AlertDescription>
                  </Alert>
                )}

                {isRetrying && (
                  <Alert className="bg-blue-900/20 border-blue-900">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Preparing Retry Pass</AlertTitle>
                    <AlertDescription>
                      Waiting {retryDelay} seconds before starting the next retry pass...
                    </AlertDescription>
                  </Alert>
                )}

                {modelRateLimited && nextTokenTime && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Model Rate Limited</AlertTitle>
                    <AlertDescription>
                      The FLUX.1-schnell-Free model is rate limited to 6 requests per minute. Waiting{" "}
                      {Math.ceil((nextTokenTime - Date.now()) / 1000)}s before continuing...
                    </AlertDescription>
                  </Alert>
                )}

                {allKeysRateLimited && nextTokenTime && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>All API Keys Rate Limited</AlertTitle>
                    <AlertDescription>
                      All API keys are currently rate limited. Waiting {Math.ceil((nextTokenTime - Date.now()) / 1000)}s
                      before continuing...
                    </AlertDescription>
                  </Alert>
                )}

                {currentError && !allKeysRateLimited && !modelRateLimited && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="break-words">{currentError}</AlertDescription>
                  </Alert>
                )}

                {isGenerating ? (
                  <div className="space-y-4">
                    {waitingForRateLimit && nextTokenTime && !allKeysRateLimited && !modelRateLimited && (
                      <Alert className="bg-blue-900/20 border-blue-900">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Rate Limit Active</AlertTitle>
                        <AlertDescription>
                          Waiting for rate limit: {Math.ceil((nextTokenTime - Date.now()) / 1000)}s until next
                          generation
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-center gap-2">
                      <Button variant={isPaused ? "default" : "outline"} onClick={togglePause}>
                        {isPaused ? (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                          </>
                        ) : (
                          <>
                            <PauseCircle className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button variant="destructive" onClick={cancelGeneration}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button onClick={() => setActiveTab("gallery")} disabled={generatedImages.length === 0}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      View Generated Images
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Generation Queue</h3>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {promptStatus.map((status) => {
                      const isCompleted = status.status === "completed"
                      const isProcessing = status.status === "processing"
                      const isFailed = status.status === "failed"
                      const isPending = status.status === "pending"
                      const hasRetries = status.retryHistory && status.retryHistory.length > 0

                      return (
                        <Collapsible key={status.index} className="w-full">
                          <div
                            className={`p-3 rounded-lg flex items-start gap-3 ${
                              isCompleted
                                ? "bg-green-900/20 border border-green-900"
                                : isFailed
                                  ? "bg-red-900/20 border border-red-900"
                                  : isProcessing
                                    ? "bg-yellow-900/20 border border-yellow-900 animate-pulse"
                                    : "bg-slate-800"
                            }`}
                          >
                            <div className="flex-shrink-0 mt-1">
                              {isCompleted ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : isFailed ? (
                                <AlertCircle className="h-5 w-5 text-red-500" />
                              ) : isProcessing ? (
                                <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                              ) : (
                                <Clock className="h-5 w-5 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{status.index + 1}</Badge>
                                <span className="text-xs text-slate-400">
                                  {isCompleted
                                    ? "Completed"
                                    : isFailed
                                      ? `Failed (${status.attempts} attempts)`
                                      : isProcessing
                                        ? "Processing..."
                                        : "Pending"}
                                </span>
                                {status.currentApiKey && isProcessing && (
                                  <Badge variant="outline" className="bg-blue-900/30 text-blue-300">
                                    <Key className="h-3 w-3 mr-1" />
                                    {status.currentApiKey}
                                  </Badge>
                                )}
                                {hasRetries && (
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 ml-auto">
                                      <Info className="h-3.5 w-3.5 mr-1" />
                                      <span className="text-xs">
                                        {status.retryHistory?.length}{" "}
                                        {status.retryHistory?.length === 1 ? "attempt" : "attempts"}
                                      </span>
                                    </Button>
                                  </CollapsibleTrigger>
                                )}
                              </div>
                              <p className="text-sm line-clamp-2">{status.prompt}</p>
                              {status.error && <p className="text-xs text-red-400 mt-1 line-clamp-1">{status.error}</p>}
                            </div>
                          </div>

                          {hasRetries && (
                            <CollapsibleContent>
                              <div className="mt-1 ml-8 pl-4 border-l border-slate-700 space-y-2 py-2">
                                <h5 className="text-xs font-medium text-slate-400">Retry History</h5>
                                {status.retryHistory?.map((retry, idx) => (
                                  <div key={idx} className="text-xs space-y-1 bg-slate-800/50 p-2 rounded">
                                    <div className="flex justify-between">
                                      <span className="font-medium">Attempt {retry.attemptNumber}</span>
                                      <span className="text-slate-400">
                                        {new Date(retry.timestamp).toLocaleTimeString()}
                                      </span>
                                    </div>
                                    <div className="text-xs text-slate-300">
                                      {retry.error === "Success" ? (
                                        <span className="text-green-400">Success</span>
                                      ) : (
                                        <span className="text-red-400">{retry.error}</span>
                                      )}
                                    </div>
                                    {retry.apiKeyUsed && (
                                      <div className="text-xs text-slate-400">API Key: {retry.apiKeyUsed}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          )}
                        </Collapsible>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              {/* Find the gallery tab content section and update the buttons section to include the Reset Gallery button
              Look for the line with <Button onClick={downloadAllImages} disabled={generatedImages.length === 0}>
              and replace that section with: */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <h3 className="text-xl font-semibold">Generated Images</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetGallery} disabled={generatedImages.length === 0}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Reset Gallery
                    </Button>
                    <Button onClick={downloadAllImages} disabled={generatedImages.length === 0 || isDownloading}>
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Zip...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download All Images
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {generatedImages.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No images generated yet</AlertTitle>
                    <AlertDescription>Start the generation process to see images here.</AlertDescription>
                  </Alert>
                ) : (
                  <ImageGallery images={generatedImages} />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        title="Reset Gallery"
        description="Are you sure you want to clear all generated images? This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={handleResetConfirm}
      />
    </div>
  )
}
