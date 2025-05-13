"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Trash2, Key, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface ApiKeyStats {
  key: string
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  rateLimitHits: number
  isRateLimited: boolean
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<string[]>([])
  const [newApiKey, setNewApiKey] = useState("")
  const [keyStats, setKeyStats] = useState<ApiKeyStats[]>([])
  const [isAddingKey, setIsAddingKey] = useState(false)
  const { toast } = useToast()

  // Load saved API keys from localStorage
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      const savedKeys = localStorage.getItem("togetherAiApiKeys")
      if (savedKeys) {
        try {
          setApiKeys(JSON.parse(savedKeys))
        } catch (e) {
          console.error("Error loading saved API keys:", e)
        }
      }
    }
  }, [])

  // Save API keys to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined" && apiKeys.length > 0) {
      localStorage.setItem("togetherAiApiKeys", JSON.stringify(apiKeys))
    }
  }, [apiKeys])

  const addApiKey = () => {
    if (!newApiKey.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid API Key",
        description: "Please enter a valid API key.",
      })
      return
    }

    if (apiKeys.includes(newApiKey.trim())) {
      toast({
        variant: "destructive",
        title: "Duplicate API Key",
        description: "This API key has already been added.",
      })
      return
    }

    setApiKeys([...apiKeys, newApiKey.trim()])
    setNewApiKey("")
    setIsAddingKey(false)

    toast({
      title: "API Key Added",
      description: "Your Together AI API key has been added successfully.",
    })
  }

  const removeApiKey = (keyToRemove: string) => {
    setApiKeys(apiKeys.filter((key) => key !== keyToRemove))
    toast({
      title: "API Key Removed",
      description: "The API key has been removed.",
    })
  }

  // Update key stats when they're received from the API
  const updateKeyStats = (stats: ApiKeyStats[]) => {
    setKeyStats(stats)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            Together AI API Keys
          </CardTitle>
          <CardDescription>
            Add multiple Together AI API keys to increase your generation capacity and handle rate limits.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No API Keys Added</AlertTitle>
              <AlertDescription>
                Add your Together AI API keys to start generating images. Multiple keys will help handle rate limits.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key, index) => {
                const stats = keyStats.find((s) => s.key === key)
                const maskedKey = `${key.substring(0, 8)}...${key.substring(key.length - 4)}`

                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <Key className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">{maskedKey}</span>
                      {stats?.isRateLimited && (
                        <Badge variant="destructive" className="ml-2">
                          Rate Limited
                        </Badge>
                      )}
                    </div>
                    {stats && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span title="Total Requests">
                          <RefreshCw className="inline h-3 w-3 mr-1" />
                          {stats.totalRequests}
                        </span>
                        <span title="Successful Requests" className="text-green-500">
                          <CheckCircle className="inline h-3 w-3 mr-1" />
                          {stats.successfulRequests}
                        </span>
                        <span title="Failed Requests" className="text-red-500">
                          <AlertCircle className="inline h-3 w-3 mr-1" />
                          {stats.failedRequests}
                        </span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeApiKey(key)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setIsAddingKey(true)} className="w-full">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add API Key
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isAddingKey} onOpenChange={setIsAddingKey}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Together AI API Key</DialogTitle>
            <DialogDescription>
              Enter your Together AI API key. You can find this in your Together AI dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter your Together AI API key"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              className="font-mono"
            />
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Key Security</AlertTitle>
              <AlertDescription>
                Your API keys are stored locally in your browser and are never sent to our servers.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingKey(false)}>
              Cancel
            </Button>
            <Button onClick={addApiKey}>Add API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
