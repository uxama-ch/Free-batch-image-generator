"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { ImageCard } from "@/components/image-card"
import { useImageStore } from "@/lib/stores/image-store"
import { useFolderStore } from "@/lib/stores/folder-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/empty-state"

export function GalleryView() {
  const { images } = useImageStore()
  const { activeFolder } = useFolderStore()
  const [groupedImages, setGroupedImages] = useState<Record<string, typeof images>>({})

  // Filter images by active folder - memoize to prevent unnecessary recalculations
  const filteredImages = useMemo(() => {
    return activeFolder ? images.filter((img) => img.folderId === activeFolder.id) : images
  }, [images, activeFolder])

  // Group images by date
  useEffect(() => {
    const grouped = filteredImages.reduce(
      (acc, image) => {
        const date = format(new Date(image.createdAt), "yyyy-MM-dd")
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(image)
        return acc
      },
      {} as Record<string, typeof images>,
    )

    // Sort each group by createdAt (newest first)
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })

    setGroupedImages(grouped)
  }, [filteredImages])

  // Sort dates (newest first) - memoize to prevent unnecessary recalculations
  const sortedDates = useMemo(() => {
    return Object.keys(groupedImages).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [groupedImages])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          {activeFolder ? `${activeFolder.name} - ` : ""}
          Gallery
        </h2>
        <Tabs defaultValue="timeline" className="w-[200px]">
          <TabsList>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <TabsContent value="timeline" className="space-y-8 mt-0">
                {sortedDates.length > 0 ? (
                  sortedDates.map((date) => (
                    <div key={date} className="space-y-4">
                      <h3 className="text-lg font-semibold sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                        {format(new Date(date), "MMMM d, yyyy")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedImages[date].map((image) => (
                          <ImageCard key={image.id} image={image} />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No images yet" description="Generate your first image to see it here." />
                )}
              </TabsContent>

              <TabsContent value="grid" className="mt-0">
                {filteredImages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredImages
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((image) => (
                        <ImageCard key={image.id} image={image} />
                      ))}
                  </div>
                ) : (
                  <EmptyState title="No images yet" description="Generate your first image to see it here." />
                )}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
