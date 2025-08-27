# CLAUDE.md

This file provides guidance to Claude (claude.ai) when working with this repository.

## Project Structure

SolDuel - Universal decentralized gaming platform on Solana with a single smart contract supporting all PvP game modes with verifiable fairness.

```
solduel/
├── programs/
│   └── universal-game/          # Universal Anchor smart contract
│       ├── Anchor.toml          # Anchor configuration
│       ├── Cargo.toml           # Rust dependencies
│       └── src/
│           ├── lib.rs           # Main program entry point
│           ├── instructions/    # Modular instruction handlers
│           │   ├── admin.rs     # Admin configuration
│           │   ├── game_lifecycle.rs  # Create/join/cancel games
│           │   ├── simple_duel.rs      # Rock-paper-scissors, coin flip
│           │   ├── multi_round.rs      # Poker-style betting
│           │   └── lottery.rs          # Pool-based lottery
│           ├── state/           # Account structures
│           │   ├── config.rs    # Global configuration
│           │   ├── game.rs      # Game state
│           │   └── player.rs    # Player statistics
│           ├── errors.rs        # Error codes
│           └── constants.rs     # Constants and limits
├── app/                         # Next.js frontend
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   ├── hooks/              # Custom React hooks
│   │   └── lib/                
│   │       └── solduel-sdk.ts  # TypeScript SDK for contract interaction
│   └── idl/
│       └── universal_game.json # Generated IDL from Anchor
└── tests/                       # Integration tests
```

## Deployed Program (Devnet)

- **universal-game**: `BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg`

## Smart Contract Architecture

### Single Universal Contract
One smart contract handles all game types through a modular instruction system:

1. **Simple Duels**: Rock-paper-scissors, coin flip with commit-reveal
2. **Multi-round Games**: Poker-style betting with check/call/raise/fold
3. **Lottery**: Weighted ticket system with proportional odds

### Account Structures

#### ConfigurationAccount (PDA: seeds = ["config"])
Global settings managed by admin:
- `admin`: Administrator address
- `treasury`: Platform fee collection address
- `min_stake` / `max_stake`: Betting limits
- `max_rounds`: Maximum rounds for multi-round games
- `fold_penalty`: Percentage penalty for folding
- `randomness_method`: 0=commit-reveal, 1=VRF, 2=VDF
- `platform_fee`: Platform commission percentage (0-100)
- `timeout`: Seconds before games can be force-finished
- `ticket_conversion`: Lottery tickets per stake unit
- `game_counter`: Unique game ID generator

#### GameAccount (PDA: seeds = ["game", creator, game_id])
Per-game state tracking:
- `game_id`: Unique identifier
- `game_type`: SimpleDuel, MultiRound, or Lottery
- `state`: Waiting, Active, Resolving, Completed, Cancelled
- `players`: List of participants (max 2 for duels, 100 for lottery)
- `stakes`: Individual player stakes
- `pot_total`: Total pot in escrow
- `current_round` / `max_rounds`: Round tracking
- `commit_hashes`: Hashed moves for commit-reveal
- `reveals`: Revealed player moves
- `action_history`: Betting action sequence
- `winner`: Winner address when determined
- `start_time` / `end_time`: Timestamps

#### PlayerAccount (PDA: seeds = ["player", owner])
Optional player statistics:
- `owner`: Player's wallet address
- `games_played`, `wins`, `losses`, `draws`: Game history
- `total_staked`, `total_won`: Financial history
- `win_streak`, `best_streak`: Performance metrics

### Key Instructions

#### Admin
- `initialize_config()` - One-time setup
- `update_config()` - Modify game parameters

#### Game Lifecycle
- `create_game(type, stake, max_players)` - Start any game type
- `join_game()` - Enter existing game
- `cancel_game()` - Creator cancels waiting game
- `force_finish()` - Apply timeout penalty

#### Gameplay
- `commit_move(hash)` - Submit hashed choice
- `reveal_move(move, nonce)` - Reveal committed choice
- `place_bet(action, amount)` - Betting for multi-round
- `enter_lottery(tickets)` - Buy lottery tickets
- `draw_lottery()` - Trigger lottery drawing

#### Resolution
- `resolve_game()` - Compute final winner
- `claim_winnings()` - Withdraw won funds

### Security Features

- All accounts use PDAs for program ownership
- Fixed-size allocations with `#[max_len]` constraints
- Escrow mechanism for safe fund handling
- Commit-reveal prevents cheating in duels
- Timeout mechanism prevents indefinite locks
- Admin-only configuration updates

## Frontend SDK

TypeScript SDK (`app/lib/solduel-sdk.ts`) provides:
- Type-safe contract interactions
- Automatic PDA derivation
- Game state management
- Player statistics tracking
- Move commitment/reveal helpers

## Tech Stack

- **Smart Contract**: Anchor 0.30.1, Rust
- **Frontend**: Next.js 15.5, React 19, TypeScript
- **Blockchain**: Solana Web3.js 1.95, Wallet Adapter
- **Styling**: Tailwind CSS
- **Build**: pnpm

## Quick Start

```bash
# Build and deploy contract
cd programs/universal-game
anchor build
anchor deploy

# Run frontend
cd app
pnpm install
pnpm dev  # http://localhost:3000
```

## Development Workflow

1. **Contract Development**:
   ```bash
   cd programs/universal-game
   anchor build
   anchor test
   anchor deploy --provider.cluster devnet
   ```

2. **Generate IDL**:
   ```bash
   anchor build
   cp target/idl/universal_game.json app/idl/
   ```

3. **Frontend Integration**:
   - Import SDK: `import SolDuelSDK from '@/lib/solduel-sdk'`
   - Initialize with wallet connection
   - Use typed methods for all contract interactions

## Testing

- Unit tests in `programs/universal-game/tests/`
- Integration tests use Anchor's testing framework
- Frontend testing with Jest/React Testing Library