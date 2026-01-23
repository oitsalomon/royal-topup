import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import { AuthProvider } from "@/contexts/AuthProvider";


import { GoogleAnalytics } from '@next/third-parties/google'

const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

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
    description: "Beli Chip Royal Dream termurah dan terpercaya hanya di Royal Clover Store.",

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
    <html lang="id" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${outfit.className} ${outfit.variable} bg-[#0a0a0a] text-white min-h-screen antialiased selection:bg-cyan-500/30`}>
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />
        <div className="fixed inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-blue-500/10 pointer-events-none" />
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen relative z-10">
            {children}
          </main>
          <FloatingChat />
        </AuthProvider>
        <GoogleAnalytics gaId="G-G0RSY9PYDP" />
      </body>
    </html>
  );
}
