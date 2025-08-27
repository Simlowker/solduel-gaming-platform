"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Crown, Medal, Coins, Scissors, Dice6, Users, Calendar, Filter, Target, BarChart3 } from "lucide-react"

type LeaderboardType = "global" | "sol-duel" | "rps-arena" | "dice-battle"
type RankingCategory = "earnings" | "winRate" | "streak" | "games" | "level"
type TimePeriod = "all-time" | "monthly" | "weekly" | "daily"

interface Player {
  id: string
  username: string
  wallet: string
  avatar?: string
  rank: number
  previousRank?: number
  level: number
  league: "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master"
  stats: {
    totalEarnings: number
    winRate: number
    currentStreak: number
    totalGames: number
    totalWins: number
  }
  gameStats: {
    solDuel: { earnings: number; winRate: number; games: number }
    rpsArena: { earnings: number; winRate: number; games: number }
    diceBattle: { earnings: number; winRate: number; games: number }
  }
  isOnline: boolean
  lastSeen: Date
}

export function Leaderboards() {
  const [selectedTab, setSelectedTab] = useState<LeaderboardType>("global")
  const [rankingCategory, setRankingCategory] = useState<RankingCategory>("earnings")
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("all-time")

  // Mock leaderboard data
  const players: Player[] = [
    {
      id: "1",
      username: "SolanaKing",
      wallet: "7xKX...9mNp",
      rank: 1,
      previousRank: 2,
      level: 67,
      league: "master",
      stats: {
        totalEarnings: 2847.3,
        winRate: 78.4,
        currentStreak: 23,
        totalGames: 3421,
        totalWins: 2682,
      },
      gameStats: {
        solDuel: { earnings: 1234.5, winRate: 76.2, games: 1200 },
        rpsArena: { earnings: 856.7, winRate: 82.1, games: 980 },
        diceBattle: { earnings: 756.1, winRate: 74.8, games: 1241 },
      },
      isOnline: true,
      lastSeen: new Date(),
    },
    {
      id: "2",
      username: "CryptoGamer",
      wallet: "9mNp...7xKX",
      rank: 2,
      previousRank: 1,
      level: 58,
      league: "diamond",
      stats: {
        totalEarnings: 2156.8,
        winRate: 74.2,
        currentStreak: 12,
        totalGames: 2987,
        totalWins: 2216,
      },
      gameStats: {
        solDuel: { earnings: 987.3, winRate: 72.5, games: 1100 },
        rpsArena: { earnings: 678.9, winRate: 76.8, games: 890 },
        diceBattle: { earnings: 490.6, winRate: 73.1, games: 997 },
      },
      isOnline: false,
      lastSeen: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "3",
      username: "DiceDestroyer",
      wallet: "Bs3T...uL2w",
      rank: 3,
      previousRank: 4,
      level: 52,
      league: "diamond",
      stats: {
        totalEarnings: 1876.4,
        winRate: 71.8,
        currentStreak: 8,
        totalGames: 2654,
        totalWins: 1905,
      },
      gameStats: {
        solDuel: { earnings: 456.2, winRate: 68.9, games: 800 },
        rpsArena: { earnings: 567.8, winRate: 73.4, games: 750 },
        diceBattle: { earnings: 852.4, winRate: 76.2, games: 1104 },
      },
      isOnline: true,
      lastSeen: new Date(),
    },
    // Add current user
    {
      id: "current",
      username: "CyberGamer2024",
      wallet: "7xKX...mNpQ",
      rank: 1247,
      previousRank: 1289,
      level: 42,
      league: "gold",
      stats: {
        totalEarnings: 145.8,
        winRate: 68.7,
        currentStreak: 7,
        totalGames: 1247,
        totalWins: 856,
      },
      gameStats: {
        solDuel: { earnings: 67.3, winRate: 68.4, games: 456 },
        rpsArena: { earnings: 45.2, winRate: 71.5, games: 389 },
        diceBattle: { earnings: 33.3, winRate: 66.2, games: 402 },
      },
      isOnline: true,
      lastSeen: new Date(),
    },
  ]

  const getLeagueColor = (league: Player["league"]) => {
    switch (league) {
      case "bronze":
        return "text-amber-600 border-amber-600"
      case "silver":
        return "text-gray-400 border-gray-400"
      case "gold":
        return "text-yellow-500 border-yellow-500"
      case "platinum":
        return "text-cyan-400 border-cyan-400"
      case "diamond":
        return "text-blue-400 border-blue-400"
      case "master":
        return "text-purple-400 border-purple-400"
    }
  }

  const getLeagueIcon = (league: Player["league"]) => {
    switch (league) {
      case "bronze":
        return Medal
      case "silver":
        return Medal
      case "gold":
        return Trophy
      case "platinum":
        return Trophy
      case "diamond":
        return Crown
      case "master":
        return Crown
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="font-orbitron font-bold text-muted-foreground">#{rank}</span>
  }

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null
    const change = previous - current
    if (change > 0) return <span className="text-primary text-xs">↑{change}</span>
    if (change < 0) return <span className="text-destructive text-xs">↓{Math.abs(change)}</span>
    return <span className="text-muted-foreground text-xs">-</span>
  }

  const getSortedPlayers = (category: RankingCategory) => {
    return [...players].sort((a, b) => {
      switch (category) {
        case "earnings":
          return b.stats.totalEarnings - a.stats.totalEarnings
        case "winRate":
          return b.stats.winRate - a.stats.winRate
        case "streak":
          return b.stats.currentStreak - a.stats.currentStreak
        case "games":
          return b.stats.totalGames - a.stats.totalGames
        case "level":
          return b.level - a.level
        default:
          return a.rank - b.rank
      }
    })
  }

  const getGameSpecificStats = (player: Player, game: LeaderboardType) => {
    if (game === "global") return player.stats

    let gameKey: keyof Player["gameStats"]
    switch (game) {
      case "sol-duel":
        gameKey = "solDuel"
        break
      case "rps-arena":
        gameKey = "rpsArena"
        break
      case "dice-battle":
        gameKey = "diceBattle"
        break
      default:
        // Fallback to global stats if game not recognized
        return player.stats
    }

    const gameStats = player.gameStats[gameKey]

    if (!gameStats) {
      return {
        totalEarnings: 0,
        winRate: 0,
        totalGames: 0,
        currentStreak: player.stats.currentStreak,
        totalWins: 0,
      }
    }

    return {
      totalEarnings: gameStats.earnings,
      winRate: gameStats.winRate,
      totalGames: gameStats.games,
      currentStreak: player.stats.currentStreak, // Global streak
      totalWins: Math.floor(gameStats.games * (gameStats.winRate / 100)),
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="font-orbitron font-bold text-3xl text-glow">Leaderboards</h1>
        </div>
        <p className="text-muted-foreground">Compete with the best players across all games</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="font-orbitron font-bold text-xl">4,127</div>
            <div className="text-sm text-muted-foreground">Active Players</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <Coins className="h-8 w-8 text-secondary mx-auto mb-2" />
            <div className="font-orbitron font-bold text-xl">145.2K SOL</div>
            <div className="text-sm text-muted-foreground">Total Volume</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="font-orbitron font-bold text-xl">89.4K</div>
            <div className="text-sm text-muted-foreground">Games Played</div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="font-orbitron font-bold text-xl">Season 3</div>
            <div className="text-sm text-muted-foreground">Current Season</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>

            <Select value={rankingCategory} onValueChange={(value) => setRankingCategory(value as RankingCategory)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="earnings">Total Earnings</SelectItem>
                <SelectItem value="winRate">Win Rate</SelectItem>
                <SelectItem value="streak">Current Streak</SelectItem>
                <SelectItem value="games">Games Played</SelectItem>
                <SelectItem value="level">Player Level</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="monthly">This Month</SelectItem>
                <SelectItem value="weekly">This Week</SelectItem>
                <SelectItem value="daily">Today</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Tabs */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as LeaderboardType)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="sol-duel" className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Sol Duel
          </TabsTrigger>
          <TabsTrigger value="rps-arena" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            RPS Arena
          </TabsTrigger>
          <TabsTrigger value="dice-battle" className="flex items-center gap-2">
            <Dice6 className="h-4 w-4" />
            Dice Battle
          </TabsTrigger>
        </TabsList>

        {(["global", "sol-duel", "rps-arena", "dice-battle"] as LeaderboardType[]).map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            {/* Top 3 Podium */}
            <Card className="glass">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4">
                  {getSortedPlayers(rankingCategory)
                    .slice(0, 3)
                    .map((player, index) => {
                      const stats = getGameSpecificStats(player, tabValue)
                      const LeagueIcon = getLeagueIcon(player.league)

                      return (
                        <div
                          key={player.id}
                          className={`
                        text-center space-y-4 p-4 rounded-lg
                        ${
                          index === 0
                            ? "bg-primary/10 border border-primary/30"
                            : index === 1
                              ? "bg-secondary/10 border border-secondary/30"
                              : "bg-accent/10 border border-accent/30"
                        }
                      `}
                        >
                          <div className="relative">
                            <Avatar className="h-16 w-16 mx-auto border-2 border-current">
                              <AvatarFallback className="bg-card text-foreground font-orbitron font-bold">
                                {player.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-2 -right-2">{getRankIcon(index + 1)}</div>
                          </div>

                          <div>
                            <div className="font-orbitron font-bold text-lg">{player.username}</div>
                            <div className="text-sm text-muted-foreground font-mono">{player.wallet}</div>
                          </div>

                          <div className="flex items-center justify-center gap-2">
                            <LeagueIcon className={`h-4 w-4 ${getLeagueColor(player.league)}`} />
                            <Badge variant="outline" className={getLeagueColor(player.league)}>
                              {player.league.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="font-orbitron font-bold text-xl text-primary">
                              {rankingCategory === "earnings"
                                ? `${stats.totalEarnings.toFixed(1)} SOL`
                                : rankingCategory === "winRate"
                                  ? `${stats.winRate.toFixed(1)}%`
                                  : rankingCategory === "streak"
                                    ? `${stats.currentStreak}`
                                    : rankingCategory === "games"
                                      ? `${stats.totalGames}`
                                      : `Level ${player.level}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {rankingCategory === "earnings"
                                ? "Total Earnings"
                                : rankingCategory === "winRate"
                                  ? "Win Rate"
                                  : rankingCategory === "streak"
                                    ? "Current Streak"
                                    : rankingCategory === "games"
                                      ? "Games Played"
                                      : "Player Level"}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Full Leaderboard */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Full Rankings</span>
                  <Badge variant="secondary">{players.length} Players</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getSortedPlayers(rankingCategory).map((player, index) => {
                    const stats = getGameSpecificStats(player, tabValue)
                    const LeagueIcon = getLeagueIcon(player.league)
                    const isCurrentUser = player.id === "current"

                    return (
                      <div
                        key={player.id}
                        className={`
                        flex items-center gap-4 p-4 rounded-lg transition-all duration-200
                        ${isCurrentUser ? "bg-primary/10 border border-primary/30 glow-primary" : "bg-card/30 hover:bg-card/50"}
                      `}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center gap-2 w-12">
                            {getRankIcon(index + 1)}
                            {getRankChange(index + 1, player.previousRank)}
                          </div>

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-muted text-foreground">
                                  {player.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {player.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-orbitron font-bold truncate">{player.username}</span>
                                {isCurrentUser && (
                                  <Badge variant="secondary" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <LeagueIcon className={`h-3 w-3 ${getLeagueColor(player.league)}`} />
                                <span className="capitalize">{player.league}</span>
                                <span>•</span>
                                <span>Level {player.level}</span>
                                {!player.isOnline && (
                                  <>
                                    <span>•</span>
                                    <span>{formatTimeAgo(player.lastSeen)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="font-orbitron font-bold">
                              {rankingCategory === "earnings"
                                ? `${stats.totalEarnings.toFixed(1)}`
                                : rankingCategory === "winRate"
                                  ? `${stats.winRate.toFixed(1)}%`
                                  : rankingCategory === "streak"
                                    ? `${stats.currentStreak}`
                                    : rankingCategory === "games"
                                      ? `${stats.totalGames}`
                                      : `${player.level}`}
                            </div>
                            <div className="text-muted-foreground">
                              {rankingCategory === "earnings"
                                ? "SOL"
                                : rankingCategory === "winRate"
                                  ? "Win Rate"
                                  : rankingCategory === "streak"
                                    ? "Streak"
                                    : rankingCategory === "games"
                                      ? "Games"
                                      : "Level"}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="font-orbitron font-bold">{stats.totalWins}</div>
                            <div className="text-muted-foreground">Wins</div>
                          </div>

                          <div className="text-center">
                            <div className="font-orbitron font-bold">{stats.winRate.toFixed(1)}%</div>
                            <div className="text-muted-foreground">Win Rate</div>
                          </div>
                        </div>

                        <Button variant="ghost" size="sm">
                          <Target className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
