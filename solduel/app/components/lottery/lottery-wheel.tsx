"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Trophy, Users, Clock, Coins, Plus, Share2, CheckCircle, Sparkles, TrendingUp, Target } from "lucide-react"

interface WheelSegment {
  id: string
  wallet: string
  displayName: string
  contribution: number
  percentage: number
  color: string
  startAngle: number
  endAngle: number
  isWinner?: boolean
}

interface Participant {
  id: string
  wallet: string
  displayName: string
  contribution: number
  percentage: number
  color: string
  avatar: string
  isNew?: boolean
}

interface UserEntry {
  ticketId: string
  amount: number
  percentage: number
}

interface PreviousDraw {
  id: string
  winner: string
  poolSize: number
  participantCount: number
  endedAt: Date
}

export function LotteryWheel() {
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      wallet: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      displayName: "Player#1234",
      contribution: 5.2,
      percentage: 25.6,
      color: "#00ff88",
      avatar: "/diverse-gaming-avatars.png",
    },
    {
      id: "2",
      wallet: "9yHpEe3qN2vB8wTXJSDpbD5jBkheTqA83TZRuJosgAsU",
      displayName: "CryptoKing",
      contribution: 3.8,
      percentage: 18.7,
      color: "#ff006e",
      avatar: "/crypto-avatar.png",
    },
    {
      id: "3",
      wallet: "4mNxRt5pL1cA9wTXJSDpbD5jBkheTqA83TZRuJosgAsU",
      displayName: "SolanaWhale",
      contribution: 7.1,
      percentage: 35.0,
      color: "#00b4d8",
      avatar: "/whale-avatar.png",
    },
    {
      id: "4",
      wallet: "2kLpVs8qM3dB7wTXJSDpbD5jBkheTqA83TZRuJosgAsU",
      displayName: "LuckyPlayer",
      contribution: 4.2,
      percentage: 20.7,
      color: "#ffb700",
      avatar: "/lucky-avatar.png",
      isNew: true,
    },
  ])

  const [totalPool, setTotalPool] = useState(20.3)
  const [isSpinning, setIsSpinning] = useState(false)
  const [currentRotation, setCurrentRotation] = useState(0)
  const [winner, setWinner] = useState<WheelSegment | null>(null)
  const [showVictoryModal, setShowVictoryModal] = useState(false)
  const [stakeAmount, setStakeAmount] = useState(1.0)
  const [userEntry, setUserEntry] = useState<UserEntry | null>(null)
  const [userBalance] = useState(12.45)
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 2,
    minutes: 34,
    seconds: 18,
    total: 9258,
  })

  const wheelRef = useRef<HTMLDivElement>(null)

  const previousDraws: PreviousDraw[] = [
    {
      id: "1",
      winner: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      poolSize: 45.8,
      participantCount: 23,
      endedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      winner: "9yHpEe3qN2vB8wTXJSDpbD5jBkheTqA83TZRuJosgAsU",
      poolSize: 32.1,
      participantCount: 18,
      endedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ]

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev.total <= 0) return prev

        const newTotal = prev.total - 1
        return {
          hours: Math.floor(newTotal / 3600),
          minutes: Math.floor((newTotal % 3600) / 60),
          seconds: newTotal % 60,
          total: newTotal,
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const calculateChance = (amount: number) => {
    const newTotal = totalPool + amount
    return ((amount / newTotal) * 100).toFixed(1)
  }

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
  }

  const handleEnterLottery = () => {
    const newEntry: UserEntry = {
      ticketId: `TKT${Date.now()}`,
      amount: stakeAmount,
      percentage: Number.parseFloat(calculateChance(stakeAmount)),
    }
    setUserEntry(newEntry)
    setTotalPool((prev) => prev + stakeAmount)
  }

  const handleSpin = async () => {
    if (isSpinning) return

    setIsSpinning(true)

    // Simulate spin animation
    const spins = 5 + Math.random() * 3
    const finalRotation = currentRotation + 360 * spins + Math.random() * 360

    setCurrentRotation(finalRotation)

    // After 4 seconds, show winner
    setTimeout(() => {
      const randomWinner = participants[Math.floor(Math.random() * participants.length)]
      setWinner(randomWinner as WheelSegment)
      setIsSpinning(false)
      setShowVictoryModal(true)
    }, 4000)
  }

  const createArcPath = (startAngle: number, endAngle: number) => {
    const centerX = 300
    const centerY = 300
    const radius = 200

    const start = (startAngle - 90) * (Math.PI / 180)
    const end = (endAngle - 90) * (Math.PI / 180)

    const x1 = centerX + radius * Math.cos(start)
    const y1 = centerY + radius * Math.sin(start)
    const x2 = centerX + radius * Math.cos(end)
    const y2 = centerY + radius * Math.sin(end)

    const largeArc = endAngle - startAngle > 180 ? 1 : 0

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
  }

  const getTextPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2
    const textRadius = 150
    const angle = (midAngle - 90) * (Math.PI / 180)

    return {
      x: 300 + textRadius * Math.cos(angle),
      y: 300 + textRadius * Math.sin(angle),
    }
  }

  const segments: WheelSegment[] = participants.map((participant, index) => {
    let currentAngle = 0
    for (let i = 0; i < index; i++) {
      currentAngle += (participants[i].percentage / 100) * 360
    }

    return {
      ...participant,
      startAngle: currentAngle,
      endAngle: currentAngle + (participant.percentage / 100) * 360,
    }
  })

  const circumference = 2 * Math.PI * 90
  const offset = circumference - (timeRemaining.total / 10800) * circumference

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <motion.h1
            className="font-orbitron font-bold text-4xl text-glow"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🎰 SolDuel Lottery
          </motion.h1>
          <p className="text-muted-foreground">The ultimate Solana lottery experience with proportional chances</p>
        </div>

        {/* Countdown Timer */}
        <div className="flex justify-center">
          <Card className="glass p-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="90"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted-foreground/20"
                    style={{ strokeDasharray: circumference }}
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="90"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-primary"
                    style={{
                      strokeDasharray: circumference,
                      strokeDashoffset: offset,
                      transition: "stroke-dashoffset 1s linear",
                    }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00ff88" />
                      <stop offset="50%" stopColor="#00b4d8" />
                      <stop offset="100%" stopColor="#ff006e" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="font-mono text-2xl font-bold">
                    {timeRemaining.hours.toString().padStart(2, "0")}:
                    {timeRemaining.minutes.toString().padStart(2, "0")}:
                    {timeRemaining.seconds.toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-muted-foreground">Until Draw</div>
                </div>
              </div>
            </div>

            {timeRemaining.total < 60 && (
              <motion.div
                className="text-center mt-4 text-sm font-bold"
                animate={{
                  color: ["#ff006e", "#ffb700", "#ff006e"],
                }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              >
                ⚡ LAST MINUTE TO ENTER! ⚡
              </motion.div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Participants Panel */}
          <Card className="glass p-6 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <h3 className="font-orbitron font-bold">Participants ({participants.length})</h3>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {participants.map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass p-3 rounded-lg"
                    style={{
                      borderLeft: `4px solid ${participant.color}`,
                      background: `linear-gradient(90deg, ${participant.color}10 0%, transparent 100%)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={participant.avatar || "/placeholder.svg"}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full"
                        />
                        {participant.isNew && (
                          <Badge className="absolute -top-1 -right-1 text-xs bg-secondary">NEW</Badge>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm truncate">{truncateWallet(participant.wallet)}</p>
                        <p className="text-xs text-muted-foreground">{participant.contribution} SOL</p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold">{participant.percentage.toFixed(1)}%</div>
                        <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${participant.percentage}%`,
                              backgroundColor: participant.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg Contribution</span>
                <span className="font-mono">{(totalPool / participants.length).toFixed(2)} SOL</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biggest Stake</span>
                <span className="font-mono text-primary">
                  {Math.max(...participants.map((p) => p.contribution))} SOL
                </span>
              </div>
            </div>
          </Card>

          {/* Fortune Wheel */}
          <div className="lg:col-span-2 flex flex-col items-center space-y-6">
            <div className="relative">
              {/* Wheel Pointer */}
              <motion.div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10"
                animate={{
                  scale: isSpinning ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isSpinning ? Number.POSITIVE_INFINITY : 0,
                }}
              >
                <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[40px] border-l-transparent border-r-transparent border-b-primary drop-shadow-lg" />
              </motion.div>

              {/* Fortune Wheel */}
              <motion.div
                ref={wheelRef}
                className="relative w-96 h-96 rounded-full overflow-hidden"
                style={{
                  background: `radial-gradient(circle at center, rgba(20, 20, 40, 0.9), rgba(10, 10, 15, 1))`,
                  border: "3px solid transparent",
                  backgroundImage: `
                    linear-gradient(#0a0a0f, #0a0a0f),
                    conic-gradient(from 0deg, #00ff88, #00b4d8, #ff006e, #ffb700, #00ff88)
                  `,
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                  boxShadow: `
                    0 0 100px rgba(0, 255, 136, 0.3),
                    inset 0 0 50px rgba(0, 0, 0, 0.5),
                    0 10px 40px rgba(0, 0, 0, 0.8)
                  `,
                  filter: isSpinning ? "blur(2px)" : "none",
                }}
                animate={{
                  rotate: currentRotation,
                }}
                transition={{
                  duration: isSpinning ? 4 : 0,
                  ease: isSpinning ? "easeOut" : "linear",
                }}
              >
                <svg className="w-full h-full" viewBox="0 0 600 600">
                  {segments.map((segment) => {
                    const textPos = getTextPosition(segment.startAngle, segment.endAngle)
                    return (
                      <g key={segment.id}>
                        <path
                          d={createArcPath(segment.startAngle, segment.endAngle)}
                          fill={segment.color}
                          stroke="#0a0a0f"
                          strokeWidth="2"
                          className="transition-all duration-300"
                          style={{
                            filter: segment.isWinner ? `drop-shadow(0 0 20px ${segment.color})` : "none",
                          }}
                        />

                        {segment.percentage > 5 && (
                          <text
                            x={textPos.x}
                            y={textPos.y}
                            fill="white"
                            fontSize="12"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan>{segment.displayName}</tspan>
                            <tspan x={textPos.x} dy="16">
                              {segment.percentage.toFixed(1)}%
                            </tspan>
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* Center Circle */}
                  <circle cx="300" cy="300" r="80" fill="url(#centerGradient)" stroke="#00ff88" strokeWidth="3" />

                  <text x="300" y="285" fontSize="16" fill="white" textAnchor="middle">
                    PRIZE POOL
                  </text>
                  <text x="300" y="310" fontSize="24" fill="#00ff88" textAnchor="middle" fontWeight="bold">
                    {totalPool.toFixed(1)} SOL
                  </text>

                  <defs>
                    <radialGradient id="centerGradient">
                      <stop offset="0%" stopColor="rgba(20, 20, 40, 1)" />
                      <stop offset="100%" stopColor="rgba(10, 10, 15, 1)" />
                    </radialGradient>
                  </defs>
                </svg>
              </motion.div>
            </div>

            {/* Spin Button */}
            <Button
              onClick={handleSpin}
              disabled={isSpinning || timeRemaining.total > 0}
              className="glow-primary bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-bold"
            >
              {isSpinning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="mr-2"
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                  SPINNING...
                </>
              ) : timeRemaining.total > 0 ? (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  WAITING FOR DRAW
                </>
              ) : (
                <>
                  <Target className="h-5 w-5 mr-2" />
                  SPIN THE WHEEL
                </>
              )}
            </Button>
          </div>

          {/* User Participation Panel */}
          <Card className="glass p-6 lg:col-span-1">
            {!userEntry ? (
              <div className="space-y-4">
                <h3 className="font-orbitron font-bold text-lg">Join the Lottery!</h3>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(Number.parseFloat(e.target.value) || 0)}
                      className="w-full bg-background/50 border border-border rounded-lg px-4 py-3 pr-12 font-mono text-lg"
                      placeholder="0.00"
                      max={userBalance}
                      step="0.01"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                      SOL
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {[0.1, 0.5, 1, 5, 10].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        size="sm"
                        onClick={() => setStakeAmount(amount)}
                        className="flex-1"
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Slider
                      value={[stakeAmount]}
                      onValueChange={([value]) => setStakeAmount(value)}
                      max={userBalance}
                      step={0.01}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 SOL</span>
                      <span>{userBalance} SOL</span>
                    </div>
                  </div>
                </div>

                <div className="glass p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-2">Your winning chance would be:</p>
                  <div className="text-2xl font-bold text-primary">{calculateChance(stakeAmount)}%</div>
                </div>

                <Button
                  onClick={handleEnterLottery}
                  disabled={stakeAmount <= 0 || stakeAmount > userBalance}
                  className="w-full glow-primary bg-primary hover:bg-primary/90 text-primary-foreground py-3"
                >
                  <Coins className="h-5 w-5 mr-2" />
                  Enter Lottery ({stakeAmount} SOL)
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
                  <h3 className="font-orbitron font-bold text-lg">You're In!</h3>
                </div>

                <div className="glass p-4 rounded-lg text-center">
                  <div className="text-sm text-muted-foreground mb-1">Ticket #{userEntry.ticketId}</div>
                  <div className="text-2xl font-bold">{userEntry.amount} SOL</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="glass p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Win Chance</div>
                    <div className="text-lg font-bold text-primary">{userEntry.percentage}%</div>
                  </div>
                  <div className="glass p-3 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Potential Win</div>
                    <div className="text-lg font-bold">{totalPool.toFixed(1)} SOL</div>
                  </div>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Increase Stake
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Previous Draws */}
        <Card className="glass p-6">
          <h3 className="font-orbitron font-bold text-lg mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Previous Draws
          </h3>

          <div className="space-y-3">
            {previousDraws.map((draw, index) => (
              <motion.div
                key={draw.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 glass rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Trophy className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-mono text-sm">{truncateWallet(draw.winner)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(draw.endedAt).toLocaleString()}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold">{draw.poolSize} SOL</div>
                  <div className="text-xs text-muted-foreground">{draw.participantCount} players</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass p-6 text-center">
            <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">1,247.8 SOL</div>
            <div className="text-sm text-muted-foreground">Total Distributed</div>
          </Card>

          <Card className="glass p-6 text-center">
            <Target className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">89.2 SOL</div>
            <div className="text-sm text-muted-foreground">Biggest Win</div>
          </Card>

          <Card className="glass p-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold">3,456</div>
            <div className="text-sm text-muted-foreground">Total Players</div>
          </Card>
        </div>
      </div>

      {/* Victory Modal */}
      <AnimatePresence>
        {showVictoryModal && winner && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass p-8 rounded-2xl max-w-md w-full text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 100,
              }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{
                  rotate: [0, 10, -10, 0],
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              >
                👑
              </motion.div>

              <h2 className="font-orbitron font-bold text-3xl mb-2 text-glow">WINNER!</h2>

              <p className="text-lg mb-4">{truncateWallet(winner.wallet)} wins!</p>

              <div className="text-4xl font-bold text-primary mb-6">{totalPool.toFixed(1)} SOL</div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Chance</div>
                  <div className="font-bold">{winner.percentage}%</div>
                </div>
                <div className="glass p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Multiplier</div>
                  <div className="font-bold text-primary">{(totalPool / winner.contribution).toFixed(2)}x</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button className="flex-1 glow-primary" onClick={() => setShowVictoryModal(false)}>
                  Next Round
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
