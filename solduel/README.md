# 🎮 SolDuel - Decentralized PvP Gaming Platform

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://web-51pi1ho2u-lowkers-projects-d13a7f0b.vercel.app)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple)](https://solana.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## 🚀 Overview

SolDuel is a decentralized PvP gaming platform built on Solana with commit-reveal mechanics for fair gameplay. Features Rock Paper Scissors and Coin Flip games with cryptographic security.

### 🌟 Features

- **Zero Commission**: 100% of the pot goes to winners
- **Provably Fair**: VDF-based randomness ensures game integrity
- **Instant Payouts**: Winners receive SOL immediately via smart contracts
- **Multiple Game Modes**: Strategic duels, pool games, and hourly lotteries
- **Solana Integration**: Fast, cheap transactions on Solana blockchain

## 🎯 Game Modes

### 🎮 Strategic Duel
5-round psychological warfare with strategic betting mechanics:
- **CHECK**: Pass the turn without betting
- **RAISE**: Increase the bet amount
- **CALL**: Match the current bet
- **FOLD**: Exit with 50% refund

### 🎱 Pool Game (Coming Soon)
Realistic billiards with physics simulation:
- Progressive betting system
- Power and angle controls
- Winner takes all

### 🏆 Global Lottery
Hourly jackpot drawings:
- Buy tickets to increase chances
- Automatic winner selection via VDF
- Transparent prize distribution

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.5 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Wallet**: Solana Wallet Adapter
- **UI Components**: Radix UI + Custom components

### Smart Contracts
- **Framework**: Anchor 0.31.1
- **Language**: Rust
- **Programs**:
  - `vdf-random`: Verifiable randomness system
  - `game-core`: Game logic and escrow management

### Infrastructure
- **Blockchain**: Solana Devnet
- **Hosting**: Vercel
- **Package Manager**: pnpm (monorepo)

## 📦 Project Structure

```
solduel/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── app/                # App router pages
│       ├── components/         # React components
│       ├── hooks/             # Custom React hooks
│       ├── idl/               # Anchor IDL type definitions
│       └── lib/               # Utility functions
├── packages/
│   └── programs/              # Solana smart contracts
│       ├── game-core/         # Core game logic
│       └── vdf-random/        # VDF randomness
└── docs/                      # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- pnpm 10+
- Phantom wallet
- Solana CLI (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/solduel.git
cd solduel
```

2. Install dependencies:
```bash
pnpm install
```

3. Start development server:
```bash
cd apps/web
pnpm dev
```

4. Open http://localhost:3000

### Wallet Setup

1. Install [Phantom Wallet](https://phantom.app/)
2. Switch to Devnet network
3. Get test SOL from [Solana Faucet](https://faucet.solana.com)

## 📜 Smart Contract Addresses

### Devnet Deployment

| Contract | Address | Description |
|----------|---------|-------------|
| VDF Random | `3vGQLeQwgQS44KBiTqEzooSrgrxiULqu1qrW5fwE6csY` | Verifiable randomness |
| Game Core | `Eh6yjDzBq3cSxkLLqWHQ8fWyQ9pA9kRKjTnCa7MbSKm2` | Game logic & escrow |

## 🔧 Development

### Building

```bash
# Build frontend
cd apps/web
pnpm build

# Build smart contracts
cd packages/programs/game-core
anchor build
```

### Testing

```bash
# Test smart contracts
anchor test

# Run frontend in dev mode
pnpm dev
```

### Deployment

#### Frontend (Vercel)
```bash
vercel deploy --prod
```

#### Smart Contracts
```bash
anchor deploy --provider.cluster devnet
```

## 📡 API Reference

### Strategic Duel Hooks

#### `useStrategicDuel()`
Main hook for strategic duel gameplay.

**Returns:**
- `initializeDuel(bet: number, rounds: number)` - Create new duel
- `joinDuel(gameId: string)` - Join existing duel  
- `playerCheck()` - Pass turn without betting
- `playerRaise(amount: number)` - Increase bet
- `playerCall()` - Match current bet
- `playerFold()` - Exit with 50% refund
- `duelState` - Current game state
- `isMyTurn()` - Check if current player's turn

### Pool Game Hooks

#### `usePoolGame()` 
Hook for pool game functionality.

**Returns:**
- `initializeGame()` - Create new game
- `joinGame(gameId: string)` - Join game
- `contribute(amount: number)` - Add to pool
- `gameState` - Current game state
- `winProbability` - Win chance based on contributions

## 🔒 Security

- All game logic executed on-chain
- Escrow system for secure fund management
- VDF ensures unpredictable randomness
- No centralized control or admin keys
- Open source and auditable

## 📊 Game Economics

| Feature | Value |
|---------|-------|
| Platform Fee | 0% |
| Minimum Bet | 0.01 SOL |
| Maximum Bet | No limit |
| Fold Refund | 50% |
| Payout Speed | Instant |

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Solana Foundation for blockchain infrastructure
- Anchor Framework for smart contract development
- Next.js team for the amazing framework
- Community contributors and testers

## 📞 Contact & Support

- **Website**: [solduel.game](https://web-51pi1ho2u-lowkers-projects-d13a7f0b.vercel.app)
- **Twitter**: [@SolDuelGame](https://twitter.com/solduelgame)
- **Discord**: [Join our community](https://discord.gg/solduel)
- **Email**: support@solduel.game

## 🗺️ Roadmap

### Q1 2024
- [x] Strategic Duel implementation
- [x] VDF randomness integration
- [x] Devnet deployment
- [ ] Security audit

### Q2 2024
- [ ] Pool Game launch
- [ ] Global Lottery system
- [ ] Mobile app development
- [ ] Mainnet deployment

### Q3 2024
- [ ] Tournament mode
- [ ] NFT integration
- [ ] Governance token
- [ ] Cross-chain support

---

Built with ❤️ by the SolDuel team