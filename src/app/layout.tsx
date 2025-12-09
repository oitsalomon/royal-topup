import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Aqua Store - Top Up & Withdraw Terpercaya",
  description: "Layanan Top Up & Withdraw Game Tercepat dan Aman.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className={`${outfit.className} ${outfit.variable} bg-[#0a0a0a] text-white min-h-screen antialiased selection:bg-cyan-500/30`}>
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none opacity-20" />
        <div className="fixed inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-blue-500/10 pointer-events-none" />
        <Navbar />
        <main className="min-h-screen relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
