"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

export function useThemeEffect() {
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    // Add a class to prevent transitions during theme change
    const handleThemeChange = () => {
      document.documentElement.classList.add("no-transitions")
      setTimeout(() => {
        document.documentElement.classList.remove("no-transitions")
      }, 100)
    }

    // Listen for theme changes
    window.addEventListener("themeChange", handleThemeChange)

    // Fix for theme flashing on page load
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme && savedTheme !== resolvedTheme) {
      setTheme(savedTheme)
    }

    // Check for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem("theme") === "system") {
        setTheme("system")
        document.dispatchEvent(new Event("themeChange"))
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)

    return () => {
      window.removeEventListener("themeChange", handleThemeChange)
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
    }
  }, [resolvedTheme, setTheme])
}
