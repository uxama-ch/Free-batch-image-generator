"use client"

import { useState } from "react"
import Image from "next/image"
import { Download, Expand, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ImageGalleryProps {
  images: Array<{ id: string; url: string; prompt: string }>
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<(typeof images)[0] | null>(null)

  const downloadImage = (image: (typeof images)[0]) => {
    const link = document.createElement("a")
    link.href = image.url
    link.download = `${image.id.replace("image-", "")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={image.id} className="relative group overflow-hidden rounded-lg bg-slate-800">
            <div className="aspect-square relative">
              <Image
                src={image.url || "/placeholder.svg"}
                alt={`Generated image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setSelectedImage(image)}>
                  <Expand className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => downloadImage(image)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-between">
              <Badge variant="outline">{image.id.replace("image-", "")}</Badge>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => downloadImage(image)}>
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image {selectedImage?.id.replace("image-", "")}</DialogTitle>
            <DialogDescription className="line-clamp-2">{selectedImage?.prompt}</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square sm:aspect-video w-full">
            {selectedImage && (
              <Image
                src={selectedImage.url || "/placeholder.svg"}
                alt={`Generated image ${selectedImage.id}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              />
            )}
          </div>
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setSelectedImage(null)}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
            <Button onClick={() => selectedImage && downloadImage(selectedImage)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
