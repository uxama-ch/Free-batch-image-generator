// This file contains utilities for image optimization

// Function to get the appropriate image size based on viewport
export function getResponsiveImageSize(viewportWidth: number): string {
  if (viewportWidth < 640) {
    return "640w"
  } else if (viewportWidth < 768) {
    return "768w"
  } else if (viewportWidth < 1024) {
    return "1024w"
  } else if (viewportWidth < 1280) {
    return "1280w"
  } else {
    return "1536w"
  }
}

// Function to generate srcSet for responsive images
export function generateSrcSet(basePath: string, filename: string, extension = "jpg"): string {
  const sizes = [640, 768, 1024, 1280, 1536]

  return sizes.map((size) => `${basePath}/${filename}-${size}.${extension} ${size}w`).join(", ")
}

// Function to get image dimensions for proper aspect ratio
export function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  switch (aspectRatio) {
    case "16:9":
      return { width: 16, height: 9 }
    case "4:3":
      return { width: 4, height: 3 }
    case "1:1":
      return { width: 1, height: 1 }
    case "9:16":
      return { width: 9, height: 16 }
    default:
      return { width: 1, height: 1 }
  }
}

// Function to lazy load images
export function lazyLoadImage(imageElement: HTMLImageElement): void {
  if ("loading" in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    imageElement.loading = "lazy"
  } else {
    // Fallback for browsers that don't support native lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.getAttribute("data-src")
          if (src) {
            img.src = src
            img.removeAttribute("data-src")
          }
          observer.unobserve(img)
        }
      })
    })

    observer.observe(imageElement)
  }
}
