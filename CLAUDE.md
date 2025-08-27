# CLAUDE.md

This file provides guidance to Claude (claude.ai) when working with this repository.

## Project Overview

SolDuel - Universal decentralized gaming platform on Solana supporting multiple PvP game modes with verifiable fairness, optimized for minimal rent costs and maximum security.

## Recent Optimizations (Production-Ready)

### ✅ Completed Improvements
1. **Account Size Optimization**: Reduced from ~11KB to ~8KB (27% reduction)
2. **Verifiable Random Function (VRF)**: Switchboard integration for true fairness
3. **Event Logging System**: 15 comprehensive event types
4. **Treasury Fee Collection**: Automatic platform fee management
5. **SPL Token Support**: Multi-token compatibility

```
solduel/
├── apps/
│   └── web/              # Next.js frontend with Solana integration
│       ├── app/          # App router pages and providers
│       ├── hooks/        # Custom React hooks for game interactions
│       └── idl/          # Generated TypeScript types from Anchor IDL
├── packages/
│   └── programs/         # Anchor/Rust smart contracts
│       └── universal-game/    # Universal smart contract supporting all game modes
└── supabase/            # Backend services (planned)
```

## Deployed Programs (Devnet)

- **universal-game**: `BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg` - Single universal contract for all game modes

## Smart Contract Architecture

### Game Modes Supported
1. **Simple Duel**: Rock-paper-scissors with commit-reveal mechanism
2. **Multi-round Duel**: Poker-style betting with check/call/raise/fold actions  
3. **Lottery**: Weighted ticket system with VRF-powered verifiable fairness

### Account Structures

#### ConfigurationAccount (PDA: seeds = ["config"])
Global settings managed by admin:
- `admin`: Pubkey - Administrator address
- `min_stake` / `max_stake`: u64 - Stake limits
- `max_rounds`: u8 - Max rounds for multi-round duels
- `fold_penalty`: u8 - Percentage (0-100) penalty for folding
- `randomness_method`: u8 - 0=commit-reveal, 1=VRF, 2=VDF
- `platform_fee`: u8 - Platform commission percentage  
- `item_prices`: Vec<u64> #[max_len(MAX_ITEMS)] - Prices for bonus items
- `timeout`: u64 - Seconds before inactive games can be force-finished
- `ticket_conversion`: u64 - Tickets per stake unit for lottery
- `game_counter`: u64 - Unique game ID generator

#### GameAccount (PDA: seeds = ["game", creator, game_type, game_id])
Per-game state:
- `game_id`: u64 - Unique identifier
- `game_type`: u8 - 0=simple duel, 1=multi-round, 2=lottery
- `state`: u8 - 0=waiting, 1=active, 2=resolving, 3=completed, 4=cancelled
- `players`: Vec<Pubkey> #[max_len(MAX_PLAYERS)]
- `stakes`: Vec<u64> #[max_len(MAX_PLAYERS)] - Player stakes
- `pot_total`: u64 - Total pot in escrow
- `round`: u8 - Current round number
- `commit_hashes`: Vec<[u8; 32]> #[max_len(MAX_PLAYERS)] - Move commitments
- `reveals`: Vec<(u8, [u8; 32])> #[max_len(MAX_PLAYERS)] - Revealed choices
- `action_history`: Vec<u8> #[max_len(MAX_ACTIONS)] - Betting actions
- `winner`: Option<Pubkey> - Winner address when resolved
- `random_result`: Option<[u8; 32]> - VRF/VDF result
- `start_time`: i64 - Game creation timestamp
- `end_time`: Option<i64> - Resolution timestamp

#### PlayerAccount (Optional - PDA: seeds = ["player", owner])
Player statistics:
- `owner`: Pubkey
- `wins` / `losses`: u32
- `total_staked`: u64

### Instructions

#### Game Lifecycle
- `create_game(game_type, params)` - Initialize new game
- `join_game(amount)` / `enter_lottery(amount)` - Enter with stake
- `cancel_game()` - Cancel and refund if conditions not met

#### Gameplay Actions
- `commit_move(hash)` - Submit hashed choice (duels)
- `reveal_move(choice, secret)` - Reveal committed choice
- `place_bet(action, amount)` - Check/call/raise/fold (multi-round)
- `purchase_item(item_id)` - Buy bonus items

#### Resolution
- `resolve_game()` / `draw_lottery()` - Determine winner and distribute
- `force_finish()` - Apply timeout penalty after inactivity
- `withdraw()` - Claim winnings if not auto-distributed

### Security & Constraints

- All Vec fields use `#[max_len(N)]` for fixed size allocation
- PDAs ensure unique accounts and program ownership
- Escrow through Associated Token Accounts (ATA)
- Admin-only instructions for configuration updates
- Signature verification for all state modifications
- Timeout mechanism prevents indefinite locks

### Constants (Configurable)
```rust
const MAX_PLAYERS: usize = 100;  // 2 for duels, up to 100 for lottery
const MAX_ACTIONS: usize = 50;   // Max betting actions per game
const MAX_ITEMS: usize = 10;     // Max purchasable items
```

## Tech Stack

### Smart Contracts
- **Framework**: Anchor 0.31.1
- **Language**: Rust
- **VRF**: Switchboard 0.30.4
- **Serialization**: Borsh 0.10
- **Token Support**: SPL Token 6.0, Associated Token Account 5.0
- **Utilities**: Bytemuck, Arrayref, Num-traits

### Frontend
- **Framework**: Next.js 15.5
- **Runtime**: React 19
- **Language**: TypeScript
- **Blockchain**: Solana Web3.js, Wallet Adapter
- **Styling**: Tailwind CSS, shadcn/ui
- **Build**: Turbo, pnpm workspaces

## Quick Start

```bash
# Frontend development
cd solduel/apps/web
pnpm dev  # Runs on http://localhost:3000 or 3001

# Deploy smart contract
cd solduel/packages/programs/universal-game
anchor build
anchor deploy
```

## Development Notes

- **IDL (Interface Definition Language)**: Anchor generates an IDL JSON file after building the smart contract. This file describes all accounts, instructions, and types. The frontend uses this IDL to:
  - Generate TypeScript types for type-safe interactions
  - Know how to serialize/deserialize data for the program
  - Create proper instruction calls with correct account layouts
- Run `anchor build` to generate `target/idl/universal_game.json`
- Copy IDL to frontend: `cp target/idl/universal_game.json apps/web/idl/`
- Wallet configured for devnet at ~/.config/solana/devnet-keypair.json
- Use commit-reveal for simple randomness, VDF for verifiable fairness
- All game modes share the same universal smart contract