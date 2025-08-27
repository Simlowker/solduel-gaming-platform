# 📋 SPÉCIFICATIONS FRONTEND SOLDUEL
## Guide Complet pour l'Intégration Frontend-Smart Contract

---

## 🎯 OBJECTIF
Ce document définit PRÉCISÉMENT comment le frontend doit interagir avec le smart contract Solana pour garantir une expérience de jeu optimale et sans erreurs.

---

## 📍 INFORMATIONS CRITIQUES

### Programme ID (Devnet)
```
Cg8sF2yCkfStCqCViq676zXzRBqr7XRmyJtvLweNAh9x
```

### Configuration RPC
```javascript
const NETWORK = 'devnet';
const RPC_ENDPOINT = 'https://api.devnet.solana.com';
const COMMITMENT = 'confirmed'; // Pour une meilleure UX
```

---

## 🎮 TYPES DE JEUX

### 1. SimpleDuel (Rock-Paper-Scissors)
- **Joueurs**: Exactement 2
- **Mécanisme**: Commit-Reveal en 2 phases
- **Mise**: Identique pour les deux joueurs
- **Durée**: ~2-3 minutes par partie

### 2. MultiRound (Poker-style)
- **Joueurs**: 2-4
- **Mécanisme**: Actions de paris (Check/Call/Raise/Fold)
- **Rondes**: Maximum configuré (défaut: 5)
- **Mise**: Variable selon les actions

### 3. Lottery
- **Joueurs**: 2-100
- **Mécanisme**: Achat de tickets proportionnels
- **Tirage**: Automatique quand plein ou timeout
- **VRF**: Utilisation de Switchboard pour l'équité

---

## 🔄 FLUX D'INTERACTION COMPLET

### PHASE 1: INITIALISATION (Admin seulement)

```typescript
// 1. Vérifier si la configuration existe
const configAccount = await program.account.configurationAccount.fetchNullable(configPDA);

if (!configAccount) {
  // 2. Initialiser la configuration (ADMIN SEULEMENT)
  await program.methods
    .initializeConfig()
    .accounts({
      config: configPDA,
      admin: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

// Configuration par défaut:
{
  minStake: 0.1 * LAMPORTS_PER_SOL,  // 0.1 SOL minimum
  maxStake: 100 * LAMPORTS_PER_SOL,  // 100 SOL maximum
  platformFee: 3,                     // 3% de commission
  timeout: 300,                       // 5 minutes timeout
  maxRounds: 5,                       // Pour multi-round
  foldPenalty: 10,                    // 10% pénalité pour fold
  ticketConversion: 1000000,         // 1 ticket = 0.001 SOL
}
```

### PHASE 2: CRÉATION DE PARTIE

```typescript
// 1. Générer un game_id unique
const configAccount = await program.account.configurationAccount.fetch(configPDA);
const gameId = configAccount.gameCounter;

// 2. Calculer le PDA du jeu
const [gamePDA] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("game"),
    wallet.publicKey.toBuffer(),
    new BN(gameId).toArrayLike(Buffer, "le", 8)
  ],
  programId
);

// 3. Créer le jeu
await program.methods
  .createGame(
    gameType,           // 0: SimpleDuel, 1: MultiRound, 2: Lottery
    new BN(stakeAmount), // En lamports
    maxPlayers          // null pour duels, 2-100 pour lottery
  )
  .accounts({
    game: gamePDA,
    config: configPDA,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// 4. Écouter l'événement GameCreated
program.addEventListener("GameCreated", (event) => {
  console.log("Jeu créé:", event.gameId, event.creator);
  // Rediriger vers la salle d'attente
});
```

### PHASE 3: REJOINDRE UNE PARTIE

```typescript
// 1. Récupérer les parties disponibles
const games = await program.account.gameAccountOptimized.all([
  {
    memcmp: {
      offset: 8 + 8 + 1, // Après discriminator, game_id et game_type_and_state
      bytes: bs58.encode(Buffer.from([0])) // State = Waiting
    }
  }
]);

// 2. Vérifier les conditions avant de rejoindre
const game = games.find(g => {
  const playerCount = g.account.playerCount;
  const maxPlayers = getMaxPlayers(g.account.gameTypeAndState >> 4);
  const stake = g.account.stakes[0];
  
  return playerCount < maxPlayers && 
         stake >= minStake && 
         stake <= maxStake &&
         !g.account.players.slice(0, playerCount).includes(wallet.publicKey);
});

// 3. Rejoindre la partie
await program.methods
  .joinGame()
  .accounts({
    game: game.publicKey,
    player: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### PHASE 4A: GAMEPLAY - SIMPLE DUEL

#### Étape 1: Commit (Soumission cachée)
```typescript
// 1. Générer un nonce aléatoire (32 bytes)
const nonce = crypto.getRandomValues(new Uint8Array(32));

