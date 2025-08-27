'use client'

import { SolDuelGame } from '@/components/games/sol-duel-game'
import { InitializeConfigButton } from '@/components/initialize-config-button'
import { useWallet } from '@solana/wallet-adapter-react'

export default function Home() {
  const { publicKey } = useWallet()
  
  return (
    <div className="container mx-auto p-4">
      {/* Admin controls - only show if wallet connected */}
      {publicKey && (
        <div className="mb-4 flex justify-end">
          <InitializeConfigButton />
        </div>
      )}
      
      {/* Main game component */}
      <SolDuelGame />
    </div>
  )
}