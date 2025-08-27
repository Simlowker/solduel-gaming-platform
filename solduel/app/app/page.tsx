import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Scissors, Dice6, Users, Zap, Shield, TrendingUp } from "lucide-react"
import Link from "next/link"
import { InitializeConfigButton } from "@/components/initialize-config-button"

export default function HomePage() {
  const games = [
    {
      id: "sol-duel",
      name: "Sol Duel",
      description: "Classic coin flip betting with instant results",
      icon: Coins,
      players: "1,247",
      minBet: "0.1 SOL",
      maxBet: "10 SOL",
      winRate: "50%",
      status: "live",
      gradient: "from-primary/20 to-primary/5",
      href: "/games/sol-duel",
    },
    {
      id: "rps-arena",
      name: "RPS Arena",
      description: "Strategic rock-paper-scissors battles",
      icon: Scissors,
      players: "856",
      minBet: "0.05 SOL",
      maxBet: "5 SOL",
      winRate: "33.3%",
      status: "live",
      gradient: "from-secondary/20 to-secondary/5",
      href: "/games/rps-arena",
    },
    {
      id: "dice-battle",
      name: "Dice Battle",
      description: "Predict dice outcomes with multipliers",
      icon: Dice6,
      players: "2,134",
      minBet: "0.01 SOL",
      maxBet: "20 SOL",
      winRate: "Variable",
      status: "live",
      gradient: "from-accent/20 to-accent/5",
      href: "/games/dice-battle",
    },
  ]

  const features = [
    {
      icon: Zap,
      title: "Instant Gameplay",
      description: "Lightning-fast transactions on Solana",
    },
    {
      icon: Shield,
      title: "Provably Fair",
      description: "Transparent and verifiable game outcomes",
    },
    {
      icon: Users,
      title: "Global Community",
      description: "Play against opponents worldwide",
    },
    {
      icon: TrendingUp,
      title: "Real Rewards",
      description: "Win actual SOL tokens",
    },
  ]

  return (
    <div className="p-6 space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <h1 className="font-orbitron font-black text-4xl md:text-6xl text-glow">
            Welcome to <span className="text-primary">SolDuel</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The ultimate PvP gaming platform on Solana. Challenge players worldwide in skill-based games and win real
            SOL tokens.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="glow-primary font-orbitron">
            Start Playing
          </Button>
          <Button variant="outline" size="lg">
            Watch Demo
          </Button>
          <InitializeConfigButton />
        </div>

        <div className="flex justify-center gap-8 pt-8">
          <div className="text-center">
            <div className="font-orbitron font-bold text-2xl text-primary">4,127</div>
            <div className="text-sm text-muted-foreground">Online Players</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron font-bold text-2xl text-secondary">145.2 SOL</div>
            <div className="text-sm text-muted-foreground">Total Prize Pool</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron font-bold text-2xl text-accent">24/7</div>
            <div className="text-sm text-muted-foreground">Live Games</div>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-orbitron font-bold text-3xl text-glow">Choose Your Game</h2>
          <p className="text-muted-foreground">Three exciting PvP games, each with unique strategies and rewards</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {games.map((game) => (
            <Link key={game.id} href={game.href}>
              <Card
                className={`glass hover:glow-primary transition-all duration-300 cursor-pointer group bg-gradient-to-br ${game.gradient}`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-card rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <game.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="font-orbitron text-xl">{game.name}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Players Online</span>
                    <Badge variant="secondary">{game.players}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Min Bet</div>
                      <div className="font-mono font-bold">{game.minBet}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Max Bet</div>
                      <div className="font-mono font-bold">{game.maxBet}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-mono text-accent">{game.winRate}</span>
                  </div>

                  <Button className="w-full glow-primary">Play Now</Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-orbitron font-bold text-3xl text-glow">Why Choose SolDuel?</h2>
          <p className="text-muted-foreground">Built for gamers, powered by Solana blockchain</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="glass text-center p-6 hover:glow-accent transition-all duration-300">
              <feature.icon className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="font-orbitron font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
