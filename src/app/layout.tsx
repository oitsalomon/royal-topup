import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond, Montserrat } from "next/font/google";
import "./globals.css";
import "./global-v4.css";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { AuthProvider } from "@/contexts/AuthProvider";

import { GoogleAnalytics } from '@next/third-parties/google'

const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], variable: '--font-cormorant', weight: ['400', '500', '600', '700'] });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat', weight: ['400', '500', '600', '700'] });

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_BASE_URL) : new URL('https://royalclover.store');

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: "Royal Clover Store - Pusat Chip Royal Dream Termurah & Tercepat",
    template: "%s | Royal Clover Store"
  },
  description: "Toko Chip Royal Dream (Clover Store) terpercaya. Sedia Chip Ungu & Emas, proses 1 detik, aman dan bergaransi withdraw pasti cair.",
  keywords: ["Top Up Game", "Chip Royal Dream", "Beli Chip Murah", "Royal Dream Chip Ungu", "Bongkar Chip Royal Dream", "Royal Dream Terpercaya", "Clover Store", "Top Up Chip 24 Jam", "Agen Chip Resmi"],

  authors: [{ name: "Clover Store Team" }],
  creator: "Clover Store",
  publisher: "Clover Store",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Royal Clover Store - Pusat Chip Royal Dream Termurah",
    description: "Toko Chip Royal Dream terpercaya. Sedia Chip Ungu & Emas, proses 1 detik, aman dan bergaransi withdraw pasti cair.",

    url: baseUrl,
    siteName: "Clover Store",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: '/images/og-image.jpg', // Ensure you have an OG image or use a default
        width: 1200,
        height: 630,
        alt: "Clover Store - Top Up Game Sultan",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Royal Clover Store - Pusat Chip Royal Dream",
    description: "Beli Chip Royal Dream termurah and terpercaya hanya di Royal Clover Store.",

    creator: "@cloverstore",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Clover Store",
        "url": baseUrl.toString(),
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": `${baseUrl.toString()}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "name": "Clover Store",
        "url": baseUrl.toString(),
        "logo": `${baseUrl.toString()}/images/logo.png`, // Making sure we point to a logo if it exists, or just the URL
        "sameAs": [
          "https://instagram.com/cloverstore", // Example
          "https://facebook.com/cloverstore"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+6281234567890", // Example placeholder
          "contactType": "customer service"
        }
      }
    ]
  };

  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#a855f7" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `
          }}
        />
      </head>
      <body className={`${outfit.variable} ${cormorant.variable} ${montserrat.variable} font-montserrat v4-theme bg-[#07080f] text-white min-h-screen antialiased selection:bg-purple-500/30`} suppressHydrationWarning>
        <div className="v4-ambient">
          <div className="v4-ambient-1"></div>
          <div className="v4-ambient-2"></div>
          <div className="v4-ambient-3"></div>
        </div>
        <AuthProvider>
          <Navbar />
          <div className="relative z-10 flex flex-col min-h-screen pt-16">
            <main className="flex-grow">
              {children}
            </main>
          </div>
          <FloatingChat />
          <PWAInstallPrompt />
        </AuthProvider>
        <GoogleAnalytics gaId="G-G0RSY9PYDP" />
      </body>
    </html>
  );
}
