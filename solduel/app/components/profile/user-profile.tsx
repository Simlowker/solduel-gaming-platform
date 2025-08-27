"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  User,
  Trophy,
  Coins,
  Scissors,
  Dice6,
  Crown,
  Star,
  Copy,
  Edit3,
  ExternalLink,
  Share2,
  MessageCircle,
  Target,
  Award,
  Clock,
  Flame,
  BarChart3,
} from "lucide-react"

interface UserStats {
  totalGames: number
  totalWins: number
  totalLosses: number
  winRate: number
  totalEarnings: number
  biggestWin: number
  currentStreak: number
  level: number
  experience: number
  nextLevelXP: number
}

interface GameStats {
  solDuel: {
    games: number
    wins: number
    winRate: number
    earnings: number
    bestStreak: number
  }
  rpsArena: {
    games: number
    wins: number
    winRate: number
    earnings: number
    bestStreak: number
  }
  diceBattle: {
    games: number
    wins: number
    winRate: number
    earnings: number
    bestStreak: number
  }
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlocked: boolean
  progress?: number
  maxProgress?: number
  unlockedAt?: Date
}

interface RecentActivity {
  id: string
  type: "win" | "loss" | "achievement"
  game: "sol-duel" | "rps-arena" | "dice-battle"
  opponent?: string
  amount?: number
  timestamp: Date
  details: string
}

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [username, setUsername] = useState("CyberGamer2024")

  const userStats: UserStats = {
    totalGames: 1247,
    totalWins: 856,
    totalLosses: 391,
    winRate: 68.7,
    totalEarnings: 145.8,
    biggestWin: 25.4,
    currentStreak: 7,
    level: 42,
    experience: 8750,
    nextLevelXP: 10000,
  }

  const gameStats: GameStats = {
    solDuel: {
      games: 456,
      wins: 312,
      winRate: 68.4,
      earnings: 67.3,
      bestStreak: 12,
    },
    rpsArena: {
      games: 389,
      wins: 278,
      winRate: 71.5,
      earnings: 45.2,
      bestStreak: 8,
    },
    diceBattle: {
      games: 402,
      wins: 266,
      winRate: 66.2,
      earnings: 33.3,
      bestStreak: 15,
    },
  }

  const achievements: Achievement[] = [
    {
      id: "first_win",
      name: "First Victory",
      description: "Win your first game",
      icon: "🏆",
      rarity: "common",
      unlocked: true,
      unlockedAt: new Date("2024-01-15"),
    },
    {
      id: "streak_master",
      name: "Streak Master",
      description: "Win 10 games in a row",
      icon: "🔥",
      rarity: "rare",
      unlocked: true,
      unlockedAt: new Date("2024-02-20"),
    },
    {
      id: "high_roller",
      name: "High Roller",
      description: "Win a bet worth 10+ SOL",
      icon: "💎",
      rarity: "epic",
      unlocked: true,
      unlockedAt: new Date("2024-03-10"),
    },
    {
      id: "legend",
      name: "Legend",
      description: "Reach level 50",
      icon: "👑",
      rarity: "legendary",
      unlocked: false,
      progress: 42,
      maxProgress: 50,
    },
  ]

  const recentActivity: RecentActivity[] = [
    {
      id: "1",
      type: "win",
      game: "sol-duel",
      opponent: "7xKX...9mNp",
      amount: 2.5,
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      details: "Won coin flip (Heads)",
    },
    {
      id: "2",
      type: "achievement",
      game: "rps-arena",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      details: 'Unlocked "Streak Master" achievement',
    },
    {
      id: "3",
      type: "win",
      game: "dice-battle",
      opponent: "DiceKing",
      amount: 1.8,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
      details: "Rolled 7 (Over 6) - 2x multiplier",
    },
    {
      id: "4",
      type: "loss",
      game: "rps-arena",
      opponent: "RPSMaster",
      amount: -0.5,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
      details: "Lost RPS match (2-1)",
    },
  ]

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common":
        return "text-muted-foreground border-muted"
      case "rare":
        return "text-primary border-primary"
      case "epic":
        return "text-secondary border-secondary"
      case "legendary":
        return "text-accent border-accent"
    }
  }

  const getGameIcon = (game: string) => {
    switch (game) {
      case "sol-duel":
        return Coins
      case "rps-arena":
        return Scissors
      case "dice-battle":
        return Dice6
      default:
        return Target
    }
  }

  const copyWallet = () => {
    navigator.clipboard.writeText("7xKXm9NpQR8vBsT3uL2wY6hF4jE9mNpQR8vBsT3uL2wY")
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <h1 className="font-orbitron font-bold text-3xl text-glow">Player Profile</h1>
        </div>
        <p className="text-muted-foreground">Your gaming stats, achievements, and progress</p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Profile Card - Large */}
        <Card className="glass md:col-span-2 lg:col-span-2 lg:row-span-2">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 mx-auto border-4 border-primary/50 glow-primary">
                  <AvatarFallback className="bg-primary/20 text-primary text-4xl font-orbitron font-bold">
                    CG
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Crown className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="text-center font-orbitron font-bold text-xl"
                    />
                    <Button size="sm" onClick={() => setIsEditing(false)}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="font-orbitron font-bold text-2xl text-glow">{username}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="font-mono">7xKX...mNpQ</span>
                  <Button variant="ghost" size="sm" onClick={copyWallet}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Level Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Level {userStats.level}</span>
                  <span className="text-sm text-muted-foreground">
                    {userStats.experience}/{userStats.nextLevelXP} XP
                  </span>
                </div>
                <Progress value={(userStats.experience / userStats.nextLevelXP) * 100} className="h-3" />
                <div className="text-xs text-center text-muted-foreground">
                  {userStats.nextLevelXP - userStats.experience} XP to next level
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="font-orbitron font-bold text-xl text-primary">{userStats.totalGames}</div>
                  <div className="text-sm text-muted-foreground">Total Games</div>
                </div>
                <div className="text-center">
                  <div className="font-orbitron font-bold text-xl text-secondary">{userStats.winRate}%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="font-orbitron font-bold text-xl text-accent">{userStats.totalEarnings} SOL</div>
                  <div className="text-sm text-muted-foreground">Total Earnings</div>
                </div>
                <div className="text-center">
                  <div className="font-orbitron font-bold text-xl text-primary">#{1247}</div>
                  <div className="text-sm text-muted-foreground">Global Rank</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-orbitron font-bold text-2xl text-primary">{userStats.currentStreak}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biggest Win */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-secondary/20 rounded-full mx-auto flex items-center justify-center">
                <Trophy className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <div className="font-orbitron font-bold text-2xl text-secondary">{userStats.biggestWin} SOL</div>
                <div className="text-sm text-muted-foreground">Biggest Win</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Stats */}
        <Card className="glass md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Game Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sol-duel">Sol Duel</TabsTrigger>
                <TabsTrigger value="rps-arena">RPS Arena</TabsTrigger>
                <TabsTrigger value="dice-battle">Dice Battle</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="font-orbitron font-bold text-lg text-primary">{userStats.totalWins}</div>
                    <div className="text-sm text-muted-foreground">Total Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="font-orbitron font-bold text-lg text-destructive">{userStats.totalLosses}</div>
                    <div className="text-sm text-muted-foreground">Total Losses</div>
                  </div>
                  <div className="text-center">
                    <div className="font-orbitron font-bold text-lg text-accent">{userStats.winRate}%</div>
                    <div className="text-sm text-muted-foreground">Win Rate</div>
                  </div>
                </div>
              </TabsContent>

              {Object.entries(gameStats).map(([gameKey, stats]) => (
                <TabsContent key={gameKey} value={gameKey} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Games Played</div>
                      <div className="font-mono font-bold">{stats.games}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                      <div className="font-mono font-bold text-primary">{stats.winRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Earnings</div>
                      <div className="font-mono font-bold text-secondary">{stats.earnings} SOL</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Best Streak</div>
                      <div className="font-mono font-bold text-accent">{stats.bestStreak}</div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="glass md:col-span-2 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer
                    ${achievement.unlocked ? "bg-card/50 hover:scale-105" : "bg-muted/20 opacity-50"}
                    ${getRarityColor(achievement.rarity)}
                  `}
                >
                  <div className="text-center space-y-2">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="font-orbitron font-bold text-sm">{achievement.name}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>

                    {achievement.unlocked ? (
                      <Badge variant="secondary" className="text-xs">
                        {achievement.unlockedAt && formatTimeAgo(achievement.unlockedAt)}
                      </Badge>
                    ) : achievement.progress !== undefined ? (
                      <div className="space-y-1">
                        <Progress
                          value={(achievement.progress / (achievement.maxProgress || 1)) * 100}
                          className="h-1"
                        />
                        <div className="text-xs text-muted-foreground">
                          {achievement.progress}/{achievement.maxProgress}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const GameIcon = getGameIcon(activity.game)
                return (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-card/30">
                    <div
                      className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${
                        activity.type === "win"
                          ? "bg-primary/20 text-primary"
                          : activity.type === "loss"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-accent/20 text-accent"
                      }
                    `}
                    >
                      {activity.type === "achievement" ? (
                        <Star className="h-5 w-5" />
                      ) : (
                        <GameIcon className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{activity.details}</span>
                        {activity.opponent && (
                          <Badge variant="outline" className="text-xs">
                            vs {activity.opponent}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{formatTimeAgo(activity.timestamp)}</div>
                    </div>

                    {activity.amount && (
                      <div
                        className={`font-mono font-bold ${activity.amount > 0 ? "text-primary" : "text-destructive"}`}
                      >
                        {activity.amount > 0 ? "+" : ""}
                        {activity.amount} SOL
                      </div>
                    )}

                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
