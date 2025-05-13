import { togetherai } from "@ai-sdk/togetherai"
import { experimental_generateImage } from "ai"

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
  try {
    const { prompt, negativePrompt, size, seed, steps, folderId } = await req.json()

    // Ensure steps are within the allowed range for FLUX.1-schnell-Free model
    const validSteps = Math.min(Math.max(steps || 2, 1), 4)

    // Convert aspect ratio to dimensions
    const dimensions = getImageDimensions(size)
    const imageSize = `${dimensions.width}x${dimensions.height}`

    // Generate image using Together AI
    const { images } = await experimental_generateImage({
      model: togetherai.image("black-forest-labs/FLUX.1-schnell-Free"),
      prompt,
      size: imageSize,
      providerOptions: {
        togetherai: {
          negative_prompt: negativePrompt,
          seed: seed || Math.floor(Math.random() * 2147483647),
          steps: validSteps,
        },
      },
    })

    // Convert the image to a data URL
    const buffer = images[0].uint8Array
    const base64 = Buffer.from(buffer).toString("base64")
    const imageUrl = `data:image/png;base64,${base64}`

    return Response.json({ imageUrl })
  } catch (error) {
    console.error("Error generating image:", error)
    return Response.json({ error: "Failed to generate image" }, { status: 500 })
  }
}
