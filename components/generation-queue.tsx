"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface GenerationQueueProps {
  prompts: string[]
  completedCount: number
  failedCount: number
  generatedImages: Array<{ id: string; url: string; prompt: string }>
}

export function GenerationQueue({ prompts, completedCount, failedCount, generatedImages }: GenerationQueueProps) {
  const processedIds = new Set(generatedImages.map((img) => img.id))
  const totalProcessed = completedCount + failedCount

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-xl font-semibold mb-4">Generation Queue</h3>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {prompts.map((prompt, index) => {
              const imageId = `image-${index + 1}`
              const isCompleted = processedIds.has(imageId)
              const isProcessing = totalProcessed === index
              const isFailed = totalProcessed > index && !isCompleted
              const isPending = totalProcessed < index

              return (
                <div
                  key={index}
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
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : isProcessing ? (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="text-xs text-slate-400">
                        {isCompleted ? "Completed" : isFailed ? "Failed" : isProcessing ? "Processing..." : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{prompt}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
