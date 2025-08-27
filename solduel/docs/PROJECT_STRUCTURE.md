# 🏗️ SolDuel Project Structure

## Overview

SolDuel is organized as a monorepo using pnpm workspaces, with separate packages for the frontend application and smart contracts.

```
solduel/
├── apps/                        # Application packages
│   └── web/                    # Next.js frontend
├── packages/                   # Shared packages
│   └── programs/              # Solana smart contracts
├── docs/                      # Documentation
├── pnpm-workspace.yaml        # Workspace configuration
├── pnpm-lock.yaml            # Dependency lock file
├── turbo.json                # Turborepo configuration
└── README.md                 # Project documentation
```

## 📱 Frontend Application (`apps/web`)

### Directory Structure

```
apps/web/
├── app/                       # Next.js App Router
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Homepage (game selection)
│   ├── providers.tsx         # React context providers
│   ├── globals.css           # Global styles
│   ├── lobby/               # Game lobby
│   │   └── page.tsx
│   ├── lottery/             # Lottery game
│   │   └── page.tsx
│   ├── pool-game/           # Pool game (coming soon)
│   │   └── page.tsx
│   ├── profile/             # User profile
│   │   └── page.tsx
│   └── strategic-duel/      # Strategic duel game
│       └── page.tsx
├── components/              # React components
│   ├── ui/                 # UI primitives
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   └── slider.tsx
│   ├── countdown-timer.tsx # Countdown component
│   ├── ErrorBoundary.tsx   # Error boundary wrapper
│   ├── PoolTable.tsx       # Pool game table
│   ├── Toast.tsx           # Toast notifications
│   ├── wallet-button.tsx   # Wallet connection
│   └── WalletButton.tsx    # Legacy wallet button
├── hooks/                   # Custom React hooks
│   ├── usePoolGame.ts      # Pool game logic
│   ├── useStrategicDuel.ts # Strategic duel logic
│   └── useToast.ts         # Toast notifications
├── idl/                     # Anchor IDL files
│   ├── game_core.json      # Game core IDL
│   ├── game_core.ts        # Game core types
│   ├── game_core_complete.ts
│   ├── vdf_random.json     # VDF random IDL
│   ├── vdf_random.ts       # VDF random types
│   └── vdf_random_complete.ts
├── lib/                     # Utility functions
│   ├── pool-physics.ts     # Pool physics engine
│   └── utils.ts            # General utilities
├── types/                   # TypeScript types
│   └── pool-game.ts        # Pool game types
├── public/                  # Static assets
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Package dependencies
```

### Key Files

#### `app/layout.tsx`
Root layout component that wraps all pages.

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

#### `app/providers.tsx`
Provides wallet connection and other context to the app.

```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
```

#### `hooks/useStrategicDuel.ts`
Main hook for strategic duel game logic.

Key functions:
- `initializeDuel()` - Create new game
- `joinDuel()` - Join existing game
- `playerCheck/Raise/Call/Fold()` - Player actions
- `fetchDuelState()` - Get game state

#### `hooks/usePoolGame.ts`
Hook for pool game functionality.

Key functions:
- `initializeGame()` - Create new pool game
- `joinGame()` - Join pool game
- `contribute()` - Add to prize pool
- `fetchGameState()` - Get current state

## ⚙️ Smart Contracts (`packages/programs`)

### Directory Structure

```
packages/programs/
├── game-core/               # Core game logic
│   ├── programs/
│   │   └── game-core/
│   │       └── src/
│   │           ├── lib.rs   # Main program logic
│   │           └── state.rs # State structures
│   ├── target/              # Build artifacts
│   │   ├── deploy/          # Deployed keypairs
│   │   ├── idl/            # Generated IDL
│   │   └── types/          # TypeScript types
│   ├── tests/              # Integration tests
│   │   └── game-core.ts
│   ├── migrations/         # Deploy scripts
│   ├── Anchor.toml        # Anchor configuration
│   ├── Cargo.toml         # Rust dependencies
│   └── package.json       # Node dependencies
└── vdf-random/             # VDF randomness
    ├── programs/
    │   └── vdf-random/
    │       └── src/
    │           └── lib.rs  # VDF implementation
    ├── target/             # Build artifacts
    ├── tests/              # Integration tests
    ├── Anchor.toml        # Anchor configuration
    └── Cargo.toml         # Rust dependencies
```

