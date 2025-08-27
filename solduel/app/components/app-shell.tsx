"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, User, Trophy, Gift, Wallet, Bell, Menu, X, Coins, Scissors, Dice6 } from "lucide-react"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (publicKey) {
      const getBalance = async () => {
        const lamports = await connection.getBalance(publicKey);
        setBalance(lamports / LAMPORTS_PER_SOL);
      };
      getBalance();
      
      const subscriptionId = connection.onAccountChange(publicKey, (accountInfo) => {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      });

      return () => {
        connection.removeAccountChangeListener(subscriptionId);
      };
    } else {
      setBalance(null)
    }
  }, [publicKey, connection])

  const menuItems = [
    { icon: Gamepad2, label: "Games", href: "/", badge: "3" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: Gift, label: "Lottery", href: "/lottery", badge: "LIVE" },
  ]

  const games = [
    { icon: Coins, name: "Sol Duel", players: "1.2k", prize: "45.8 SOL", href: "/games/sol-duel" },
    { icon: Scissors, name: "RPS Arena", players: "856", prize: "32.1 SOL", href: "/games/rps-arena" },
    { icon: Dice6, name: "Dice Battle", players: "2.1k", prize: "67.3 SOL", href: "/games/dice-battle" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-orbitron font-bold text-xl text-glow">SolDuel</span>
            </Link>
          </div>

          {/* Live Games Ticker */}
          <div className="hidden md:flex items-center gap-6 flex-1 max-w-2xl mx-8">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Total Prize Pool:</span>
              <span className="font-mono font-bold text-primary">145.2 SOL</span>
              <span className="text-sm text-muted-foreground ml-4">Online:</span>
              <span className="font-mono font-bold text-accent">4,127</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WalletMultiButton />
            {publicKey && balance !== null && (
                <div className="hidden sm:flex items-center gap-2 text-sm font-mono text-muted-foreground bg-background/50 border border-border/50 rounded-md px-3 py-1.5">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span>{balance.toFixed(2)} SOL</span>
                </div>
            )}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-secondary">3</Badge>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          glass border-r border-sidebar-border/50 w-64 min-h-screen fixed lg:static z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        >
          <div className="p-4 space-y-6">
            {/* Navigation Menu */}
            <nav className="space-y-2">
              {menuItems.map((item, index) => {
                const isActive = pathname === item.href || (item.href === "/" && pathname.startsWith("/games"))
                return (
                  <Link key={index} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-3 h-12 hover:glow-primary ${
                        isActive ? "bg-primary/10 text-primary glow-primary" : ""
                      }`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.badge === "NEW" || item.badge === "LIVE" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </nav>

            <div className="space-y-2">
              <h3 className="font-orbitron font-bold text-xs text-muted-foreground uppercase tracking-wider px-2">
                Quick Play
              </h3>
              {games.map((game, index) => (
                <Link key={index} href={game.href}>
                  <Button variant="ghost" className="w-full justify-start gap-3 h-10 hover:glow-primary">
                    <game.icon className="h-4 w-4" />
                    <span className="flex-1 text-left text-sm">{game.name}</span>
                    <span className="text-xs text-muted-foreground">{game.players}</span>
                  </Button>
                </Link>
              ))}
            </div>

            {/* Quick Stats */}
            <Card className="glass p-4">
              <h3 className="font-orbitron font-bold text-sm mb-3 text-glow">Live Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Prize Pool</span>
                  <span className="font-mono font-bold text-primary">145.2 SOL</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Online Players</span>
                  <span className="font-mono font-bold text-accent">4,127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Your Rank</span>
                  <Badge variant="outline" className="text-xs">
                    #1,247
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Network Status */}
            <div className="flex items-center gap-2 px-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">Solana Devnet</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}