"use client"

import { useState } from "react"
import { FolderPlus, Folder, FolderOpen, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useFolderStore } from "@/lib/stores/folder-store"
import { CreateFolderDialog } from "@/components/create-folder-dialog"

interface FolderSidebarProps {
  className?: string
}

export function FolderSidebar({ className }: FolderSidebarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { folders, activeFolder, setActiveFolder, deleteFolder } = useFolderStore()

  // Memoize folder selection handlers to prevent recreating them on each render
  const handleAllImagesClick = () => {
    setActiveFolder(null)
  }

  const handleFolderClick = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId)
    if (folder) {
      setActiveFolder(folder)
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-3 py-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Folders</h2>
        <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(true)}>
          <FolderPlus className="h-5 w-5" />
        </Button>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="px-1 py-2">
          <Button
            variant={activeFolder === null ? "secondary" : "ghost"}
            className="w-full justify-start mb-1"
            onClick={handleAllImagesClick}
          >
            <Folder className="mr-2 h-4 w-4" />
            All Images
          </Button>

          {folders.length > 0 ? (
            folders.map((folder) => (
              <div key={folder.id} className="flex items-center group">
                <Button
                  variant={activeFolder?.id === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start mb-1"
                  onClick={() => handleFolderClick(folder.id)}
                >
                  {activeFolder?.id === folder.id ? (
                    <FolderOpen className="mr-2 h-4 w-4" />
                  ) : (
                    <Folder className="mr-2 h-4 w-4" />
                  )}
                  {folder.name}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteFolder(folder.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">No folders created yet</div>
          )}
        </div>
      </ScrollArea>
      <Separator />
      <div className="p-3">
        <Button variant="outline" className="w-full justify-start" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>

      <CreateFolderDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
