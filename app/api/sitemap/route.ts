import { NextResponse } from "next/server"
import { generateSitemap } from "@/lib/sitemap"

export async function GET(request: Request) {
  try {
    // Get the host from the request
    const url = new URL(request.url)
    const domain = `${url.protocol}//${url.host}`

    // Generate the sitemap
    await generateSitemap(domain)

    return NextResponse.json({ success: true, message: "Sitemap generated successfully" })
  } catch (error) {
    console.error("Error generating sitemap:", error)
    return NextResponse.json({ success: false, error: "Failed to generate sitemap" }, { status: 500 })
  }
}
