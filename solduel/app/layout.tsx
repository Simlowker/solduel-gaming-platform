'use client'

import { Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { AppShell } from '@/components/app-shell'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { useMemo } from 'react'
import { Toaster } from '@/components/ui/sonner'

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Configure Solana wallet
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet'
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_RPC_URL || clusterApiUrl(network as any),
    [network]
  )
  
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${orbitron.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <AppShell>{children}</AppShell>
                <Toaster />
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}