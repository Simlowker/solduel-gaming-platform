"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Scissors, Users, Clock, Zap, Target, Brain, RotateCcw } from "lucide-react"

type Choice = "rock" | "paper" | "scissors"
type GameMode = "best_of_3" | "best_of_5" | "single"
type GamePhase = "waiting" | "selecting" | "revealing" | "round_complete" | "game_complete"

interface Player {
  id: string
  wallet: string
  avatar?: string
  winRate: number
  totalEarnings: number
  choice: Choice | null
  locked: boolean
}

interface Round {
  player1Choice: Choice | null
  player2Choice: Choice | null
  winner: string | null
  completed: boolean
}

interface RPSGame {
  gameId: string
  mode: GameMode
  currentRound: number
  maxRounds: number
  phase: GamePhase
  timeLimit: number
  timeRemaining: number
  player1: Player
  player2: Player | null
  rounds: Round[]
  scores: { player1: number; player2: number }
  winner: string | null
}

const choiceEmojis = {
  rock: "✊",
  paper: "✋",
  scissors: "✌️",
}

const choiceColors = {
  rock: "text-secondary",
  paper: "text-primary",
  scissors: "text-accent",
}

export function RPSArenaGame() {
  const [game, setGame] = useState<RPSGame>({
    gameId: "rps_001",
    mode: "best_of_3",
    currentRound: 1,
    maxRounds: 3,
    phase: "waiting",
    timeLimit: 10,
    timeRemaining: 10,
    player1: {
      id: "player1",
      wallet: "7xKX...9mNp",
      winRate: 74,
      totalEarnings: 32.1,
      choice: null,
      locked: false,
    },
    player2: null,
    rounds: [],
    scores: { player1: 0, player2: 0 },
    winner: null,
  })

  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null)
  const [showChoices, setShowChoices] = useState(false)
  const [roundResult, setRoundResult] = useState<string | null>(null)

  // Pattern analysis - track opponent's last choices
  const [opponentPattern, setOpponentPattern] = useState<Choice[]>([])
  const [patternHint, setPatternHint] = useState<string>("")

  const choices: Choice[] = ["rock", "paper", "scissors"]

  const joinGame = () => {
    setGame((prev) => ({
      ...prev,
      player2: {
        id: "player2",
        wallet: "You",
        winRate: 68,
        totalEarnings: 18.7,
        choice: null,
        locked: false,
      },
      phase: "selecting",
      rounds: Array(prev.maxRounds)
        .fill(null)
        .map(() => ({
          player1Choice: null,
          player2Choice: null,
          winner: null,
          completed: false,
        })),
    }))
    startTimer()
  }

  const startTimer = () => {
    setGame((prev) => ({ ...prev, timeRemaining: prev.timeLimit }))

    const timer = setInterval(() => {
      setGame((prev) => {
        if (prev.timeRemaining <= 1) {
          clearInterval(timer)
          // Auto-select random choice if time runs out
          if (!prev.player2?.locked) {
            const randomChoice = choices[Math.floor(Math.random() * choices.length)]
            makeChoice(randomChoice)
          }
          return { ...prev, timeRemaining: 0 }
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 }
      })
    }, 1000)
  }

  const makeChoice = (choice: Choice) => {
    setPlayerChoice(choice)
    setGame((prev) => ({
      ...prev,
      player2: prev.player2 ? { ...prev.player2, choice, locked: true } : null,
    }))

    // Simulate opponent choice after short delay
    setTimeout(() => {
      const opponentChoice = choices[Math.floor(Math.random() * choices.length)]
      setGame((prev) => ({
        ...prev,
        player1: { ...prev.player1, choice: opponentChoice, locked: true },
        phase: "revealing",
      }))

      // Add to pattern tracking
      setOpponentPattern((prev) => [...prev.slice(-4), opponentChoice])

      revealChoices(choice, opponentChoice)
    }, 1000)
  }

  const revealChoices = (playerChoice: Choice, opponentChoice: Choice) => {
    setShowChoices(true)

    setTimeout(() => {
      const winner = determineWinner(playerChoice, opponentChoice)
      setRoundResult(winner)

      setGame((prev) => {
        const newRounds = [...prev.rounds]
        newRounds[prev.currentRound - 1] = {
          player1Choice: opponentChoice,
          player2Choice: playerChoice,
          winner,
          completed: true,
        }

        const newScores = { ...prev.scores }
        if (winner === "player1") newScores.player1++
        if (winner === "player2") newScores.player2++

        const isGameComplete =
          newScores.player1 > prev.maxRounds / 2 ||
          newScores.player2 > prev.maxRounds / 2 ||
          prev.currentRound === prev.maxRounds

        return {
          ...prev,
          rounds: newRounds,
          scores: newScores,
          phase: isGameComplete ? "game_complete" : "round_complete",
          winner: isGameComplete
            ? newScores.player1 > newScores.player2
              ? "player1"
              : newScores.player2 > newScores.player1
                ? "player2"
                : "tie"
            : null,
        }
      })
    }, 2000)
  }

  const determineWinner = (choice1: Choice, choice2: Choice): string | null => {
    if (choice1 === choice2) return "tie"
    if (
      (choice1 === "rock" && choice2 === "scissors") ||
      (choice1 === "paper" && choice2 === "rock") ||
      (choice1 === "scissors" && choice2 === "paper")
    ) {
      return "player2"
    }
    return "player1"
  }

  const nextRound = () => {
    setGame((prev) => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      phase: "selecting",
      player1: { ...prev.player1, choice: null, locked: false },
      player2: prev.player2 ? { ...prev.player2, choice: null, locked: false } : null,
    }))
    setPlayerChoice(null)
    setShowChoices(false)
    setRoundResult(null)
    startTimer()
    generatePatternHint()
  }

  const generatePatternHint = () => {
    if (opponentPattern.length >= 3) {
      const lastThree = opponentPattern.slice(-3)
      const rockCount = lastThree.filter((c) => c === "rock").length
      const paperCount = lastThree.filter((c) => c === "paper").length
      const scissorsCount = lastThree.filter((c) => c === "scissors").length

      if (rockCount >= 2) setPatternHint("Opponent favors Rock - try Paper!")
      else if (paperCount >= 2) setPatternHint("Opponent favors Paper - try Scissors!")
      else if (scissorsCount >= 2) setPatternHint("Opponent favors Scissors - try Rock!")
      else setPatternHint("No clear pattern detected")
    }
  }

  const resetGame = () => {
    setGame((prev) => ({
      ...prev,
      currentRound: 1,
      phase: "waiting",
      player2: null,
      rounds: [],
      scores: { player1: 0, player2: 0 },
      winner: null,
      timeRemaining: prev.timeLimit,
    }))
    setPlayerChoice(null)
    setShowChoices(false)
    setRoundResult(null)
    setOpponentPattern([])
    setPatternHint("")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Scissors className="h-8 w-8 text-secondary" />
          <h1 className="font-orbitron font-bold text-3xl text-glow">RPS Arena</h1>
        </div>
        <p className="text-muted-foreground">Strategic rock-paper-scissors battles with mind games</p>

        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="font-orbitron font-bold text-xl text-primary">Round {game.currentRound}</div>
            <div className="text-sm text-muted-foreground">of {game.maxRounds}</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron font-bold text-xl text-secondary">{game.mode.replace("_", " ")}</div>
            <div className="text-sm text-muted-foreground">Game Mode</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron font-bold text-xl text-accent">0.5 SOL</div>
            <div className="text-sm text-muted-foreground">Entry Fee</div>
          </div>
        </div>
      </div>

      {/* Game Arena */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Player 1 */}
        <Card className="glass glow-secondary">
          <CardHeader className="text-center pb-4">
            <Avatar className="h-16 w-16 mx-auto mb-4">
              <AvatarFallback className="bg-secondary/20 text-secondary text-xl">P1</AvatarFallback>
            </Avatar>
            <CardTitle className="text-secondary">Opponent</CardTitle>
            <div className="text-2xl font-orbitron font-bold">{game.scores.player1}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            {game.player1 && (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="font-mono text-sm">{game.player1.wallet}</div>
                  <div className="text-xs text-muted-foreground">Win Rate: {game.player1.winRate}%</div>
                </div>

                <div className="text-center">
                  {game.phase === "selecting" && !game.player1.locked && (
                    <div className="text-muted-foreground animate-pulse">Choosing...</div>
                  )}
                  {game.player1.locked && !showChoices && <Badge variant="secondary">Locked In!</Badge>}
                  {showChoices && game.player1.choice && (
                    <div className="space-y-2">
                      <div className={`text-6xl ${choiceColors[game.player1.choice]}`}>
                        {choiceEmojis[game.player1.choice]}
                      </div>
                      <div className="font-orbitron font-bold capitalize">{game.player1.choice}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Battle Arena */}
        <Card className="glass">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {game.phase === "waiting" && (
                <div className="space-y-4">
                  <div className="text-muted-foreground">Choose your game mode</div>
                  <div className="space-y-2">
                    {[
                      { mode: "single" as GameMode, label: "Single Round", desc: "Quick battle" },
                      { mode: "best_of_3" as GameMode, label: "Best of 3", desc: "Classic match" },
                      { mode: "best_of_5" as GameMode, label: "Best of 5", desc: "Epic battle" },
                    ].map(({ mode, label, desc }) => (
                      <Button
                        key={mode}
                        variant={game.mode === mode ? "default" : "outline"}
                        onClick={() =>
                          setGame((prev) => ({
                            ...prev,
                            mode,
                            maxRounds: mode === "single" ? 1 : mode === "best_of_3" ? 3 : 5,
                          }))
                        }
                        className="w-full"
                      >
                        <div className="text-left">
                          <div>{label}</div>
                          <div className="text-xs text-muted-foreground">{desc}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <Button onClick={joinGame} className="glow-primary" size="lg">
                    <Zap className="h-4 w-4 mr-2" />
                    Enter Arena
                  </Button>
                </div>
              )}

              {game.phase === "selecting" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-orbitron font-bold text-xl">{game.timeRemaining}s</span>
                    </div>
                    <Progress value={(game.timeRemaining / game.timeLimit) * 100} className="h-2" />
                  </div>

                  <div className="text-muted-foreground">Make your choice!</div>

                  <div className="grid grid-cols-3 gap-4">
                    {choices.map((choice) => (
                      <Button
                        key={choice}
                        variant={playerChoice === choice ? "default" : "outline"}
                        onClick={() => makeChoice(choice)}
                        disabled={game.player2?.locked}
                        className="h-20 flex-col gap-2 hover:scale-105 transition-transform"
                      >
                        <div className={`text-3xl ${choiceColors[choice]}`}>{choiceEmojis[choice]}</div>
                        <div className="font-orbitron font-bold capitalize">{choice}</div>
                      </Button>
                    ))}
                  </div>

                  {patternHint && (
                    <div className="flex items-center gap-2 text-sm text-accent">
                      <Brain className="h-4 w-4" />
                      {patternHint}
                    </div>
                  )}
                </div>
              )}

              {game.phase === "revealing" && (
                <div className="space-y-4">
                  <div className="text-muted-foreground animate-pulse">Revealing choices...</div>
                  <div className="text-6xl">⚡</div>
                </div>
              )}

              {(game.phase === "round_complete" || game.phase === "game_complete") && (
                <div className="space-y-4">
                  <div
                    className={`font-orbitron font-bold text-2xl ${
                      roundResult === "player2"
                        ? "text-primary"
                        : roundResult === "player1"
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {roundResult === "player2" ? "YOU WIN!" : roundResult === "player1" ? "YOU LOSE!" : "TIE!"}
                  </div>

                  {game.phase === "game_complete" && (
                    <div
                      className={`font-orbitron font-bold text-xl ${
                        game.winner === "player2"
                          ? "text-primary"
                          : game.winner === "player1"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {game.winner === "player2"
                        ? "MATCH VICTORY!"
                        : game.winner === "player1"
                          ? "MATCH DEFEAT!"
                          : "MATCH TIED!"}
                    </div>
                  )}

                  <div className="flex gap-2 justify-center">
                    {game.phase === "round_complete" ? (
                      <Button onClick={nextRound} className="glow-primary">
                        Next Round
                      </Button>
                    ) : (
                      <>
                        <Button onClick={resetGame} variant="outline">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          New Game
                        </Button>
                        <Button onClick={resetGame} className="glow-primary">
                          Rematch
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Player 2 (You) */}
        <Card className="glass glow-accent">
          <CardHeader className="text-center pb-4">
            <Avatar className="h-16 w-16 mx-auto mb-4">
              <AvatarFallback className="bg-accent/20 text-accent text-xl">YOU</AvatarFallback>
            </Avatar>
            <CardTitle className="text-accent">You</CardTitle>
            <div className="text-2xl font-orbitron font-bold">{game.scores.player2}</div>
          </CardHeader>
          <CardContent className="space-y-4">
            {game.player2 ? (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="font-mono text-sm">{game.player2.wallet}</div>
                  <div className="text-xs text-muted-foreground">Win Rate: {game.player2.winRate}%</div>
                </div>

                <div className="text-center">
                  {game.phase === "selecting" && !game.player2.locked && (
                    <div className="text-muted-foreground animate-pulse">Your turn...</div>
                  )}
                  {game.player2.locked && !showChoices && (
                    <Badge variant="default" className="bg-accent">
                      Locked In!
                    </Badge>
                  )}
                  {showChoices && game.player2.choice && (
                    <div className="space-y-2">
                      <div className={`text-6xl ${choiceColors[game.player2.choice]}`}>
                        {choiceEmojis[game.player2.choice]}
                      </div>
                      <div className="font-orbitron font-bold capitalize">{game.player2.choice}</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>Join the arena!</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Round History */}
      {game.rounds.length > 0 && (
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Round History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {game.rounds.map((round, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">Round {index + 1}</div>
                  {round.completed ? (
                    <div className="space-y-1">
                      <div className="flex justify-center gap-4">
                        <div className={`text-2xl ${round.player1Choice ? choiceColors[round.player1Choice] : ""}`}>
                          {round.player1Choice ? choiceEmojis[round.player1Choice] : "?"}
                        </div>
                        <div className="text-muted-foreground">vs</div>
                        <div className={`text-2xl ${round.player2Choice ? choiceColors[round.player2Choice] : ""}`}>
                          {round.player2Choice ? choiceEmojis[round.player2Choice] : "?"}
                        </div>
                      </div>
                      <Badge
                        variant={
                          round.winner === "player2"
                            ? "default"
                            : round.winner === "player1"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {round.winner === "player2" ? "Win" : round.winner === "player1" ? "Loss" : "Tie"}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">-</div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
