"use client"

import { useState, useEffect } from "react"
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import SolDuelSDK, { StrategicAction, DuelState } from "@/lib/solduel-sdk"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  RefreshCw,
  Crown,
  Swords,
  Target,
  Trophy,
  Flame,
  CheckCircle,
  Clock,
  Plus,
  ArrowLeft,
  TrendingUp,
  Minus,
} from "lucide-react"

type GameState = "lobby" | "waiting" | "duel" | "results"
type BettingAction = "check" | "raise" | "fold" | "call"
type RoundPhase = "betting" | "waiting" | "completed"

interface DuelPlayer {
  id: string
  wallet: string
  displayName: string
  avatar?: string
  initialStake: number
  currentContribution: number
  winProbability: number
  multiplier: number
  winRate: number
  totalEarnings: number
  recentForm: boolean[]
  isReady: boolean
  joinedAt: Date
  hasFolded: boolean
  lastAction?: BettingAction
  actionAmount?: number
}

interface BettingRound {
  roundNumber: number
  phase: RoundPhase
  player1Action?: BettingAction
  player2Action?: BettingAction
  player1Amount: number
  player2Amount: number
  totalRoundPool: number
  isComplete: boolean
}

interface DuelRoom {
  roomId: string
  status: "waiting" | "ready" | "betting" | "completed"
  player1: DuelPlayer | null
  player2: DuelPlayer | null
  totalPool: number
  createdAt: Date
  winner?: string
  currentRound: number
  rounds: BettingRound[]
  maxRounds: 3 // Always 3 rounds
  currentPlayerTurn?: "player1" | "player2"
  lastRaiseAmount: number
}

