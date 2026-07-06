import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { env, isProd } from "@/lib/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LigaBase — die smarteste Companion-App für deine Liga",
    template: "%s · LigaBase",
  },
  description:
    "Liga-Dashboard, Marktwert-Insights und Transfer-Coach für deine Saison. Mit deinem Kickbase-Login einloggen, Passwort wird nicht gespeichert.",
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  openGraph: {
    title: "LigaBase",
    description: "Die smarteste Companion-App für deine Liga.",
    type: "website",
    locale: "de_DE",
  },
  applicationName: env.NEXT_PUBLIC_APP_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // iOS ignoriert SVG- und Manifest-Icons — braucht apple-touch-icon als PNG
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "LigaBase",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground flex flex-col">
        <Providers>{children}</Providers>
        {/* Vercel Web Analytics (cookielos, DSGVO-freundlich) — nur in Production */}
        {isProd && <script defer src="/_vercel/insights/script.js" />}
      </body>
    </html>
  );
}
