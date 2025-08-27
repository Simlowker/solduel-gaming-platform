# CLAUDE.md

This file provides guidance to Claude (claude.ai) when working with this repository.

## Project Overview

SolDuel - Universal decentralized gaming platform on Solana supporting multiple PvP game modes with verifiable fairness, optimized for minimal rent costs and maximum security.

## Recent Optimizations (Production-Ready)

### ✅ Completed Improvements
1. **Account Size Optimization**: Reduced from ~11KB to ~8KB (27% reduction)
   - Fixed arrays instead of Vec for better rent efficiency
   - Bit-packed game state and type into single byte
   - Packed timestamps into single u64
   
2. **Verifiable Random Function (VRF)**: Switchboard integration for true fairness
   - Full VRF and VRF Lite support
   - Verifiable lottery winner selection
   - Fallback deterministic randomness
   
3. **Event Logging System**: 15 comprehensive event types
   - Game lifecycle tracking
   - Player actions monitoring
   - Financial transparency
   
4. **Treasury Fee Collection**: Automatic platform fee management
   - Secure PDA-based transfers
   - Batch refund functionality
   - Penalty system for timeouts
   
5. **SPL Token Support**: Multi-token compatibility
   - Native SOL and SPL tokens
   - Associated Token Accounts
   - Token vaults with escrow

## Project Structure

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
│   │       └── src/
│   │           ├── state/
│   │           │   ├── game_optimized.rs  # Optimized account structure
│   │           │   └── ...
│   │           ├── events.rs              # Event definitions
│   │           ├── vrf.rs                 # VRF integration
│   │           ├── token.rs               # SPL token support
│   │           └── instructions/
│   │               └── treasury.rs        # Fee collection
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

- **universal-game**: `Cg8sF2yCkfStCqCViq676zXzRBqr7XRmyJtvLweNAh9x` (Updated: 2025-08-27)

## Smart Contract Architecture

### Game Modes Supported
1. **Simple Duel**: Rock-paper-scissors with commit-reveal mechanism
2. **Multi-round Duel**: Poker-style betting with check/call/raise/fold actions  
3. **Lottery**: Weighted ticket system with proportional winning odds + VRF fairness

### Account Structures (Optimized)

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

#### GameAccountOptimized (PDA: seeds = ["game", creator, game_id])
Optimized per-game state with fixed arrays:
- `game_id`: u64 - Unique identifier
- `game_type_and_state`: u8 - Bit-packed type and state
- `creator`: Pubkey - Game creator
- `player_count`: u8 - Active player count
- `players`: [Pubkey; 100] - Fixed array of players
- `stakes`: [u64; 100] - Fixed array of stakes
- `pot_total`: u64 - Total pot in escrow
- `rounds`: u8 - Packed current/max rounds
- `commit_hashes`: [[u8; 32]; 100] - Fixed commit array
- `reveals_packed`: [u8; 100] - Packed reveals
- `action_history_packed`: [u8; 50] - Packed betting history
- `winner`: Option<Pubkey> - Winner address
- `vrf_result`: [u8; 32] - VRF randomness result
- `timestamps`: u64 - Packed start/last_action times
- `platform_fee_collected`: u64 - Fee amount collected
- `treasury`: Pubkey - Treasury for fees
- `flags`: u8 - Bit-packed boolean states

#### PlayerAccount (PDA: seeds = ["player", owner])
Player statistics:
- `owner`: Pubkey
- `games_played` / `wins` / `losses`: u32
- `total_staked` / `total_won`: u64

#### TokenConfig (For SPL token games)
- `accepted_mint`: Pubkey - Token mint address
- `is_native_sol`: bool - SOL vs SPL token
- `min_stake` / `max_stake`: u64 - Token limits
- `decimals`: u8 - Token decimals

### Instructions

#### Game Lifecycle
- `create_game(game_type, params)` - Initialize new game
- `create_token_game(game_type, stake)` - Create with SPL tokens
- `join_game(amount)` / `enter_lottery(amount)` - Enter with stake
- `join_token_game()` - Join with SPL tokens
- `cancel_game()` - Cancel and refund if conditions not met

#### Gameplay Actions
- `commit_move(hash)` - Submit hashed choice (duels)
- `reveal_move(choice, secret)` - Reveal committed choice
- `place_bet(action, amount)` - Check/call/raise/fold (multi-round)

