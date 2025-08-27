"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Dice6, TrendingUp, BarChart3, Zap, Settings, Play, Pause, RotateCcw } from "lucide-react"

type Prediction = "over" | "under" | "exact"

interface DiceGame {
  gameId: string
  diceCount: 1 | 2 | 3
  targetNumber: number
  prediction: Prediction
  betAmount: number
  multiplier: number
  winChance: number
  rolledNumbers: number[]
  totalRoll: number
  isRolling: boolean
  result: "win" | "lose" | null
  profit: number
}

interface AutoBetConfig {
  enabled: boolean
  rounds: number
  currentRound: number
  stopOnWin: boolean
  stopOnLoss: boolean
  increaseOnLoss: number
  baseAmount: number
}

interface GameStats {
  totalRolls: number
  totalWins: number
  totalLosses: number
  netProfit: number
  biggestWin: number
  currentStreak: number
  hotNumbers: number[]
  coldNumbers: number[]
  recentRolls: number[]
}

export function DiceBattleGame() {
  const [game, setGame] = useState<DiceGame>({
    gameId: "dice_001",
    diceCount: 2,
    targetNumber: 7,
    prediction: "over",
    betAmount: 1.0,
    multiplier: 1.98,
    winChance: 50.0,
    rolledNumbers: [],
    totalRoll: 0,
    isRolling: false,
    result: null,
    profit: 0,
  })

  const [autoBet, setAutoBet] = useState<AutoBetConfig>({
    enabled: false,
    rounds: 10,
    currentRound: 0,
    stopOnWin: false,
    stopOnLoss: false,
    increaseOnLoss: 0,
    baseAmount: 1.0,
  })

  const [stats, setStats] = useState<GameStats>({
    totalRolls: 0,
    totalWins: 0,
    totalLosses: 0,
    netProfit: 0,
    biggestWin: 0,
    currentStreak: 0,
    hotNumbers: [7, 8, 6],
    coldNumbers: [2, 12, 3],
    recentRolls: [],
  })

  const [balance, setBalance] = useState(50.0)

  // Calculate multiplier and win chance based on prediction
  useEffect(() => {
    const { diceCount, targetNumber, prediction } = game
    const minRoll = diceCount
    const maxRoll = diceCount * 6

    let winningOutcomes = 0
    const totalOutcomes = Math.pow(6, diceCount)

    if (prediction === "over") {
      winningOutcomes = Math.max(0, maxRoll - targetNumber)
    } else if (prediction === "under") {
      winningOutcomes = Math.max(0, targetNumber - minRoll)
    } else {
      // exact
      winningOutcomes =
        diceCount === 1 ? 1 : diceCount === 2 ? (targetNumber <= 7 ? targetNumber - 1 : 13 - targetNumber) : 1
    }

    const winChance = (winningOutcomes / totalOutcomes) * 100
    const multiplier = winChance > 0 ? 95 / winChance : 0 // 95% RTP

    setGame((prev) => ({
      ...prev,
      winChance: Math.max(0, Math.min(100, winChance)),
      multiplier: Math.max(1, multiplier),
    }))
  }, [game.diceCount, game.targetNumber, game.prediction]) // Fixed dependency array

  const rollDice = () => {
    if (game.isRolling || balance < game.betAmount) return

    setGame((prev) => ({ ...prev, isRolling: true, result: null }))
    setBalance((prev) => prev - game.betAmount)

    // Simulate dice roll animation
    setTimeout(() => {
      const rolledNumbers = Array.from({ length: game.diceCount }, () => Math.floor(Math.random() * 6) + 1)
      const totalRoll = rolledNumbers.reduce((sum, num) => sum + num, 0)

      let isWin = false
      if (game.prediction === "over") {
        isWin = totalRoll > game.targetNumber
      } else if (game.prediction === "under") {
        isWin = totalRoll < game.targetNumber
      } else {
        // exact
        isWin = totalRoll === game.targetNumber
      }

      const profit = isWin ? game.betAmount * game.multiplier - game.betAmount : -game.betAmount

      setGame((prev) => ({
        ...prev,
        rolledNumbers,
        totalRoll,
        isRolling: false,
        result: isWin ? "win" : "lose",
        profit,
      }))

      if (isWin) {
        setBalance((prev) => prev + game.betAmount * game.multiplier)
      }

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalRolls: prev.totalRolls + 1,
        totalWins: isWin ? prev.totalWins + 1 : prev.totalWins,
        totalLosses: isWin ? prev.totalLosses : prev.totalLosses + 1,
        netProfit: prev.netProfit + profit,
        biggestWin: isWin && profit > prev.biggestWin ? profit : prev.biggestWin,
        currentStreak: isWin
          ? prev.currentStreak >= 0
            ? prev.currentStreak + 1
            : 1
          : prev.currentStreak <= 0
            ? prev.currentStreak - 1
            : -1,
        recentRolls: [totalRoll, ...prev.recentRolls.slice(0, 99)],
      }))

      // Handle auto-bet
      if (autoBet.enabled) {
        handleAutoBet(isWin, profit)
      }
    }, 2000)
  }

  const handleAutoBet = (won: boolean, profit: number) => {
    setAutoBet((prev) => {
      const newRound = prev.currentRound + 1

      // Check stop conditions
      if (newRound >= prev.rounds || (prev.stopOnWin && won) || (prev.stopOnLoss && !won)) {
        return { ...prev, enabled: false, currentRound: 0 }
      }

      // Adjust bet amount if configured
      let newBetAmount = game.betAmount
      if (!won && prev.increaseOnLoss > 0) {
        newBetAmount = game.betAmount * (1 + prev.increaseOnLoss / 100)
        setGame((prevGame) => ({ ...prevGame, betAmount: newBetAmount }))
      } else if (won) {
        newBetAmount = prev.baseAmount
        setGame((prevGame) => ({ ...prevGame, betAmount: newBetAmount }))
      }

      // Continue auto-betting
      setTimeout(() => rollDice(), 1000)

      return { ...prev, currentRound: newRound }
    })
  }

  const toggleAutoBet = () => {
    if (autoBet.enabled) {
      setAutoBet((prev) => ({ ...prev, enabled: false, currentRound: 0 }))
    } else {
      setAutoBet((prev) => ({
        ...prev,
        enabled: true,
        currentRound: 0,
        baseAmount: game.betAmount,
      }))
      setTimeout(() => rollDice(), 500)
    }
  }

  const getDiceEmoji = (number: number) => {
    const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]
    return diceEmojis[number - 1] || "⚀"
  }

  const getNumberFrequency = (number: number) => {
    return stats.recentRolls.filter((roll) => roll === number).length
  }

  return (
    <div className="p-6 space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Dice6 className="h-8 w-8 text-accent" />
          <h1 className="font-orbitron font-bold text-3xl text-glow">Dice Battle</h1>
        </div>
        <p className="text-muted-foreground">Predict dice outcomes with multipliers up to 1000x</p>

        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="font-orbitron font-bold text-xl text-primary">{balance.toFixed(2)} SOL</div>
            <div className="text-sm text-muted-foreground">Balance</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron font-bold text-xl text-secondary">{game.multiplier.toFixed(2)}x</div>
            <div className="text-sm text-muted-foreground">Multiplier</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron font-bold text-xl text-accent">{game.winChance.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Win Chance</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Dice Arena */}
        <Card className="glass lg:col-span-2">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Dice Display */}
              <div className="space-y-4">
                <div className="flex justify-center gap-4">
                  {game.isRolling
                    ? Array.from({ length: game.diceCount }, (_, i) => (
                        <div
                          key={i}
                          className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center animate-bounce"
                        >
                          <Dice6 className="h-8 w-8 text-accent animate-spin" />
                        </div>
                      ))
                    : game.rolledNumbers.length > 0
                      ? game.rolledNumbers.map((number, i) => (
                          <div
                            key={i}
                            className={`
                        w-16 h-16 rounded-lg flex items-center justify-center text-3xl
                        ${
                          game.result === "win"
                            ? "bg-primary/20 text-primary glow-primary"
                            : game.result === "lose"
                              ? "bg-destructive/20 text-destructive"
                              : "bg-accent/20 text-accent"
                        }
                      `}
                          >
                            {getDiceEmoji(number)}
                          </div>
                        ))
                      : Array.from({ length: game.diceCount }, (_, i) => (
                          <div key={i} className="w-16 h-16 bg-muted/20 rounded-lg flex items-center justify-center">
                            <Dice6 className="h-8 w-8 text-muted-foreground" />
                          </div>
                        ))}
                </div>

                {game.rolledNumbers.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-orbitron font-bold text-2xl">Total: {game.totalRoll}</div>
                    {game.result && (
                      <div
                        className={`font-orbitron font-bold text-xl ${
                          game.result === "win" ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {game.result === "win" ? `+${game.profit.toFixed(2)} SOL` : `${game.profit.toFixed(2)} SOL`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Game Controls */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Dice Count</label>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((count) => (
                        <Button
                          key={count}
                          variant={game.diceCount === count ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGame((prev) => ({ ...prev, diceCount: count as 1 | 2 | 3 }))}
                          disabled={game.isRolling}
                        >
                          {count}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Target: {game.targetNumber}</label>
                    <Slider
                      value={[game.targetNumber]}
                      onValueChange={([value]) => setGame((prev) => ({ ...prev, targetNumber: value }))}
                      min={game.diceCount}
                      max={game.diceCount * 6}
                      step={1}
                      disabled={game.isRolling}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Prediction</label>
                    <div className="flex gap-1">
                      {(["over", "under", "exact"] as Prediction[]).map((pred) => (
                        <Button
                          key={pred}
                          variant={game.prediction === pred ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGame((prev) => ({ ...prev, prediction: pred }))}
                          disabled={game.isRolling}
                          className="capitalize"
                        >
                          {pred}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Bet Amount (SOL)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={game.betAmount}
                      onChange={(e) =>
                        setGame((prev) => ({ ...prev, betAmount: Number.parseFloat(e.target.value) || 0 }))
                      }
                      className="text-center font-mono"
                      min="0.01"
                      max={balance}
                      step="0.01"
                      disabled={game.isRolling}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setGame((prev) => ({ ...prev, betAmount: balance / 2 }))}
                      disabled={game.isRolling}
                    >
                      1/2
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGame((prev) => ({ ...prev, betAmount: balance }))}
                      disabled={game.isRolling}
                    >
                      Max
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={rollDice}
                    disabled={game.isRolling || balance < game.betAmount || autoBet.enabled}
                    className="flex-1 glow-primary"
                    size="lg"
                  >
                    {game.isRolling ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                        Rolling...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Roll Dice
                      </>
                    )}
                  </Button>

                  <Button onClick={toggleAutoBet} variant={autoBet.enabled ? "destructive" : "secondary"} size="lg">
                    {autoBet.enabled ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Stop ({autoBet.currentRound}/{autoBet.rounds})
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Auto
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Game Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Rolls</div>
                  <div className="font-mono font-bold">{stats.totalRolls}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Win Rate</div>
                  <div className="font-mono font-bold text-primary">
                    {stats.totalRolls > 0 ? ((stats.totalWins / stats.totalRolls) * 100).toFixed(1) : 0}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Net Profit</div>
                  <div className={`font-mono font-bold ${stats.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                    {stats.netProfit >= 0 ? "+" : ""}
                    {stats.netProfit.toFixed(2)} SOL
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Biggest Win</div>
                  <div className="font-mono font-bold text-secondary">{stats.biggestWin.toFixed(2)} SOL</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Current Streak</div>
                  <div
                    className={`font-mono font-bold ${stats.currentStreak > 0 ? "text-primary" : stats.currentStreak < 0 ? "text-destructive" : ""}`}
                  >
                    {stats.currentStreak > 0 ? "+" : ""}
                    {stats.currentStreak}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Bet Settings */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Auto-Bet Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Number of Rounds</label>
                <Input
                  type="number"
                  value={autoBet.rounds}
                  onChange={(e) => setAutoBet((prev) => ({ ...prev, rounds: Number.parseInt(e.target.value) || 1 }))}
                  min="1"
                  max="1000"
                  disabled={autoBet.enabled}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Increase on Loss (%)</label>
                <Input
                  type="number"
                  value={autoBet.increaseOnLoss}
                  onChange={(e) =>
                    setAutoBet((prev) => ({ ...prev, increaseOnLoss: Number.parseFloat(e.target.value) || 0 }))
                  }
                  min="0"
                  max="100"
                  disabled={autoBet.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Stop on Win</label>
                <Switch
                  checked={autoBet.stopOnWin}
                  onCheckedChange={(checked) => setAutoBet((prev) => ({ ...prev, stopOnWin: checked }))}
                  disabled={autoBet.enabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Stop on Loss</label>
                <Switch
                  checked={autoBet.stopOnLoss}
                  onCheckedChange={(checked) => setAutoBet((prev) => ({ ...prev, stopOnLoss: checked }))}
                  disabled={autoBet.enabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Hot/Cold Numbers */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Number Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Hot Numbers</div>
                <div className="flex gap-2">
                  {stats.hotNumbers.map((num) => (
                    <Badge key={num} variant="secondary" className="bg-primary/20 text-primary">
                      {num} ({getNumberFrequency(num)})
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground mb-2">Cold Numbers</div>
                <div className="flex gap-2">
                  {stats.coldNumbers.map((num) => (
                    <Badge key={num} variant="outline" className="text-accent">
                      {num} ({getNumberFrequency(num)})
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
