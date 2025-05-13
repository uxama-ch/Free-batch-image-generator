import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeDebug } from "@/components/theme-debug"

export default function ThemeTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Theme Test Page</h1>
      <p className="text-xl text-muted-foreground mb-8">Test the light and dark mode functionality</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Light/Dark Mode Test</CardTitle>
            <CardDescription>This card should adapt to the current theme</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This content should be readable in both light and dark modes. The colors should provide sufficient
              contrast and the UI elements should be clearly visible.
            </p>
            <div className="flex gap-2">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Primary Color Test</CardTitle>
            <CardDescription className="text-primary-foreground/70">
              Testing primary color and foreground
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              This card uses the primary color as background and primary-foreground for text. It should maintain good
              contrast in both themes.
            </p>
            <Button variant="secondary">Secondary on Primary</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-background border rounded-lg">Background</div>
        <div className="p-4 bg-card border rounded-lg">Card</div>
        <div className="p-4 bg-muted border rounded-lg">Muted</div>
        <div className="p-4 bg-primary text-primary-foreground border rounded-lg">Primary</div>
        <div className="p-4 bg-secondary text-secondary-foreground border rounded-lg">Secondary</div>
        <div className="p-4 bg-accent text-accent-foreground border rounded-lg">Accent</div>
        <div className="p-4 bg-destructive text-destructive-foreground border rounded-lg">Destructive</div>
        <div className="p-4 bg-popover text-popover-foreground border rounded-lg">Popover</div>
        <div className="p-4 border rounded-lg">Border</div>
      </div>

      <ThemeDebug />
    </div>
  )
}
