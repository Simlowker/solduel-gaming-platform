"use client"

import { useState } from "react"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Button } from "@/components/ui/button"
import SolDuelSDK from "@/lib/solduel-sdk"
import { PublicKey } from "@solana/web3.js"

export function InitializeConfigButton() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const handleInitialize = async () => {
    if (!wallet || !wallet.publicKey) {
      alert('Please connect your wallet first')
      return
    }
    
    setIsLoading(true)
    try {
      const sdk = new SolDuelSDK(connection, wallet)
      
      // Use the same wallet as treasury for simplicity
      const treasury = wallet.publicKey
      
      const tx = await sdk.initializeConfig(treasury)
      console.log('Config initialized with transaction:', tx)
      
      setIsInitialized(true)
      alert('Configuration initialized successfully!')
    } catch (error: any) {
      console.error('Error initializing config:', error)
      if (error.message?.includes('already in use')) {
        setIsInitialized(true)
        alert('Configuration is already initialized!')
      } else {
        alert(`Failed to initialize: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Button
      onClick={handleInitialize}
      disabled={isLoading || isInitialized || !wallet.publicKey}
      variant={isInitialized ? "secondary" : "default"}
    >
      {isLoading ? "Initializing..." : isInitialized ? "Config Initialized ✓" : "Initialize Config (Admin Only)"}
    </Button>
  )
}