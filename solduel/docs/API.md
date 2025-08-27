# 📚 SolDuel API Documentation

## Table of Contents
- [Smart Contract APIs](#smart-contract-apis)
- [Frontend Hooks](#frontend-hooks)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)

## 🔗 Smart Contract APIs

### VDF Random Program

**Program ID**: `3vGQLeQwgQS44KBiTqEzooSrgrxiULqu1qrW5fwE6csY`

#### Instructions

##### `initializeRandom`
Initialize VDF randomness for a game.

```rust
pub fn initialize_random(
    ctx: Context<InitializeRandom>,
    game_id: [u8; 32],
    server_commitment: [u8; 32],
    difficulty: u64
) -> Result<()>
```

**Parameters:**
- `game_id`: Unique identifier for the game
- `server_commitment`: Server's random seed commitment
- `difficulty`: VDF computation difficulty

##### `submitVdf`
Submit VDF proof for randomness verification.

```rust
pub fn submit_vdf(
    ctx: Context<SubmitVdf>,
    proof: VdfProof
) -> Result<()>
```

### Game Core Program

**Program ID**: `Eh6yjDzBq3cSxkLLqWHQ8fWyQ9pA9kRKjTnCa7MbSKm2`

#### Strategic Duel Instructions

##### `initializeDuel`
Create a new strategic duel game.

```rust
pub fn initialize_duel(
    ctx: Context<InitializeDuel>,
    game_id: [u8; 32],
    initial_bet: u64,
    max_rounds: u8
) -> Result<()>
```

**Parameters:**
- `game_id`: Unique game identifier
- `initial_bet`: Starting bet amount in lamports
- `max_rounds`: Maximum number of betting rounds (default: 5)

##### `joinDuel`
Join an existing duel as player 2.

```rust
pub fn join_duel(
    ctx: Context<JoinDuel>
) -> Result<()>
```

##### `playerCheck`
Pass turn without betting.

```rust
pub fn player_check(
    ctx: Context<PlayerAction>
) -> Result<()>
```

##### `playerRaise`
Increase the current bet.

```rust
pub fn player_raise(
    ctx: Context<PlayerRaise>,
    amount: u64
) -> Result<()>
```

##### `playerCall`
Match the current bet.

```rust
pub fn player_call(
    ctx: Context<PlayerCall>
) -> Result<()>
```

##### `playerFold`
Exit game with 50% refund.

```rust
pub fn player_fold(
    ctx: Context<PlayerFold>
) -> Result<()>
```

##### `claimTimeout`
Claim victory if opponent times out (24 hours).

```rust
pub fn claim_timeout(
    ctx: Context<ClaimTimeout>
) -> Result<()>
```

## 🪝 Frontend Hooks

### useStrategicDuel

Primary hook for strategic duel gameplay.

```typescript
const {
  // State
  duelState,
  loading,
  error,
  
  // Actions
  initializeDuel,
  joinDuel,
  playerCheck,
  playerRaise,
  playerCall,
  playerFold,
  claimTimeout,
  fetchDuelState,
  
  // Helpers
  isMyTurn,
  getTotalPot,
  canClaimTimeout,
} = useStrategicDuel();
```

#### Methods

##### `initializeDuel(initialBet: number, maxRounds?: number)`
Create a new strategic duel.

**Parameters:**
- `initialBet`: Initial bet amount in SOL
- `maxRounds`: Maximum rounds (default: 5)

**Returns:** `Promise<string>` - Game ID

**Example:**
```typescript
const gameId = await initializeDuel(0.5, 5);
console.log(`Created game: ${gameId}`);
```

##### `joinDuel(gameId: string)`
Join an existing duel.

**Parameters:**
- `gameId`: Hex string game identifier

**Returns:** `Promise<void>`

##### `playerRaise(amount: number)`
Raise the bet.

**Parameters:**
- `amount`: Additional bet amount in SOL

**Returns:** `Promise<void>`

##### `isMyTurn(): boolean`
Check if it's the current player's turn.

**Returns:** `boolean`

##### `getTotalPot(): number`
Get total pot amount.

**Returns:** `number` - Total pot in SOL

### usePoolGame

Hook for pool game functionality.

```typescript
const {
  // Original functions
  initializeGame,
  joinGame,
  contribute,
  gameId,
  gameState,
  contributions,
  loading,
  winProbability,
  
  // Lobby compatibility
  pools,
  fetchPools,
  createPool,
  joinPool,
  isLoading
} = usePoolGame();
```

#### Methods

##### `initializeGame()`
Create a new pool game.

**Returns:** `Promise<void>`

##### `joinGame(gameId: string)`
Join an existing pool game.

**Parameters:**
- `gameId`: Game identifier

**Returns:** `Promise<void>`

##### `contribute(amount: number)`
Add SOL to the pool.

**Parameters:**
- `amount`: Contribution amount in SOL

**Returns:** `Promise<void>`

## 📦 Type Definitions

### Strategic Duel Types

```typescript
enum PlayerAction {
  Check = 'check',
  Raise = 'raise',
  Call = 'call',
  Fold = 'fold'
}

enum DuelState {
  WaitingForOpponent = 'waitingForOpponent',
  Active = 'active',
  WaitingForRandom = 'waitingForRandom',
  Completed = 'completed'
}

interface StrategicDuelState {
  gameId: string;
  players: [PublicKey | null, PublicKey | null];
  playerBets: [number, number];
  currentRound: number;
  maxRounds: number;
  currentBet: number;
  lastRaise: number;
  currentTurn: number;
  state: DuelState;
  winner: PublicKey | null;
  playerFolded: [boolean, boolean];
  lastActionTimestamp: number;
}
```

### Pool Game Types

```typescript
interface PoolGameState {
  gameId: string;
  players: Player[];
  currentPlayer: number;
  table: {
    balls: Ball[];
    pockets: Pocket[];
  };
  gamePhase: 'waiting' | 'playing' | 'ended';
  winner?: string;
  contributions: [number, number];
}

interface Ball {
  id: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  isPotted: boolean;
  type: 'cue' | 'solid' | 'stripe' | '8ball';
}

interface Player {
  address: string;
  score: number;
  ballType?: 'solid' | 'stripe';
}
```

## ⚠️ Error Handling

### Common Errors

#### `WalletNotConnected`
User's wallet is not connected.

**Solution:**
```typescript
if (!wallet.publicKey) {
  throw new Error('Please connect your wallet');
}
```

#### `InsufficientBalance`
User doesn't have enough SOL.

**Solution:**
```typescript
const balance = await connection.getBalance(wallet.publicKey);
if (balance < requiredAmount) {
  throw new Error('Insufficient SOL balance');
}
```

#### `GameNotFound`
Game with specified ID doesn't exist.

**Solution:**
```typescript
try {
  await fetchDuelState(gameId);
} catch (error) {
  if (error.message.includes('Account does not exist')) {
    throw new Error('Game not found');
  }
}
```

#### `NotYourTurn`
Player attempting action when not their turn.

**Solution:**
```typescript
if (!isMyTurn()) {
  throw new Error('Please wait for your turn');
}
```

#### `GameAlreadyStarted`
Attempting to join a game that's already full.

**Solution:**
```typescript
if (duelState.players[1]) {
  throw new Error('Game already has 2 players');
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}
```

### Handling Transaction Errors

```typescript
try {
  const tx = await program.methods
    .initializeDuel(gameId, betAmount, maxRounds)
    .accounts({...})
    .rpc();
  
  console.log('Transaction:', tx);
} catch (error) {
  if (error.code === 6000) {
    // Custom program error
    console.error('Program error:', error.msg);
  } else if (error.message.includes('insufficient')) {
    // Insufficient funds
    console.error('Not enough SOL');
  } else {
    // Unknown error
    console.error('Transaction failed:', error);
  }
}
```

## 🔐 Security Best Practices

1. **Always validate inputs** before sending transactions
2. **Check wallet connection** before any blockchain interaction
3. **Handle all errors gracefully** with user-friendly messages
4. **Never trust client-side data** - verify on-chain
5. **Use proper type checking** with TypeScript
6. **Implement timeout handling** for long-running operations
7. **Add transaction confirmation** for critical operations

## 📊 Rate Limits

- **RPC Calls**: 100 requests per second
- **Transaction Submission**: 5 per second per wallet
- **State Queries**: No limit (cached for 5 seconds)
- **WebSocket Connections**: 10 concurrent per client

## 🧪 Testing

### Test Endpoints (Devnet)

```typescript
const DEVNET_ENDPOINT = 'https://api.devnet.solana.com';
const CUSTOM_RPC = 'https://your-rpc-endpoint.com';
```

### Mock Data

```typescript
// Mock game state for testing
const mockDuelState: StrategicDuelState = {
  gameId: '1234567890abcdef',
  players: [new PublicKey('...'), null],
  playerBets: [0.5, 0],
  currentRound: 1,
  maxRounds: 5,
  currentBet: 0.5,
  lastRaise: 0,
  currentTurn: 0,
  state: DuelState.WaitingForOpponent,
  winner: null,
  playerFolded: [false, false],
  lastActionTimestamp: Date.now() / 1000
};
```

## 📚 Additional Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Anchor Framework Documentation](https://www.anchor-lang.com/)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [VDF Specification](https://eprint.iacr.org/2018/601.pdf)