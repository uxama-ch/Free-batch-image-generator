import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Privacy Policy</h1>
      <p className="text-xl text-muted-foreground mb-8">Our commitment to protecting your privacy</p>

      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. Introduction</h2>
          <p>
            Welcome to the Together AI Image Generator. We respect your privacy and are committed to protecting your
            personal data. This privacy policy will inform you about how we look after your personal data when you visit
            our website and tell you about your privacy rights and how the law protects you.
          </p>

          <h2>2. Data We Collect</h2>
          <p>When you use our service, we may collect the following types of information:</p>
          <ul>
            <li>
              <strong>API Keys:</strong> If you choose to add your Together AI API keys, these are stored locally in
              your browser's localStorage and are never sent to our servers.
            </li>
            <li>
              <strong>Generated Images:</strong> The images you generate are stored locally in your browser and are not
              uploaded to our servers.
            </li>
            <li>
              <strong>Usage Data:</strong> We may collect anonymous usage data to improve our service, such as which
              features are most commonly used.
            </li>
          </ul>

          <h2>3. How We Use Your Data</h2>
          <p>We use your data in the following ways:</p>
          <ul>
            <li>To provide and maintain our service</li>
            <li>To improve and personalize your experience</li>
            <li>To analyze usage patterns and improve our service</li>
          </ul>

          <h2>4. Data Storage</h2>
          <p>
            Most of your data, including API keys and generated images, are stored locally in your browser using
            localStorage. This data remains on your device and is not transmitted to our servers.
          </p>

          <h2>5. Third-Party Services</h2>
          <p>
            We use the Together AI API to generate images. When you generate an image, your prompt and API key (if
            provided) are sent to Together AI. Please refer to Together AI's privacy policy for information on how they
            handle your data.
          </p>

          <h2>6. Your Rights</h2>
          <p>
            Depending on your location, you may have certain rights regarding your personal data, such as the right to
            access, correct, or delete your data.
          </p>

          <h2>7. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:Usamariaz558@gmail.com" className="text-primary hover:underline">
              Usamariaz558@gmail.com
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
