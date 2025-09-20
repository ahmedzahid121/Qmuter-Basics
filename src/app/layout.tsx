import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { MobileBottomNav } from "@/components/MobileBottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Qmuter - Community Route Sharing",
  description: "Connect with drivers and passengers on similar routes. Make travel more sustainable, affordable, and community-driven.",
  keywords: "ride sharing, carpooling, community transport, sustainable travel, Auckland transport",
  authors: [{ name: "Qmuter Team" }],
  creator: "Qmuter",
  publisher: "Qmuter",
  robots: "index, follow",
  // Favicon configuration
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192x192.html', sizes: '192x192', type: 'text/html' },
      { url: '/icons/icon-512x512.html', sizes: '512x512', type: 'text/html' }
    ],
    apple: [
      { url: '/icons/icon-192x192.html', sizes: '192x192', type: 'text/html' }
    ]
  },
  openGraph: {
    type: "website",
    locale: "en_NZ",
    url: "https://qmuter.nz",
    title: "Qmuter - Community Route Sharing",
    description: "Connect with drivers and passengers on similar routes. Make travel more sustainable, affordable, and community-driven.",
    siteName: "Qmuter",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Qmuter - Community Route Sharing"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Qmuter - Community Route Sharing",
    description: "Connect with drivers and passengers on similar routes. Make travel more sustainable, affordable, and community-driven.",
    images: ["/og-image.png"]
  },
  // PWA Meta Tags
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Qmuter",
    startupImage: [
      {
        url: "/splash/apple-splash-2048-2732.png",
        media: "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/splash/apple-splash-1668-2388.png",
        media: "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/splash/apple-splash-1536-2048.png",
        media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/splash/apple-splash-1125-2436.png",
        media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        url: "/splash/apple-splash-1242-2688.png",
        media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        url: "/splash/apple-splash-750-1334.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        url: "/splash/apple-splash-640-1136.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
      }
    ]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Qmuter",
    "msapplication-TileColor": "#10b981",
    "msapplication-config": "/browserconfig.xml"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#10b981",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Qmuter" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Qmuter" />
        <meta name="description" content="Community route sharing app" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#10b981" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167x167.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#10b981" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
          <PWAInstallPrompt />
          <MobileBottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
