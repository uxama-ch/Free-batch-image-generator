import { togetherai } from "@ai-sdk/togetherai"
import { experimental_generateImage } from "ai"
import { getKeyManager, maskApiKey } from "@/lib/key-manager"
import { ModelRateLimiter } from "@/lib/rate-limiter"

// Model ID constant
const MODEL_ID = "black-forest-labs/FLUX.1-schnell-Free"

// Convert aspect ratio to pixel dimensions
function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  const BASE_SIZE = 1024

  switch (aspectRatio) {
    case "16:9":
      return { width: BASE_SIZE, height: Math.round(BASE_SIZE * (9 / 16)) }
    case "9:16":
      return { width: Math.round(BASE_SIZE * (9 / 16)), height: BASE_SIZE }
    case "1:1":
    default:
      return { width: BASE_SIZE, height: BASE_SIZE }
  }
}

export async function POST(req: Request) {
  const keyManager = getKeyManager()
  const modelRateLimiter = ModelRateLimiter.getInstance()
  let currentKey: string | null = null
  let requestData: any = null

  try {
    // Parse the request body safely
    try {
      const text = await req.text()
      console.log(`Request body (${text.length} chars):`, text.substring(0, 200))

      try {
        requestData = JSON.parse(text)
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError)
        return Response.json(
          {
            error: "Invalid request format",
            details: "Could not parse request body as JSON",
          },
          { status: 400 },
        )
      }
    } catch (parseError) {
      console.error("Error reading request body:", parseError)
      return Response.json(
        {
          error: "Invalid request format",
          details: "Could not read request body",
        },
        { status: 400 },
      )
    }

    const {
      prompt,
      negativePrompt,
      size,
      steps,
      seed,
      imageNumber,
      retryAttempt = 0,
      attemptNumber = 0,
      apiKeys,
      specificKey = null, // Allow specifying a particular key to use
    } = requestData

    // Validate required parameters
    if (!prompt) {
      return Response.json(
        {
          error: "Missing required parameter",
          details: "Prompt is required",
        },
        { status: 400 },
      )
    }

    // Check model-specific rate limit first
    const modelWaitTime = await modelRateLimiter.waitForToken(MODEL_ID)
    if (modelWaitTime > 0) {
      console.log(`Model rate limit reached for ${MODEL_ID}. Need to wait ${modelWaitTime}ms`)
      return Response.json(
        {
          error: "Model rate limit reached",
          details: `The model ${MODEL_ID} is rate limited. Please try again in ${Math.ceil(modelWaitTime / 1000)} seconds.`,
          retryAfter: modelWaitTime,
          isModelRateLimit: true,
        },
        { status: 429 },
      )
    }

    // Ensure steps are within the allowed range for FLUX.1-schnell-Free model
    const validSteps = Math.min(Math.max(steps || 2, 1), 4)

    // Convert aspect ratio to dimensions
    const dimensions = getImageDimensions(size || "1:1")
    const imageSize = `${dimensions.width}x${dimensions.height}`

    // Add the provided API keys if they exist
    if (apiKeys && Array.isArray(apiKeys)) {
      apiKeys.forEach((key: string) => {
        if (typeof key === "string" && key.trim() !== "") {
          keyManager.addKey(key.trim())
        }
      })
    }

    // Maximum number of key rotation attempts
    const MAX_KEY_ATTEMPTS = 3
    let keyAttempts = 0
    let lastError: Error | null = null

    // Try with different keys if needed
    while (keyAttempts < MAX_KEY_ATTEMPTS) {
      // Get the key to use - either the specified key or the next available one
      if (specificKey && keyAttempts === 0) {
        // Try to reserve the specific key if requested
        if (keyManager.reserveKey(specificKey)) {
          currentKey = specificKey
        } else {
          // If the specific key is not available, get the next available key
          currentKey = keyManager.getNextKey()
        }
      } else {
        // Get the next available key
        currentKey = keyManager.getNextKey()
      }

      // If no key is available, wait for the cooldown
      if (!currentKey) {
        const waitTime = keyManager.getTimeUntilNextKeyAvailable()
        if (waitTime > 0) {
          console.log(`All keys are rate limited or in use. Waiting ${waitTime}ms for cooldown...`)
          return Response.json(
            {
              error: "All API keys are rate limited or in use",
              details: `Please try again in ${Math.ceil(waitTime / 1000)} seconds`,
              retryAfter: waitTime,
            },
            { status: 429 },
          )
        } else {
          return Response.json(
            {
              error: "No API keys available",
              details: "No API keys are configured or all keys are invalid",
            },
            { status: 500 },
          )
        }
      }

      try {
        console.log(
          `Starting image generation for prompt: "${prompt.substring(0, 50)}..." (attempt ${
            retryAttempt + 1
          }, key attempt ${keyAttempts + 1}, overall attempt ${attemptNumber + 1}, using key ${maskApiKey(currentKey)})`,
        )

        // Generate image using Together AI with the current key
        const result = await experimental_generateImage({
          model: togetherai.image(MODEL_ID),
          prompt,
          size: imageSize,
          providerOptions: {
            togetherai: {
              negative_prompt: negativePrompt || "",
              seed: seed || Math.floor(Math.random() * 2147483647),
              steps: validSteps,
              apiKey: currentKey, // Use the current key
            },
          },
        })

        console.log("Image generation successful, processing result")

        // Verify we got an image back
        if (!result || !result.images || result.images.length === 0 || !result.images[0].uint8Array) {
          console.error("No image data received from the API:", result)
          // Release the key before throwing the error
          if (currentKey) {
            keyManager.releaseKey(currentKey)
          }
          throw new Error("No image data received from the API")
        }

        // Convert the image to a data URL
        const buffer = result.images[0].uint8Array
        const base64 = Buffer.from(buffer).toString("base64")
        const imageUrl = `data:image/png;base64,${base64}`

        console.log(`Successfully processed image ${imageNumber}, returning response`)

        // Mark the key as successful (this also releases the key)
        if (currentKey) {
          keyManager.markSuccess(currentKey)
        }

        // Return a successful response
        return new Response(
          JSON.stringify({
            imageUrl,
            imageNumber,
            success: true,
            apiKeyUsed: currentKey ? maskApiKey(currentKey) : undefined,
            keyStats: keyManager.getStats().map((stat) => ({
              totalRequests: stat.totalRequests,
              successfulRequests: stat.successfulRequests,
              failedRequests: stat.failedRequests,
              rateLimitHits: stat.rateLimitHits,
              isRateLimited: stat.isRateLimited,
              inUse: stat.inUse,
            })),
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        )
      } catch (generationError) {
        console.error("Error generating image with Together AI:", generationError)

        // Check if this is a rate limit error
        const errorMessage =
          generationError instanceof Error ? generationError.message : "Unknown error during image generation"
        const isRateLimit =
          errorMessage.toLowerCase().includes("rate limit") || errorMessage.toLowerCase().includes("too many requests")

        // If this is a model-specific rate limit, handle it globally
        if (isRateLimit && errorMessage.includes(MODEL_ID)) {
          // Apply a longer cooldown for model-specific rate limits
          modelRateLimiter.handleRateLimitError(MODEL_ID, 30)
          console.log(`Model-specific rate limit hit for ${MODEL_ID}, applying 30s cooldown`)
        }

        // Mark the key as failed (this also releases the key)
        if (currentKey) {
          keyManager.markFailed(currentKey, isRateLimit)
        }

        // Store the error for potential return if all keys fail
        lastError = generationError instanceof Error ? generationError : new Error(String(generationError))

        // If it's a rate limit, try another key
        if (isRateLimit) {
          console.log(`Key ${maskApiKey(currentKey || "")} hit rate limit, trying another key`)
          keyAttempts++
          continue
        } else {
          // For other errors, return immediately
          return new Response(
            JSON.stringify({
              error: "Image generation failed",
              details: errorMessage,
              apiKeyUsed: currentKey ? maskApiKey(currentKey) : undefined,
              keyStats: keyManager.getStats().map((stat) => ({
                totalRequests: stat.totalRequests,
                successfulRequests: stat.successfulRequests,
                failedRequests: stat.failedRequests,
                rateLimitHits: stat.rateLimitHits,
                isRateLimited: stat.isRateLimited,
                inUse: stat.inUse,
              })),
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
              },
            },
          )
        }
      }
    }

    // If we've tried all keys and all failed with rate limits
    return new Response(
      JSON.stringify({
        error: "All API keys are rate limited",
        details: lastError ? lastError.message : "Failed to generate image after trying all available API keys",
        keyStats: keyManager.getStats().map((stat) => ({
          totalRequests: stat.totalRequests,
          successfulRequests: stat.successfulRequests,
          failedRequests: stat.failedRequests,
          rateLimitHits: stat.rateLimitHits,
          isRateLimited: stat.isRateLimited,
          inUse: stat.inUse,
        })),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    // Catch-all error handler
    console.error("Unhandled error in generate-batch API route:", error)

    // Mark the key as failed if it was being used (this also releases the key)
    if (currentKey) {
      keyManager.markFailed(currentKey, false)
    }

    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown server error",
        apiKeyUsed: currentKey ? maskApiKey(currentKey) : undefined,
        keyStats: keyManager.getStats().map((stat) => ({
          totalRequests: stat.totalRequests,
          successfulRequests: stat.successfulRequests,
          failedRequests: stat.failedRequests,
          rateLimitHits: stat.rateLimitHits,
          isRateLimited: stat.isRateLimited,
          inUse: stat.inUse,
        })),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
