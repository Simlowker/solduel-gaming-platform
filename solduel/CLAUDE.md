# CLAUDE.md

This file provides guidance to Claude (claude.ai) when working with this repository.

## Project Structure

SolDuel - Universal decentralized gaming platform on Solana supporting multiple PvP game modes with verifiable fairness.

```
solduel/                     # Root = Next.js app (for easy Vercel deployment)
├── app/                     # Next.js app router pages
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   └── games/               # Game-specific components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and SDK
│   └── solduel-sdk.ts       # TypeScript SDK for smart contract interaction
├── idl/                     # Anchor IDL files
│   └── universal_game.json  # Generated from smart contract
├── public/                  # Static assets
├── contracts/               # Anchor smart contracts
│   ├── programs/
│   │   └── universal-game/  # Main program
│   ├── target/              # Build artifacts
│   ├── Anchor.toml          # Anchor configuration
│   └── Cargo.toml           # Rust dependencies
├── package.json             # Next.js dependencies
├── next.config.mjs          # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
└── vercel.json              # Vercel deployment configuration
```

## Deployed Program (Devnet)

- **universal-game**: `BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg`

## Smart Contract Architecture

### Game Modes Supported
1. **Simple Duel**: Rock-paper-scissors with commit-reveal mechanism
2. **Multi-round Duel**: Poker-style betting with check/call/raise/fold actions  
3. **Lottery**: Weighted ticket system with proportional winning odds

### Account Structures

#### ConfigurationAccount (PDA: seeds = ["config"])
Global settings managed by admin:
- `admin`: Pubkey - Administrator address
- `treasury`: Platform fee collection address
- `min_stake` / `max_stake`: u64 - Stake limits
- `max_rounds`: u8 - Max rounds for multi-round duels
- `fold_penalty`: u8 - Percentage (0-100) penalty for folding
- `randomness_method`: u8 - 0=commit-reveal, 1=VRF, 2=VDF
- `platform_fee`: u8 - Platform commission percentage  
- `timeout`: u64 - Seconds before inactive games can be force-finished
- `ticket_conversion`: u64 - Tickets per stake unit for lottery
- `game_counter`: u64 - Unique game ID generator

#### GameAccount (PDA: seeds = ["game", creator, game_id])
Per-game state:
- `game_id`: u64 - Unique identifier
- `game_type`: u8 - 0=simple duel, 1=multi-round, 2=lottery
- `state`: u8 - 0=waiting, 1=active, 2=resolving, 3=completed, 4=cancelled
- `players`: Vec<Pubkey> - Player addresses
- `stakes`: Vec<u64> - Player stakes
- `pot_total`: u64 - Total pot in escrow
- `current_round`: u8 - Current round number
- `commit_hashes`: Vec<[u8; 32]> - Move commitments
- `reveals`: Vec<(u8, [u8; 32])> - Revealed choices
- `action_history`: Vec<u8> - Betting actions
- `winner`: Option<Pubkey> - Winner address when resolved
- `start_time`: i64 - Game creation timestamp
- `end_time`: Option<i64> - Resolution timestamp

#### PlayerAccount (PDA: seeds = ["player", owner])
Player statistics:
- `owner`: Pubkey
- `games_played` / `wins` / `losses`: u32
- `total_staked` / `total_won`: u64

### Instructions

#### Game Lifecycle
- `create_game(game_type, params)` - Initialize new game
- `join_game(amount)` / `enter_lottery(amount)` - Enter with stake
- `cancel_game()` - Cancel and refund if conditions not met

#### Gameplay Actions
- `commit_move(hash)` - Submit hashed choice (duels)
- `reveal_move(choice, secret)` - Reveal committed choice
- `place_bet(action, amount)` - Check/call/raise/fold (multi-round)

#### Resolution
- `resolve_game()` / `draw_lottery()` - Determine winner and distribute
- `force_finish()` - Apply timeout penalty after inactivity
- `claim_winnings()` - Claim winnings if not auto-distributed

### Security & Constraints

- All Vec fields use fixed size allocation
- PDAs ensure unique accounts and program ownership
- Escrow through program-owned vaults
- Admin-only instructions for configuration updates
- Signature verification for all state modifications
- Timeout mechanism prevents indefinite locks

## Tech Stack

- **Smart Contracts**: Anchor 0.31.1, Rust
- **Frontend**: Next.js 15.2, React 19, TypeScript
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **Styling**: Tailwind CSS, shadcn/ui
- **Animations**: Framer Motion

## Quick Start

### Frontend (Next.js)
```bash
# Install dependencies
npm install

# Run development server
npm run dev  # Runs on http://localhost:3000

# Build for production
npm run build
```

### Smart Contracts
```bash
# Navigate to contracts
cd contracts

# Build contracts
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

## Environment Variables

Create `.env.local` file:
```env
NEXT_PUBLIC_PROGRAM_ID=BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

## Development Notes

- **Configuration**: Click "Initialize Config" button on homepage (admin only, do once)
- **Wallet**: Configure wallet for devnet at ~/.config/solana/devnet-keypair.json
- **Airdrop**: Use `solana airdrop 2 --url devnet` to get test SOL
- **IDL**: After contract changes, copy IDL: `cp contracts/target/idl/universal_game.json idl/`
- **Deployment**: Push to GitHub, Vercel auto-deploys from master branch

## Testing Multiplayer

1. Deploy to Vercel (automatic from GitHub)
2. Share link with other players
3. All players need:
   - Phantom/Solflare wallet on Devnet
   - Test SOL from faucet
   - Click "Initialize Config" once (admin only)
4. Create and join games!