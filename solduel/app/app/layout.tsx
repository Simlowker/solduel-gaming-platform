import type React from "react"
import type { Metadata } from "next"
import { Orbitron } from "next/font/google"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "./providers"

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-orbitron",
  weight: ["400", "700", "900"],
})

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "SolDuel - Solana Gaming Platform",
  description: "Premium PvP gaming on Solana blockchain - Coin Flip, RPS Arena, and Dice Battles",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${orbitron.variable} ${inter.variable} antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
