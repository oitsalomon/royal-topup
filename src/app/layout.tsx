import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import "./global-v4.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { ToastProvider } from "@/components/Toast";
import SiteMarquee from "@/components/common/SiteMarquee";
import SiteHeader from "@/components/common/SiteHeader";
import SiteFooter from "@/components/common/SiteFooter";
import Script from "next/script";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
  adjustFontFallback: true
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap"
});


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ? new URL(process.env.NEXT_PUBLIC_BASE_URL) : new URL('https://royalclover.store');

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: "Royal Clover Store - Pusat Chip Royal Dream Murah",
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
  verification: {
    google: '-VXRE5XaLvfQrxqpRVc9R5IsjOsiTdHJOqybriUMUIQ',
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
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
        <meta name="theme-color" content="#0d0d0f" />
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
      <body className={`${poppins.variable} ${inter.variable} font-inter bg-[#0d0d0f] text-[#f3ecd8] min-h-screen antialiased selection:bg-[#c5a369]/30`} suppressHydrationWarning>
        <AuthProvider>
          <ConfigProvider>
            <ToastProvider>
              <div className="relative z-10 flex flex-col min-h-screen animate-in fade-in duration-200">
                <SiteMarquee />
                <SiteHeader />
                <main className="flex-grow">
                  {children}
                </main>
                <SiteFooter />
              </div>
              <PWAInstallPrompt />
            </ToastProvider>
          </ConfigProvider>
        </AuthProvider>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-G0RSY9PYDP"
          strategy="lazyOnload"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G0RSY9PYDP', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}
