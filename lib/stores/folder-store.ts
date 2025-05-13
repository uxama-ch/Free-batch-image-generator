"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { FolderType } from "@/lib/types"

interface FolderStore {
  folders: FolderType[]
  activeFolder: FolderType | null
  addFolder: (folder: FolderType) => void
  deleteFolder: (id: string) => void
  setActiveFolder: (folder: FolderType | null) => void
  getFolder: (id: string) => FolderType | undefined
}

export const useFolderStore = create<FolderStore>()(
  persist(
    (set, get) => ({
      folders: [],
      activeFolder: null,
      addFolder: (folder) =>
        set((state) => ({
          folders: [...state.folders, folder],
        })),
      deleteFolder: (id) =>
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          // If the active folder is being deleted, set activeFolder to null
          activeFolder: state.activeFolder?.id === id ? null : state.activeFolder,
        })),
      setActiveFolder: (folder) => {
        // Only update if the folder has changed to prevent unnecessary rerenders
        set((state) => {
          if (
            (folder === null && state.activeFolder === null) ||
            (folder !== null && state.activeFolder !== null && folder.id === state.activeFolder.id)
          ) {
            // No change needed
            return state
          }
          return { activeFolder: folder }
        })
      },
      getFolder: (id) => get().folders.find((folder) => folder.id === id),
    }),
    {
      name: "folder-store",
    },
  ),
)
