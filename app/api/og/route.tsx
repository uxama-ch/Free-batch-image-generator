import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Get title from query params or use default
    const title = searchParams.get("title") || "Free Batch Image Generator"
    const description = searchParams.get("description") || "Generate beautiful images with Together AI"

    // Load fonts
    const interBold = await fetch(
      new URL("https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap", request.url),
    ).then((res) => res.arrayBuffer())

    const interRegular = await fetch(
      new URL("https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap", request.url),
    ).then((res) => res.arrayBuffer())

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1e293b",
          padding: "40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
          }}
        >
          {/* You can add a logo here */}
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 2H18C20.2091 2 22 3.79086 22 6V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V6C2 3.79086 3.79086 2 6 2Z"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z"
              fill="white"
            />
            <path d="M21 15L16 10L10 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "white",
              marginLeft: "10px",
            }}
          >
            Image Generator
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f172a",
            borderRadius: "12px",
            padding: "20px",
            width: "100%",
            maxWidth: "80%",
          }}
        >
          <h2
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              marginBottom: "10px",
              lineHeight: 1.2,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            {description}
          </p>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: interBold,
            style: "normal",
            weight: 700,
          },
          {
            name: "Inter",
            data: interRegular,
            style: "normal",
            weight: 400,
          },
        ],
      },
    )
  } catch (error) {
    console.error("Error generating OG image:", error)
    return new Response("Failed to generate OG image", { status: 500 })
  }
}
