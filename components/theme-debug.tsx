"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function ThemeDebug() {
  const { theme, setTheme, systemTheme, themes } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [cssVars, setCssVars] = useState<Record<string, string>>({})

  useEffect(() => {
    setMounted(true)

    // Get computed CSS variables
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)
    const vars: Record<string, string> = {}

    // Get key CSS variables
    const varNames = [
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
    ]

    varNames.forEach((name) => {
      vars[name] = computedStyle.getPropertyValue(name)
    })

    setCssVars(vars)
  }, [theme])

  if (!mounted) {
    return null
  }

  return (
    <Card className="max-w-md mx-auto my-8">
      <CardHeader>
        <CardTitle>Theme Debugger</CardTitle>
        <CardDescription>Current theme settings and CSS variables</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Current Theme:</div>
          <div>{theme}</div>

          <div className="font-medium">System Theme:</div>
          <div>{systemTheme}</div>

          <div className="font-medium">Available Themes:</div>
          <div>{themes.join(", ")}</div>

          <div className="font-medium">HTML Class:</div>
          <div>{document.documentElement.classList.contains("dark") ? "dark" : "light"}</div>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">CSS Variables:</h3>
          <div className="text-xs font-mono bg-muted p-2 rounded overflow-auto max-h-40">
            {Object.entries(cssVars).map(([name, value]) => (
              <div key={name}>
                {name}: {value}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={() => setTheme("light")}>
            Set Light
          </Button>
          <Button size="sm" onClick={() => setTheme("dark")}>
            Set Dark
          </Button>
          <Button size="sm" onClick={() => setTheme("system")}>
            Set System
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
