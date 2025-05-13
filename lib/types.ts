export interface ImageType {
  id: string
  url: string
  prompt: string
  negativePrompt?: string
  size: string
  seed: number
  steps: number
  createdAt: string
  folderId?: string | null
}

export interface FolderType {
  id: string
  name: string
  createdAt: string
}

export interface GenerationSettings {
  aspectRatio: string
  steps: number
  batchSize: number
  negativePrompt: string
  useRandomSeed: boolean
  seed: number
}