#### Resolution & Distribution
- `resolve_game()` / `draw_lottery()` - Determine winner
- `distribute_winnings_with_fees()` - Auto fee collection
- `distribute_token_winnings()` - SPL token distribution
- `force_finish()` - Apply timeout penalty
- `claim_winnings()` - Claim winnings if not auto-distributed
- `batch_refund_all_players()` - Refund cancelled games

#### VRF Operations
- `request_randomness()` - Request Switchboard VRF
- `request_randomness_lite()` - Cheaper VRF option
- `consume_randomness()` - Process VRF result

### Events Emitted

- `GameCreated` - New game initialized
- `PlayerJoined` - Player enters game
- `GameStateChanged` - State transitions
- `MoveCommitted` / `MoveRevealed` - Player actions
- `BetPlaced` - Betting actions
- `LotteryEntered` / `LotteryDrawn` - Lottery events
- `GameResolved` - Game completion
- `WinningsClaimed` - Payout events
- `FeesCollected` - Treasury fees
- `VrfRequested` / `VrfFulfilled` - VRF events
- `PlayerTimedOut` - Timeout penalties
- `GameCancelled` - Cancellation events

### Security & Constraints

- Fixed size arrays for predictable rent costs
- PDAs ensure unique accounts and program ownership
- Escrow through program-owned vaults + token accounts
- Admin-only instructions for configuration updates
- Signature verification for all state modifications
- Timeout mechanism prevents indefinite locks
- VRF integration for verifiable fairness
- Automatic fee collection to treasury
- Event logging for complete audit trail

## Tech Stack

### Smart Contracts
- **Framework**: Anchor 0.31.1
- **Language**: Rust
- **VRF**: Switchboard 0.30.4
- **Serialization**: Borsh 0.10
- **Token Support**: SPL Token 6.0, Associated Token Account 5.0
- **Utilities**: Bytemuck, Arrayref, Num-traits

### Frontend
- **Framework**: Next.js 15.2
- **Runtime**: React 19
- **Language**: TypeScript
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

# Build contracts (with optimizations)
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests
anchor test
```

## Environment Variables

Create `.env.local` file:
```env
NEXT_PUBLIC_PROGRAM_ID=Cg8sF2yCkfStCqCViq676zXzRBqr7XRmyJtvLweNAh9x
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SWITCHBOARD_QUEUE=<VRF_QUEUE_PUBKEY>
```

## Development Notes

### Configuration
- Click "Initialize Config" button on homepage (admin only, do once)
- Treasury address must be set for fee collection
- VRF queue must be initialized for lottery games

### Testing
- **Wallet**: Configure for devnet at ~/.config/solana/devnet-keypair.json
- **Airdrop**: Use `solana airdrop 2 --url devnet` to get test SOL
- **SPL Tokens**: Create test tokens with `spl-token create-token`

### Building & Deployment
- **IDL Generation**: After contract changes, copy IDL: `cp contracts/target/idl/universal_game.json idl/`
- **TypeScript Types**: Generate with `anchor idl generate`
- **Vercel Deploy**: Push to GitHub, auto-deploys from master branch

### Performance Optimizations
- Account size reduced by 27% through bit-packing
- Fixed arrays eliminate dynamic allocation overhead
- Event logging replaces expensive on-chain storage
- VRF calls batched for efficiency

### Security Considerations
- All player funds held in escrow until game resolution
- VRF ensures lottery fairness (no manipulation possible)
- Treasury fees automatically collected (no manual intervention)
- Timeout mechanism prevents griefing
- All actions emit events for transparency

## Testing Multiplayer

1. Deploy to Vercel (automatic from GitHub)
2. Share link with other players
3. All players need:
   - Phantom/Solflare wallet on Devnet
   - Test SOL from faucet
   - Test SPL tokens (optional)
4. Admin initializes config once
5. Create and join games!

## Production Checklist

- [ ] Audit smart contract code
- [ ] Test VRF integration thoroughly
- [ ] Verify treasury fee collection
- [ ] Load test with 100 players
- [ ] Security audit by third party
- [ ] Mainnet deployment plan
- [ ] Rate limiting for RPC calls
- [ ] Error monitoring setup