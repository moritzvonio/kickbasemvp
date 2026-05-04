import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { env } from "@/lib/env";

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
    default: "BetterBase — Die smarteste Kickbase-Companion-App",
    template: "%s · BetterBase",
  },
  description:
    "Liga-Dashboard, Marktwert-Insights und Transfer-Coach für deine Kickbase-Saison. Mit deinem Kickbase-Login einloggen, Passwort wird nicht gespeichert.",
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  openGraph: {
    title: "BetterBase",
    description: "Die smarteste Kickbase-Companion-App.",
    type: "website",
    locale: "de_DE",
  },
  applicationName: env.NEXT_PUBLIC_APP_NAME,
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
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
      </body>
    </html>
  );
}