### Smart Contract Architecture

#### Game Core (`game-core`)
Handles all game logic including:
- Strategic duel mechanics
- Pool game rules (planned)
- Escrow management
- Winner determination
- Payout distribution

Key Instructions:
- `initialize_duel` - Create new strategic duel
- `join_duel` - Player 2 joins
- `player_check/raise/call/fold` - Game actions
- `claim_timeout` - Handle inactive players

#### VDF Random (`vdf-random`)
Provides verifiable randomness:
- VDF proof generation
- Commitment scheme
- Random number generation
- Fairness verification

Key Instructions:
- `initialize_random` - Setup VDF for game
- `submit_vdf` - Submit proof
- `verify_and_reveal` - Verify and get random

## 🔧 Configuration Files

### `pnpm-workspace.yaml`
Defines workspace packages:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### `turbo.json`
Turborepo build configuration:
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false
    }
  }
}
```

### `next.config.ts`
Next.js configuration:
```typescript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    turbo: {}
  }
}
```

### `tailwind.config.ts`
Tailwind CSS configuration with custom Solana colors:
```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        'solana-green': '#14f195',
      }
    }
  }
}
```

## 📦 Dependencies

### Frontend Dependencies

#### Core
- `next`: 15.5.0 - React framework
- `react`: 19.1.0 - UI library
- `react-dom`: 19.1.0 - DOM rendering
- `typescript`: ^5 - Type safety

#### Solana
- `@solana/web3.js`: ^1.98.4 - Solana SDK
- `@solana/wallet-adapter-*`: Wallet connection
- `@coral-xyz/anchor`: ^0.31.1 - Smart contract framework

#### UI
- `tailwindcss`: ^4 - Utility CSS
- `@radix-ui/*`: UI primitives
- `lucide-react`: Icons
- `clsx`: Class names utility
- `tailwind-merge`: Merge Tailwind classes

### Smart Contract Dependencies

#### Rust/Anchor
- `anchor-lang`: 0.31.1 - Anchor framework
- `anchor-spl`: 0.31.1 - SPL token support
- `solana-program`: 2.0.17 - Solana runtime

## 🚀 Build & Deploy

### Development Workflow

1. **Install Dependencies**
```bash
pnpm install
```

2. **Start Dev Server**
```bash
cd apps/web
pnpm dev
```

3. **Build Frontend**
```bash
pnpm build
```

4. **Deploy to Vercel**
```bash
vercel deploy --prod
```

### Smart Contract Workflow

1. **Build Contracts**
```bash
cd packages/programs/game-core
anchor build
```

2. **Run Tests**
```bash
anchor test
```

3. **Deploy to Devnet**
```bash
anchor deploy --provider.cluster devnet
```

4. **Generate IDL**
```bash
anchor idl init -f target/idl/game_core.json
```

## 🔍 Code Standards

### TypeScript
- Strict mode enabled
- Explicit type annotations
- No `any` types in production code
- Proper error handling

### React
- Functional components only
- Custom hooks for logic
- Proper dependency arrays
- Error boundaries for robustness

### Rust/Anchor
- Safe Rust practices
- Proper error handling
- Account validation
- Security checks

### CSS/Styling
- Tailwind utility classes
- Component-specific styles only when needed
- Dark mode support
- Mobile-first responsive design

## 📝 Documentation Standards

- README.md in each major directory
- JSDoc comments for public APIs
- Inline comments for complex logic
- Type definitions for all interfaces
- Example usage in documentation