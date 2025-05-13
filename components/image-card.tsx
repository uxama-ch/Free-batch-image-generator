"use client"

import { useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Download, Expand, Trash2, FolderOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useImageStore } from "@/lib/stores/image-store"
import { useFolderStore } from "@/lib/stores/folder-store"
import type { ImageType } from "@/lib/types"

interface ImageCardProps {
  image: ImageType
  className?: string
}

// Helper function to determine object-fit based on aspect ratio
function getObjectFit(size: string): "cover" | "contain" {
  switch (size) {
    case "16:9":
    case "9:16":
      return "cover"
    case "1:1":
    default:
      return "cover"
  }
}

export function ImageCard({ image, className }: ImageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const { deleteImage } = useImageStore()
  const { folders, getFolder } = useFolderStore()

  const folder = image.folderId ? getFolder(image.folderId) : null
  const objectFit = getObjectFit(image.size)

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = image.url
    link.download = `image-${image.id.slice(0, 8)}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Card className={cn("overflow-hidden group", className)}>
        <CardHeader className="p-0">
          <div className="relative aspect-square">
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.prompt}
              fill
              className={`object-${objectFit} transition-all hover:scale-105`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setIsExpanded(true)}>
                <Expand className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="p-3 flex justify-between items-center">
          <div className="truncate flex-1">
            <p className="text-sm font-medium truncate" title={image.prompt}>
              {image.prompt}
            </p>
            <p className="text-xs text-muted-foreground">{format(new Date(image.createdAt), "MMM d, h:mm a")}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowDetails(true)}>View Details</DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload}>Download</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteImage(image.id)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      {/* Expanded Image Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl">
          <div className="relative aspect-square sm:aspect-video w-full">
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.prompt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>
          <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
            <div className="text-sm">
              <p className="font-medium">{image.prompt}</p>
              <p className="text-muted-foreground">{format(new Date(image.createdAt), "MMMM d, yyyy h:mm a")}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDetails(true)}>
                Details
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Image Details</DialogTitle>
            <DialogDescription>Details about the generated image.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Prompt:</span>
              <span className="col-span-3 text-sm">{image.prompt}</span>
            </div>

            {image.negativePrompt && (
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-sm font-medium">Negative Prompt:</span>
                <span className="col-span-3 text-sm">{image.negativePrompt}</span>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Aspect Ratio:</span>
              <span className="col-span-3 text-sm">{image.size}</span>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Seed:</span>
              <span className="col-span-3 text-sm">{image.seed}</span>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Steps:</span>
              <span className="col-span-3 text-sm">{image.steps}</span>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Folder:</span>
              <span className="col-span-3 text-sm flex items-center">
                {folder ? (
                  <>
                    <FolderOpen className="h-4 w-4 mr-1 text-muted-foreground" />
                    {folder.name}
                  </>
                ) : (
                  "None"
                )}
              </span>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Created:</span>
              <span className="col-span-3 text-sm">{format(new Date(image.createdAt), "MMMM d, yyyy h:mm a")}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteImage(image.id)
                setShowDetails(false)
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