export function SolDuelGame() {
  const { connection } = useConnection()
  const wallet = useWallet()
  
  const [sdk, setSdk] = useState<SolDuelSDK | null>(null)
  const [currentDuelId, setCurrentDuelId] = useState<string | null>(null)
  const [duelState, setDuelState] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [gameRoom, setGameRoom] = useState<DuelRoom>({
    roomId: "",
    status: "waiting",
    player1: null,
    player2: null,
    totalPool: 0,
    createdAt: new Date(),
    currentRound: 1,
    rounds: [],
    maxRounds: 3,
    lastRaiseAmount: 0,
  })

  const [userStake, setUserStake] = useState("1.0")
  const [raiseAmount, setRaiseAmount] = useState("0.5")
  const [showVictory, setShowVictory] = useState(false)

  // Initialize SDK when wallet is connected
  useEffect(() => {
    if (connection && wallet && wallet.publicKey) {
      const newSdk = new SolDuelSDK(connection, wallet)
      setSdk(newSdk)
    } else {
      setSdk(null)
    }
  }, [connection, wallet])

  // Poll for duel state updates
  useEffect(() => {
    if (!sdk || !currentDuelId) return

    const pollDuelState = async () => {
      try {
        const state = await sdk.getDuelState(currentDuelId)
        setDuelState(state)
        
        // Update game state based on duel state
        if (state.state === DuelState.WaitingForPlayer2) {
          setGameState("waiting")
        } else if (state.state === DuelState.InProgress) {
          setGameState("duel")
        } else if (state.state === DuelState.Completed) {
          setGameState("results")
        }
      } catch (error) {
        console.error('Error polling duel state:', error)
      }
    }

    pollDuelState()
    const interval = setInterval(pollDuelState, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [sdk, currentDuelId])

  const [openDuels] = useState([
    {
      roomId: "room_001",
      player1: {
        id: "whale_001",
        displayName: "SolWhale",
        wallet: "9xKX...7mNp",
        avatar: "/whale-avatar.png",
        stake: 5.0,
        winRate: 74,
        recentForm: [true, true, true, false, true],
      },
      createdAt: new Date(Date.now() - 300000),
    },
    {
      roomId: "room_002",
      player1: {
        id: "lucky_001",
        displayName: "LuckyDice",
        wallet: "3xKX...2mNp",
        avatar: "/lucky-avatar.png",
        stake: 1.5,
        winRate: 62,
        recentForm: [false, true, true, true, false],
      },
      createdAt: new Date(Date.now() - 120000),
    },
  ])

  const handleCreateDuel = async (stake: number) => {
    if (stake <= 0 || !sdk || !wallet.publicKey) return

    setIsLoading(true)
    try {
      // Create strategic duel on blockchain
      const result = await sdk.createStrategicDuel(stake)
      setCurrentDuelId(result.duelId)
      
      setGameRoom({
        roomId: result.duelId,
        status: "waiting",
        player1: {
          id: wallet.publicKey.toString(),
          wallet: wallet.publicKey.toString().slice(0, 4) + '...' + wallet.publicKey.toString().slice(-4),
          displayName: "You",
          initialStake: stake,
          currentContribution: stake,
          winProbability: 50,
          multiplier: 1,
          winRate: 0,
          totalEarnings: 0,
          recentForm: [],
          isReady: true,
          joinedAt: new Date(),
          hasFolded: false,
        },
        player2: null,
        totalPool: stake,
        createdAt: new Date(),
        currentRound: 1,
        rounds: [],
        maxRounds: 3,
        lastRaiseAmount: 0,
      })

      setGameState("waiting")
    } catch (error) {
      console.error('Error creating strategic duel:', error)
      alert('Failed to create duel. Make sure you have enough SOL and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinExistingDuel = (duel: any, stake: number) => {
    const requiredStake = duel.player1.stake
    if (stake !== requiredStake) {
      alert(`You must stake exactly ${requiredStake} SOL to join this duel`)
      return
    }

    const probabilities = calculateProbabilities(duel.player1.stake, stake)

    setGameRoom({
      roomId: duel.roomId,
      status: "ready",
      player1: {
        ...duel.player1,
        initialStake: duel.player1.stake,
        currentContribution: duel.player1.stake,
        winProbability: probabilities.player1,
        multiplier: probabilities.multiplier1,
        hasFolded: false,
      },
      player2: {
        id: "you",
        wallet: "You",
        displayName: "You",
        initialStake: stake,
        currentContribution: stake,
        winProbability: probabilities.player2,
        multiplier: probabilities.multiplier2,
        winRate: 72,
        totalEarnings: 23.4,
        recentForm: [true, false, true, true, false],
        isReady: true,
        joinedAt: new Date(),
        hasFolded: false,
      },
      totalPool: duel.player1.stake + stake,
      createdAt: duel.createdAt,
      currentRound: 1,
      rounds: [],
      maxRounds: 3,
      currentPlayerTurn: "player1",
      lastRaiseAmount: 0,
    })
    setGameState("duel")
  }

  const calculateProbabilities = (contribution1: number, contribution2: number) => {
    const total = contribution1 + contribution2
    return {
      player1: (contribution1 / total) * 100,
      player2: (contribution2 / total) * 100,
      multiplier1: total / contribution1,
      multiplier2: total / contribution2,
    }
  }

  const handleBettingAction = async (action: BettingAction, amount?: number) => {
    if (!sdk || !currentDuelId || !wallet.publicKey) {
      alert('SDK not initialized or no active duel')
      return
    }

    setIsLoading(true)
    try {
      let strategicAction: StrategicAction
      let raiseAmount: number | undefined

      // Map UI actions to blockchain actions
      switch (action) {
        case "check":
          strategicAction = StrategicAction.Check
          break
        case "raise":
          if (!amount || amount <= 0) {
            alert('Please enter a valid raise amount')
            return
          }
          strategicAction = StrategicAction.Raise
          raiseAmount = amount
          break
        case "call":
          strategicAction = StrategicAction.Call
          break
        case "fold":
          strategicAction = StrategicAction.Fold
          break
        default:
          return
      }

      // Submit action to blockchain
      await sdk.submitAction(currentDuelId, strategicAction, raiseAmount)
      
      // The duel state will be updated automatically by the polling effect
      console.log(`Action ${action} submitted successfully`)

    } catch (error) {
      console.error('Error submitting betting action:', error)
      alert('Failed to submit action. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateProbabilities = () => {
    if (!gameRoom.player1 || !gameRoom.player2) return

    const probabilities = calculateProbabilities(
      gameRoom.player1.currentContribution,
      gameRoom.player2.currentContribution,
    )

    setGameRoom((prev) => ({
      ...prev,
      player1: prev.player1
        ? {
            ...prev.player1,
            winProbability: probabilities.player1,
            multiplier: probabilities.multiplier1,
          }
        : null,
      player2: prev.player2
        ? {
            ...prev.player2,
            winProbability: probabilities.player2,
            multiplier: probabilities.multiplier2,
          }
        : null,
    }))
  }

  const checkRoundComplete = () => {
    if (!gameRoom.player1 || !gameRoom.player2) return

    // Check if both players have acted in this round
    const bothActed = gameRoom.player1.lastAction && gameRoom.player2.lastAction

    if (bothActed) {
      // Add round to history
      const newRound: BettingRound = {
        roundNumber: gameRoom.currentRound,
        phase: "completed",
        player1Action: gameRoom.player1.lastAction,
        player2Action: gameRoom.player2.lastAction,
        player1Amount: gameRoom.player1.actionAmount || 0,
        player2Amount: gameRoom.player2.actionAmount || 0,
        totalRoundPool: gameRoom.totalPool,
        isComplete: true,
      }

      setGameRoom((prev) => ({
        ...prev,
        rounds: [...prev.rounds, newRound],
        currentRound: prev.currentRound + 1,
        player1: prev.player1 ? { ...prev.player1, lastAction: undefined, actionAmount: undefined } : null,
        player2: prev.player2 ? { ...prev.player2, lastAction: undefined, actionAmount: undefined } : null,
        currentPlayerTurn: "player1",
        lastRaiseAmount: 0,
      }))

      if (gameRoom.currentRound >= 3) {
        setTimeout(() => {
          determineWinner()
        }, 1500)
      }
    }
  }

  const determineWinner = () => {
    if (!gameRoom.player1 || !gameRoom.player2) return

    // The fold penalty was already applied when they folded
    const random = Math.random() * 100
    const winner = random < gameRoom.player1.winProbability ? "player1" : "player2"

    setGameRoom((prev) => ({ ...prev, winner, status: "completed" }))
    setShowVictory(true)
  }

  const resetGame = () => {
    setGameState("lobby")
    setGameRoom({
      roomId: "",
      status: "waiting",
      player1: null,
      player2: null,
      totalPool: 0,
      createdAt: new Date(),
      currentRound: 1,
      rounds: [],
      maxRounds: 3,
      lastRaiseAmount: 0,
    })
    setShowVictory(false)
  }

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
    return minutes < 1 ? "Just now" : `${minutes}m ago`
  }

  const handleReady = () => {
    if (!gameRoom.player2) return

    setGameRoom((prev) => ({
      ...prev,
      player2: prev.player2 ? { ...prev.player2, isReady: true } : null,
      status: "betting",
      currentPlayerTurn: "player1",
    }))
  }

  if (gameState === "lobby") {
    return (
      <div className="p-6 space-y-6">
        <motion.div className="text-center space-y-6" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <motion.div
            className="flex items-center justify-center gap-3"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
          >
            <Swords className="h-8 w-8 text-primary" />
            <h1 className="font-orbitron font-bold text-4xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              ⚔️ SOL DUEL LOBBY ⚔️
            </h1>
            <Swords className="h-8 w-8 text-primary" />
          </motion.div>

          <p className="text-muted-foreground text-lg">3-Round Betting Duels • Proportional Wins • Winner Takes All</p>

          <div className="flex justify-center gap-8">
            <div className="text-center">
              <div className="font-orbitron font-bold text-xl text-primary flex items-center gap-1">
                <Flame className="h-5 w-5" />
                {openDuels.reduce((sum, duel) => sum + duel.player1.stake, 0)} SOL
              </div>
              <div className="text-sm text-muted-foreground">Available Pool</div>
            </div>
            <div className="text-center">
              <div className="font-orbitron font-bold text-xl text-secondary">{openDuels.length}</div>
              <div className="text-sm text-muted-foreground">Open Duels</div>
            </div>
            <div className="text-center">
              <div className="font-orbitron font-bold text-xl text-accent">1,247 SOL</div>
              <div className="text-sm text-muted-foreground">24h Volume</div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="glass glow-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Duel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground">Initial Stake</label>
                  <Input
                    type="number"
                    value={userStake}
                    onChange={(e) => setUserStake(e.target.value)}
                    className="text-center font-mono text-lg mt-2"
                    min="0.1"
                    step="0.1"
                  />
                  <div className="flex gap-2 mt-2">
                    {["0.5", "1.0", "2.5", "5.0"].map((amount) => (
                      <Button key={amount} variant="outline" size="sm" onClick={() => setUserStake(amount)}>
                        {amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleCreateDuel(Number.parseFloat(userStake))}
                disabled={!userStake || Number.parseFloat(userStake) <= 0 || !wallet.publicKey || isLoading}
                className="w-full glow-primary"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                {!wallet.publicKey 
                  ? "Connect Wallet to Play"
                  : isLoading 
                  ? "Creating Duel..."
                  : `Create 3-Round Duel (${userStake} SOL)`
                }
              </Button>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Available Duels
                <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">{openDuels.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {openDuels.map((duel, index) => (
                  <motion.div
                    key={duel.roomId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-card/50 rounded-lg border space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20">
                            {duel.player1.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold">{duel.player1.displayName}</div>
                          <div className="text-sm text-muted-foreground">
                            Win Rate: {duel.player1.winRate}% • {getTimeAgo(duel.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-orbitron font-bold text-primary">{duel.player1.stake} SOL</div>
                        <div className="text-xs text-muted-foreground">3 Rounds</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={`Required: ${duel.player1.stake} SOL`}
                        className="flex-1 text-sm"
                        min={duel.player1.stake}
                        max={duel.player1.stake}
                        step="0.1"
                        defaultValue={(duel.player1.stake || 0).toString()}
                        id={`stake-${duel.roomId}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`stake-${duel.roomId}`) as HTMLInputElement
                          const stake = Number.parseFloat(input.value)
                          handleJoinExistingDuel(duel, stake)
                        }}
                      >
                        <Swords className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState === "waiting") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setGameState("lobby")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lobby
          </Button>
        </div>

        <motion.div className="text-center space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="font-orbitron font-bold text-2xl">Waiting for Opponent...</h2>
          <p className="text-muted-foreground">Share your duel room to invite players</p>

          <Card className="glass max-w-md mx-auto">
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <div className="font-mono text-sm text-muted-foreground">Room ID</div>
                <div className="font-bold text-lg">{gameRoom.roomId}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Your Stake:</span>
                  <span className="font-bold text-primary">{gameRoom.player1?.initialStake} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Game Mode:</span>
                  <span>3 Betting Rounds</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Created:</span>
                  <span>{getTimeAgo(gameRoom.createdAt)}</span>
                </div>
              </div>

              <motion.div
                className="flex items-center justify-center gap-2 text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Users className="h-5 w-5" />
                <span>Waiting for challenger...</span>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => setGameState("lobby")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lobby
        </Button>

        <div className="text-center">
          <div className="font-orbitron font-bold text-lg">
            Round {gameRoom.currentRound} of {gameRoom.maxRounds}
          </div>
          <div className="text-sm text-muted-foreground">
            3-Round Betting Duel • Total Pool: {gameRoom.totalPool.toFixed(2)} SOL
          </div>
        </div>

        <div></div>
      </div>

      <div className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <PlayerCard player={gameRoom.player1} side="left" isWinner={gameRoom.winner === "player1"} />

          <Card className="glass">
            <CardContent className="p-8">
              <BettingCenterDisplay
                status={gameRoom.status}
                totalPool={gameRoom.totalPool}
                player1={gameRoom.player1}
                player2={gameRoom.player2}
                onReady={handleReady}
                currentRound={gameRoom.currentRound}
                rounds={gameRoom.rounds}
                currentPlayerTurn={gameRoom.currentPlayerTurn}
                onBettingAction={handleBettingAction}
                raiseAmount={raiseAmount}
                setRaiseAmount={setRaiseAmount}
                lastRaiseAmount={gameRoom.lastRaiseAmount}
              />
            </CardContent>
          </Card>

          <PlayerCard player={gameRoom.player2} side="right" isWinner={gameRoom.winner === "player2"} />
        </div>

        <AnimatePresence>
          {showVictory && gameRoom.winner && (
            <VictoryScreen
              winner={gameRoom.winner === "player1" ? gameRoom.player1 : gameRoom.player2}
              loser={gameRoom.winner === "player1" ? gameRoom.player2 : gameRoom.player1}
              pool={gameRoom.totalPool}
              onReset={resetGame}
              rounds={gameRoom.rounds}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PlayerCard({
  player,
  side,
  isWinner,
}: {
  player: DuelPlayer | null
  side: "left" | "right"
  isWinner: boolean
}) {
  if (!player) {
    return (
      <Card className="glass">
        <CardContent className="p-8">
          <motion.div
            className="text-center space-y-4"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Waiting for opponent...</p>
          </motion.div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ x: side === "left" ? -100 : 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <Card className={`glass ${isWinner ? "glow-primary" : ""} ${player.hasFolded ? "opacity-50" : ""}`}>
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <div className="relative">
              <Avatar className="h-16 w-16 mx-auto mb-3">
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {player.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isWinner && (
                <motion.div
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Crown className="h-6 w-6 text-yellow-500" />
                </motion.div>
              )}
              {player.hasFolded && (
                <div className="absolute -top-2 -left-2">
                  <Minus className="h-6 w-6 text-red-500" />
                </div>
              )}
            </div>
            <h3 className="font-bold text-lg">{player.displayName}</h3>
            <p className="text-sm text-muted-foreground font-mono">{player.wallet}</p>
            {player.lastAction && (
              <div className="text-xs font-bold text-accent capitalize">
                Last: {player.lastAction} {player.actionAmount ? `(${player.actionAmount} SOL)` : ""}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="bg-card/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Current Contribution</div>
              <div className="font-orbitron font-bold text-xl text-primary">
                {(player.currentContribution || 0).toFixed(2)} SOL
              </div>
              <div className="text-xs text-muted-foreground">Initial: {player.initialStake || 0} SOL</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Win Chance</span>
                <span className="font-bold">{(player.winProbability || 0).toFixed(1)}%</span>
              </div>
              <Progress value={player.winProbability || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Potential Win</span>
                <span className="font-bold text-primary">{(player.multiplier || 0).toFixed(2)}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Win Rate</span>
                <span>{player.winRate || 0}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              {player.hasFolded ? (
                <span className="text-red-500 text-sm">Folded</span>
              ) : player.isReady ? (
                <CheckCircle className="h-5 w-5 text-primary" />
              ) : (
                <Clock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BettingCenterDisplay({
  status,
  totalPool,
  player1,
  player2,
  onReady,
  currentRound,
  rounds,
  currentPlayerTurn,
  onBettingAction,
  raiseAmount,
  setRaiseAmount,
  lastRaiseAmount,
}: {
  status: string
  totalPool: number
  player1: DuelPlayer | null
  player2: DuelPlayer | null
  onReady: () => void
  currentRound: number
  rounds: BettingRound[]
  currentPlayerTurn?: "player1" | "player2"
  onBettingAction: (action: BettingAction, amount?: number) => void
  raiseAmount: string
  setRaiseAmount: (amount: string) => void
  lastRaiseAmount: number
}) {
  const isYourTurn = currentPlayerTurn === "player2" // Assuming player2 is "you"

  return (
    <div className="text-center space-y-6">
      <motion.div
        className="space-y-2"
        animate={
          status === "betting"
            ? {
                scale: [1, 1.05, 1],
              }
            : {}
        }
        transition={{ duration: 1, repeat: status === "betting" ? Number.POSITIVE_INFINITY : 0 }}
      >
        <p className="text-sm text-muted-foreground">TOTAL POOL</p>
        <div className="font-orbitron font-bold text-4xl text-primary">{totalPool.toFixed(2)} SOL</div>
      </motion.div>

      {rounds.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">ROUND HISTORY</p>
          <div className="space-y-2">
            {rounds.map((round, index) => (
              <div key={index} className="bg-card/30 p-2 rounded text-xs">
                <div className="font-bold">Round {round.roundNumber}</div>
                <div className="flex justify-between">
                  <span>
                    {player1?.displayName}: {round.player1Action}
                  </span>
                  <span>
                    {player2?.displayName}: {round.player2Action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {player1 && player2 && (
        <div className="space-y-4">
          <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#1a1a2e" strokeWidth="8" />
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#player1Gradient)"
              strokeWidth="8"
              strokeDasharray={`${(player1.winProbability / 100) * 502} 502`}
              initial={{ strokeDasharray: "0 502" }}
              animate={{ strokeDasharray: `${(player1.winProbability / 100) * 502} 502` }}
              transition={{ duration: 1 }}
            />
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="url(#player2Gradient)"
              strokeWidth="8"
              strokeDasharray={`${(player2.winProbability / 100) * 502} 502`}
              strokeDashoffset={`-${(player1.winProbability / 100) * 502}`}
              initial={{ strokeDasharray: "0 502" }}
              animate={{ strokeDasharray: `${(player2.winProbability / 100) * 502} 502` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <defs>
              <linearGradient id="player1Gradient">
                <stop offset="0%" stopColor="#00ff88" />
                <stop offset="100%" stopColor="#00b4d8" />
              </linearGradient>
              <linearGradient id="player2Gradient">
                <stop offset="0%" stopColor="#ff006e" />
                <stop offset="100%" stopColor="#ffb700" />
              </linearGradient>
            </defs>
          </svg>

          <div className="flex justify-center gap-4 text-sm">
            <div className="text-primary">{player1.winProbability.toFixed(1)}%</div>
            <div className="text-muted-foreground">VS</div>
            <div className="text-secondary">{player2.winProbability.toFixed(1)}%</div>
          </div>
        </div>
      )}

      {status === "ready" && (
        <Button onClick={onReady} className="glow-primary" size="lg">
          <Target className="h-4 w-4 mr-2" />
          Start Betting Round {currentRound}
        </Button>
      )}

      {status === "betting" && currentRound <= 3 && (
        <div className="space-y-4">
          <div className="text-sm">
            {isYourTurn ? (
              <span className="text-primary font-bold">Your Turn</span>
            ) : (
              <span className="text-muted-foreground">Opponent's Turn</span>
            )}
          </div>

          {isYourTurn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => onBettingAction("check")} variant="outline" size="sm">
                  Check
                </Button>
                <Button onClick={() => onBettingAction("fold")} variant="destructive" size="sm">
                  Fold
                </Button>
              </div>

              {lastRaiseAmount > 0 && (
                <Button onClick={() => onBettingAction("call")} className="w-full" size="sm">
                  Call ({lastRaiseAmount} SOL)
                </Button>
              )}

              <div className="space-y-2">
                <Input
                  type="number"
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(e.target.value)}
                  placeholder="Raise amount"
                  className="text-center"
                  min="0.1"
                  step="0.1"
                />
                <Button
                  onClick={() => onBettingAction("raise", Number.parseFloat(raiseAmount))}
                  disabled={!raiseAmount || Number.parseFloat(raiseAmount) <= 0}
                  className="w-full glow-primary"
                  size="sm"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Raise ({raiseAmount} SOL)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "completed" && (
        <div className="text-center">
          <h3 className="font-orbitron font-bold text-xl text-primary">DUEL COMPLETE</h3>
          <p className="text-sm text-muted-foreground">Winner determined by proportional probability</p>
        </div>
      )}
    </div>
  )
}

function VictoryScreen({
  winner,
  loser,
  pool,
  onReset,
  rounds,
}: {
  winner: DuelPlayer | null
  loser: DuelPlayer | null
  pool: number
  onReset: () => void
  rounds: BettingRound[]
}) {
  if (!winner) return null

  const winMultiplier = pool / winner.initialStake
  const isUpset = winner.winProbability < 30

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-card p-8 rounded-lg max-w-md w-full mx-4 text-center space-y-6"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 10 }}
      >
        {isUpset && (
          <motion.div
            className="text-orange-500"
            animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            <h3 className="font-bold text-xl">🔥 INCREDIBLE UPSET! 🔥</h3>
            <p className="text-sm">Won with only {winner.winProbability.toFixed(1)}% chance!</p>
          </motion.div>
        )}

        <div className="space-y-4">
          <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
          <h2 className="font-orbitron font-bold text-2xl text-primary">VICTORY!</h2>
          <h3 className="font-bold text-xl">{winner.displayName}</h3>

          <div className="bg-card/50 p-3 rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">3-Round Betting Duel</div>
            <div className="text-lg font-bold">Final Contribution: {winner.currentContribution.toFixed(2)} SOL</div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Initial Stake:</span>
              <span>{winner.initialStake} SOL</span>
            </div>
            <div className="flex justify-between">
              <span>Final Contribution:</span>
              <span>{winner.currentContribution.toFixed(2)} SOL</span>
            </div>
            <div className="flex justify-between text-primary font-bold">
              <span>Total Won:</span>
              <span>{pool.toFixed(2)} SOL</span>
            </div>
            <div className="flex justify-between">
              <span>Multiplier:</span>
              <span className="text-primary">{winMultiplier.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between">
              <span>Win Probability:</span>
              <span>{winner.winProbability.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onReset} variant="outline" className="flex-1 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            New Duel
          </Button>
          <Button className="flex-1 glow-primary">
            <Swords className="h-4 w-4 mr-2" />
            Rematch
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
