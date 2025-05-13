"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ImageType } from "@/lib/types"

interface ImageStore {
  images: ImageType[]
  addImage: (image: ImageType) => void
  deleteImage: (id: string) => void
  getImage: (id: string) => ImageType | undefined
}

export const useImageStore = create<ImageStore>()(
  persist(
    (set, get) => ({
      images: [],
      addImage: (image) =>
        set((state) => ({
          images: [...state.images, image],
        })),
      deleteImage: (id) =>
        set((state) => ({
          images: state.images.filter((image) => image.id !== id),
        })),
      getImage: (id) => get().images.find((image) => image.id === id),
    }),
    {
      name: "image-store",
    },
  ),
)