// 2. Créer le hash du mouvement
const move = GameMove.Rock; // 1: Rock, 2: Paper, 3: Scissors
const moveBytes = Buffer.from([move]);
const toHash = Buffer.concat([moveBytes, nonce]);
const hash = crypto.createHash('sha256').update(toHash).digest();

// 3. Sauvegarder localement (CRITIQUE!)
localStorage.setItem(`game_${gameId}_nonce`, bs58.encode(nonce));
localStorage.setItem(`game_${gameId}_move`, move.toString());

// 4. Soumettre le hash
await program.methods
  .commitMove(Array.from(hash))
  .accounts({
    game: gamePDA,
    player: wallet.publicKey,
  })
  .rpc();

// 5. Afficher l'état d'attente
updateUI("Mouvement soumis, en attente de l'adversaire...");
```

#### Étape 2: Reveal (Révélation)
```typescript
// 1. Attendre que les deux joueurs aient commit
const game = await program.account.gameAccountOptimized.fetch(gamePDA);
const bothCommitted = game.commitHashes[0].some(b => b !== 0) && 
                      game.commitHashes[1].some(b => b !== 0);

if (bothCommitted) {
  // 2. Récupérer le nonce et le mouvement
  const nonce = bs58.decode(localStorage.getItem(`game_${gameId}_nonce`));
  const move = parseInt(localStorage.getItem(`game_${gameId}_move`));
  
  // 3. Révéler le mouvement
  await program.methods
    .revealMove(
      move,
      Array.from(nonce)
    )
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
    })
    .rpc();
  
  // 4. Nettoyer le localStorage
  localStorage.removeItem(`game_${gameId}_nonce`);
  localStorage.removeItem(`game_${gameId}_move`);
}
```

### PHASE 4B: GAMEPLAY - MULTI-ROUND

```typescript
// Actions possibles selon l'état
async function placeBet(action: BetAction) {
  const game = await program.account.gameAccountOptimized.fetch(gamePDA);
  const playerIndex = game.players.indexOf(wallet.publicKey);
  
  // Validation des actions
  if (action.type === 'raise') {
    const minRaise = game.stakes[playerIndex] + game.minRaise;
    if (action.amount < minRaise) {
      throw new Error(`Mise minimum: ${minRaise / LAMPORTS_PER_SOL} SOL`);
    }
  }
  
  await program.methods
    .placeBet(action)
    .accounts({
      game: gamePDA,
      player: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

// Gestion des rounds
function getCurrentRound(game) {
  return (game.rounds >> 4) & 0x0F; // High nibble
}

function getMaxRounds(game) {
  return game.rounds & 0x0F; // Low nibble
}
```

### PHASE 4C: GAMEPLAY - LOTTERY

```typescript
// 1. Acheter des tickets
const numTickets = 10; // Nombre de tickets à acheter
const ticketPrice = config.ticketConversion; // Prix par ticket
const totalCost = numTickets * ticketPrice;

await program.methods
  .enterLottery(numTickets)
  .accounts({
    lottery: lotteryPDA,
    player: wallet.publicKey,
    config: configPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// 2. Afficher les statistiques
function calculateWinProbability(game, playerIndex) {
  const playerTickets = game.stakes[playerIndex] / config.ticketConversion;
  const totalTickets = game.potTotal / config.ticketConversion;
  return (playerTickets / totalTickets * 100).toFixed(2);
}

// 3. Tirage automatique (quand conditions remplies)
const canDraw = game.playerCount >= 2 && 
                (game.playerCount === MAX_PLAYERS || 
                 Date.now() / 1000 - game.timestamps > config.timeout);

if (canDraw) {
  await program.methods
    .drawLottery()
    .accounts({
      lottery: lotteryPDA,
      vrf: vrfAccountPDA, // Si VRF activé
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

### PHASE 5: RÉSOLUTION

```typescript
// 1. Détection automatique de fin de partie
async function checkGameCompletion(gamePDA) {
  const game = await program.account.gameAccountOptimized.fetch(gamePDA);
  const state = game.gameTypeAndState & 0x0F;
  
  if (state === GameState.Active) {
    const gameType = game.gameTypeAndState >> 4;
    
    switch (gameType) {
      case GameType.SimpleDuel:
        // Vérifier si les deux joueurs ont révélé
        const bothRevealed = game.revealsPackged[0] !== 0 && 
                            game.revealsPackged[1] !== 0;
        if (bothRevealed) {
          await resolveGame(gamePDA);
        }
        break;
        
      case GameType.MultiRound:
        // Vérifier si un seul joueur reste actif
        const activePlayers = game.players
          .slice(0, game.playerCount)
          .filter((_, i) => !hasFolded(game, i));
        if (activePlayers.length === 1) {
          await resolveGame(gamePDA);
        }
        break;
    }
  }
}

// 2. Résolution du jeu
async function resolveGame(gamePDA) {
  await program.methods
    .resolveGame()
    .accounts({
      game: gamePDA,
      winner: winnerPubkey, // Déterminé par le smart contract
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}
```

### PHASE 6: DISTRIBUTION DES GAINS

```typescript
// Distribution automatique avec frais
async function distributeWinnings(gamePDA) {
  const game = await program.account.gameAccountOptimized.fetch(gamePDA);
  const config = await program.account.configurationAccount.fetch(configPDA);
  
  // Calcul des gains
  const platformFee = (game.potTotal * config.platformFee) / 100;
  const winnerPrize = game.potTotal - platformFee;
  
  await program.methods
    .distributeWinningsWithFees()
    .accounts({
      game: gamePDA,
      winner: game.winner,
      treasury: config.treasury,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  // Afficher les résultats
  showWinnerModal({
    winner: game.winner,
    prize: winnerPrize / LAMPORTS_PER_SOL,
    platformFee: platformFee / LAMPORTS_PER_SOL
  });
}
```

---

## 🔐 GESTION DES ÉTATS

### États du jeu (GameState)
```typescript
enum GameState {
  Waiting = 0,    // En attente de joueurs
  Active = 1,     // Partie en cours
  Resolving = 2,  // Calcul du gagnant
  Completed = 3,  // Terminée
  Cancelled = 4   // Annulée
}

// Extraction de l'état depuis gameTypeAndState
function getGameState(game) {
  return game.gameTypeAndState & 0x0F; // Low nibble
}

function getGameType(game) {
  return game.gameTypeAndState >> 4; // High nibble
}
```

### Transitions d'état valides
```
Waiting -> Active (quand suffisamment de joueurs)
Waiting -> Cancelled (créateur peut annuler)
Active -> Resolving (conditions de fin remplies)
Resolving -> Completed (gagnant déterminé)
Active -> Completed (timeout avec force_finish)
```

---

## ⏱️ GESTION DU TIMEOUT

```typescript
// Vérifier le timeout
function isTimedOut(game, config) {
  const lastAction = Number(game.timestamps & 0xFFFFFFFF);
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - lastAction > config.timeout;
}

// Force finish avec pénalité
async function forceFinish(gamePDA) {
  const game = await program.account.gameAccountOptimized.fetch(gamePDA);
  
  if (isTimedOut(game, config)) {
    await program.methods
      .forceFinish()
      .accounts({
        game: gamePDA,
        caller: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    // Le joueur actif perd, l'autre gagne
    showTimeoutNotification();
  }
}

// Auto-check périodique
setInterval(() => {
  checkTimeouts();
}, 10000); // Toutes les 10 secondes
```

---

## 🎲 INTÉGRATION VRF (Lottery)

```typescript
// 1. Configuration VRF
const VRF_QUEUE = new PublicKey("QUEUE_PUBKEY_DEVNET");

// 2. Requête de nombre aléatoire
async function requestRandomness(lotteryPDA) {
  await program.methods
    .requestRandomness()
    .accounts({
      lottery: lotteryPDA,
      vrfQueue: VRF_QUEUE,
      queueAuthority: queueAuthority,
      dataBuffer: dataBuffer,
      permission: permission,
      escrow: escrow,
      programState: programState,
      switchboardProgram: SWITCHBOARD_PROGRAM_ID,
    })
    .rpc();
}

// 3. Consommation du résultat
program.addEventListener("VrfFulfilled", async (event) => {
  if (event.game.equals(currentGamePDA)) {
    // Le gagnant a été sélectionné de manière équitable
    const winner = await determineWinnerFromVRF(event.result);
    updateWinnerDisplay(winner);
  }
});
```

---

## 📊 SYNCHRONISATION EN TEMPS RÉEL

### WebSocket Subscriptions
```typescript
// 1. Écouter les changements du compte de jeu
const gameSubscriptionId = connection.onAccountChange(
  gamePDA,
  (accountInfo) => {
    const game = program.coder.accounts.decode(
      'gameAccountOptimized',
      accountInfo.data
    );
    updateGameState(game);
  },
  'confirmed'
);

// 2. Écouter les événements du programme
const eventListener = program.addEventListener(
  "PlayerJoined",
  (event) => {
    if (event.gameId === currentGameId) {
      addPlayerToLobby(event.player);
      playSound('player_joined');
    }
  }
);

// 3. Nettoyage
onUnmount(() => {
  connection.removeAccountChangeListener(gameSubscriptionId);
  program.removeEventListener(eventListener);
});
```

### Polling Fallback
```typescript
// Si WebSocket non disponible
const pollInterval = setInterval(async () => {
  const game = await program.account.gameAccountOptimized.fetch(gamePDA);
  if (hasChanged(game, lastKnownState)) {
    updateGameState(game);
    lastKnownState = game;
  }
}, 2000); // Poll toutes les 2 secondes
```

---

## 🚨 GESTION DES ERREURS CRITIQUES

### Erreurs à gérer impérativement

```typescript
enum GameError {
  // Configuration
  Unauthorized = 6000,           // Non-admin essaie d'init config
  AlreadyInitialized = 6001,     // Config déjà existante
  
  // Création/Jonction
  InvalidStakeAmount = 6002,     // Mise hors limites
  GameFull = 6003,              // Plus de place
  AlreadyJoined = 6004,         // Joueur déjà dans la partie
  InsufficientFunds = 6005,     // Pas assez de SOL
  
  // Gameplay
  NotYourTurn = 6006,           // Pas le tour du joueur
  InvalidMove = 6007,           // Mouvement non valide
  AlreadyCommitted = 6008,      // Déjà soumis un mouvement
  InvalidReveal = 6009,         // Hash ne correspond pas
  NotInCommitPhase = 6010,      // Mauvaise phase
  NotInRevealPhase = 6011,      // Mauvaise phase
  
  // Résolution
  GameNotReady = 6012,          // Conditions non remplies
  AlreadyResolved = 6013,       // Déjà résolu
  NotTimedOut = 6014,          // Timeout non atteint
}

// Gestion gracieuse
try {
  await program.methods.createGame(...).rpc();
} catch (error) {
  const errorCode = error.error?.errorCode?.code;
  
  switch(errorCode) {
    case 6002:
      showError("La mise doit être entre 0.1 et 100 SOL");
      break;
    case 6005:
      showError("Solde insuffisant. Besoin de " + requiredAmount);
      requestAirdrop(); // Proposer airdrop si devnet
      break;
    default:
      showError("Erreur: " + error.message);
  }
}
```

---

## 💾 STOCKAGE LOCAL

### Données à persister
```typescript
interface LocalGameData {
  // Commit-reveal
  nonce: string;           // Base58 encoded
  move: number;           // GameMove enum value
  commitTime: number;     // Timestamp
  
  // État UI
  currentGamePDA: string; // Public key string
  playerIndex: number;    // Position dans la partie
  
  // Préférences
  soundEnabled: boolean;
  autoReveal: boolean;
  defaultStake: number;
}

// Sauvegarde sécurisée
function saveGameData(gameId: string, data: LocalGameData) {
  const encrypted = encrypt(JSON.stringify(data));
  localStorage.setItem(`solduel_game_${gameId}`, encrypted);
}

// Nettoyage après partie
function cleanupGameData(gameId: string) {
  localStorage.removeItem(`solduel_game_${gameId}`);
  localStorage.removeItem(`game_${gameId}_nonce`);
  localStorage.removeItem(`game_${gameId}_move`);
}
```

---

## 🎨 EXPÉRIENCE UTILISATEUR OPTIMALE

### États de chargement
```typescript
// Toujours afficher l'état de chaque transaction
const states = {
  PREPARING: "Préparation de la transaction...",
  SIGNING: "En attente de signature...",
  SENDING: "Envoi à la blockchain...",
  CONFIRMING: "Confirmation (0/32)...",
  SUCCESS: "Transaction réussie!",
  ERROR: "Échec de la transaction"
};

// Feedback immédiat
async function executeTransaction(instruction) {
  setTransactionState(states.PREPARING);
  
  try {
    const tx = await instruction.rpc();
    setTransactionState(states.SENDING);
    
    const confirmation = await connection.confirmTransaction(tx, 'confirmed');
    setTransactionState(states.SUCCESS);
    
    return confirmation;
  } catch (error) {
    setTransactionState(states.ERROR);
    handleError(error);
  }
}
```

### Optimistic Updates
```typescript
// Mise à jour immédiate de l'UI avant confirmation
function optimisticJoinGame(game, player, stake) {
  // 1. Mise à jour locale immédiate
  updateUIState({
    players: [...game.players, player],
    stakes: [...game.stakes, stake],
    playerCount: game.playerCount + 1
  });
  
  // 2. Transaction réelle
  joinGame(game).catch(() => {
    // 3. Rollback si échec
    revertUIState();
  });
}
```

### Animations et Transitions
```typescript
// Transitions fluides entre états
const transitions = {
  enterGame: "fadeIn 0.3s ease-out",
  playerJoin: "slideInRight 0.4s ease-out",
  reveal: "flipIn 0.5s ease-in-out",
  winner: "zoomIn 0.6s ease-out with confetti"
};
```

---

## 🔄 RECONNEXION ET RÉCUPÉRATION

```typescript
// Récupération après déconnexion
async function resumeGame() {
  // 1. Vérifier les parties en cours
  const activeGames = await findUserActiveGames(wallet.publicKey);
  
  if (activeGames.length > 0) {
    // 2. Récupérer l'état local
    const localData = getLocalGameData(activeGames[0].gameId);
    
    if (localData?.nonce && !hasRevealed(activeGames[0])) {
      // 3. Proposer de continuer
      showResumeModal({
        game: activeGames[0],
        action: "Vous n'avez pas révélé votre mouvement",
        onResume: () => autoReveal(localData)
      });
    }
  }
}

// Auto-reconnexion WebSocket
connection.onDisconnect(() => {
  showConnectionLost();
  startReconnectTimer();
});
```

---

## ✅ CHECKLIST DE VALIDATION

### Avant le développement
- [ ] Programme ID correct pour le network
- [ ] Variables d'environnement configurées
- [ ] IDL à jour et synchronisé
- [ ] Wallet adapters configurés

### Fonctionnalités critiques
- [ ] Init config (admin only)
- [ ] Création de partie avec validation mise
- [ ] Jonction avec vérification conditions
- [ ] Commit-reveal pour SimpleDuel
- [ ] Actions de pari pour MultiRound
- [ ] Achat tickets pour Lottery
- [ ] Résolution automatique
- [ ] Distribution des gains
- [ ] Gestion timeout
- [ ] Force finish avec pénalité

### Synchronisation
- [ ] WebSocket subscriptions actives
- [ ] Polling fallback implémenté
- [ ] Event listeners configurés
- [ ] État local synchronisé

### UX/UI
- [ ] États de chargement pour chaque action
- [ ] Messages d'erreur explicites
- [ ] Optimistic updates
- [ ] Animations fluides
- [ ] Son et notifications
- [ ] Mode sombre/clair
- [ ] Responsive mobile

### Sécurité
- [ ] Validation côté client
- [ ] Stockage sécurisé des nonces
- [ ] Nettoyage après partie
- [ ] Gestion des déconnexions
- [ ] Protection contre double-spend

---

## 📞 SUPPORT ET RESSOURCES

- **Smart Contract**: `/contracts/programs/universal-game/`
- **IDL**: `/idl/universal_game.json`
- **SDK TypeScript**: `/lib/solduel-sdk.ts`
- **Exemples**: `/examples/`

---

## ⚠️ POINTS D'ATTENTION CRITIQUES

1. **JAMAIS** exposer le nonce avant le reveal
2. **TOUJOURS** vérifier l'état avant une action
3. **SAUVEGARDER** localement pour récupération
4. **VALIDER** côté client avant transaction
5. **NETTOYER** les données après utilisation
6. **GÉRER** tous les cas d'erreur
7. **SYNCHRONISER** en temps réel
8. **OPTIMISER** pour mobile
9. **TESTER** sur devnet avant mainnet
10. **MONITORER** les performances

---

*Document créé le 27 Août 2025 - Version 1.0*
*Programme déployé sur Devnet: Cg8sF2yCkfStCqCViq676zXzRBqr7XRmyJtvLweNAh9x*