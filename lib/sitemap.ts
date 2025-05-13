import fs from "fs"
import { globby } from "globby"

// This function generates a sitemap.xml file based on your pages
export async function generateSitemap(domain: string) {
  if (!domain) {
    throw new Error("Please provide a domain for sitemap generation")
  }

  // Get all .tsx files in the app directory
  const pages = await globby([
    "app/**/page.tsx",
    "!app/api/**/*",
    "!app/**/not-found.tsx",
    "!app/**/error.tsx",
    "!app/**/loading.tsx",
    "!app/**/layout.tsx",
  ])

  // Transform the pages into sitemap entries
  const sitemapEntries = pages
    .map((page) => {
      // Convert page path to route
      const path = page.replace("app", "").replace("/page.tsx", "").replace("/index.tsx", "")

      // Skip dynamic routes for now
      if (path.includes("[") || path.includes("(")) {
        return null
      }

      // Format the path correctly
      const route = path === "" ? "/" : path

      // Return sitemap entry with lastmod date
      return `
        <url>
            <loc>${domain}${route}</loc>
            <lastmod>${new Date().toISOString()}</lastmod>
            <changefreq>weekly</changefreq>
            <priority>${route === "/" ? "1.0" : "0.8"}</priority>
        </url>
      `
    })
    .filter(Boolean)
    .join("")

  // Construct the sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${sitemapEntries}
    </urlset>
  `

  // Write the sitemap to the public directory
  fs.writeFileSync("public/sitemap.xml", sitemap)
  console.log("Sitemap generated successfully")
}
