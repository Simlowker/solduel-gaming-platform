# SolDuel - Architecture Optimisée (2 Programmes)

## Vue d'ensemble

Architecture modulaire avec seulement 2 programmes Solana pour minimiser les coûts de déploiement sur mainnet tout en maximisant la réutilisabilité.

## Programme 1: `pvp-games` (Jeux PvP avec Commit-Reveal)
**ID Mainnet**: À déployer
**ID Devnet**: `Eh6yjDzBq3cSxkLLqWHQ8fWyQ9pA9kRKjTnCa7MbSKm2`

### Mécanisme Principal
- **Commit-Reveal Pattern**: Pour garantir l'équité dans tous les jeux PvP
- **Escrow Vault**: Gestion sécurisée des mises
- **VDF Integration**: Pour la génération de randomness vérifiable

### Types de Jeux Supportés
```rust
enum GameType {
    // Jeux de stratégie
    RockPaperScissors,      // Pierre-Feuille-Ciseaux classique
    RockPaperScissorsLizardSpock, // Version étendue
    
    // Jeux de chance pure
    CoinFlip,               // Pile ou Face
    DiceRoll,               // Lancer de dés (1-6)
    HighLow,                // Plus haut/Plus bas
    
    // Jeux de prédiction
    NumberGuess,            // Deviner un nombre (1-100)
    ColorPrediction,        // Prédiction de couleur
    
    // Mode tournoi
    Tournament,             // Multi-joueurs avec brackets
}
```

### Modes de Jeu
```rust
enum GameMode {
    SingleRound,            // Une seule manche
    BestOf3,               // Meilleur de 3
    BestOf5,               // Meilleur de 5
    Tournament,            // Mode tournoi avec brackets
}
```

### Instructions Principales
- `initialize_game`: Créer une nouvelle partie
- `join_game`: Rejoindre une partie existante
- `submit_move`: Soumettre un coup hashé (commit)
- `reveal_move`: Révéler le coup (reveal)
- `claim_winnings`: Réclamer les gains
- `cancel_game`: Annuler une partie inactive

## Programme 2: `pool-games` (Jeux à Pool avec Tirage Proportionnel)
**ID Mainnet**: À déployer  
**ID Devnet**: `6MgJKi5hA4GYPLvSYwt5XhaFGsA8gz4xD5EC46wDz4NL`

### Mécanisme Principal
- **Pool System**: Accumulation des mises dans un pool commun
- **Proportional Draw**: Tirage proportionnel à la mise
- **Time-based Rounds**: Rounds basés sur le temps ou le nombre de participants
- **VDF Random**: Utilisation du VDF pour le tirage équitable

### Types de Jeux Supportés
```rust
enum PoolGameType {
    // Loteries
    GlobalLottery,          // Loterie globale quotidienne/hebdomadaire
    MiniLottery,           // Mini-loteries rapides (toutes les heures)
    JackpotPool,           // Jackpot progressif
    
    // Duels proportionnels
    StrategicDuel,         // Duel avec mise proportionnelle
    MultiPlayerDuel,       // Duel multi-joueurs (3+)
    
    // Jeux de pool spéciaux
    SurvivorPool,          // Dernier survivant gagne tout
    SplitPool,             // Pool partagé entre top N joueurs
    BurnPool,              // Pool avec mécanisme de burn
    
    // Prédictions
    PricePrediction,       // Prédiction de prix (oracle)
    EventBetting,          // Paris sur événements
}
```

### Instructions Principales
- `create_pool`: Créer un nouveau pool
- `enter_pool`: Entrer dans un pool avec une mise
- `trigger_draw`: Déclencher le tirage (permissionless après délai)
- `claim_pool_winnings`: Réclamer les gains du pool
- `get_pool_state`: Obtenir l'état du pool
- `finalize_round`: Finaliser un round et distribuer les gains

## Avantages de cette Architecture

### 1. Réduction des Coûts
- **2 programmes seulement** au lieu de 4-5
- **Économie sur mainnet**: ~2-3 SOL au lieu de 5-8 SOL
- **Maintenance simplifiée**: Moins de programmes à mettre à jour

### 2. Modularité et Réutilisabilité
- **GameType extensible**: Ajouter de nouveaux jeux sans redéployer
- **UI/UX flexible**: Même mécanisme, différentes présentations
- **Cross-game compatibility**: Partage de liquidité entre jeux similaires

### 3. Exemples d'Utilisation

#### Sol Duel (UI Actuelle)
```typescript
// Utilise pvp-games avec GameType.RockPaperScissors
// Mode: BestOf3 ou BestOf5
// UI: Interface de duel stratégique
```

#### RPS Arena (UI Actuelle)
```typescript
// Utilise pvp-games avec GameType.RockPaperScissors
// Mode: SingleRound ou Tournament
// UI: Interface d'arène compétitive
```

#### Dice Battle (UI Actuelle)
```typescript
// Utilise pvp-games avec GameType.DiceRoll ou GameType.HighLow
// Mode: SingleRound
// UI: Interface de dés 3D animés
```

#### Global Lottery (UI Actuelle)
```typescript
// Utilise pool-games avec PoolGameType.GlobalLottery
// Round: Daily ou Weekly
// UI: Interface de loterie avec jackpot progressif
```

## Architecture Frontend

### SDK Unifié
```typescript
class SolDuelSDK {
  private pvpProgram: Program;    // Programme 1: PvP Games
  private poolProgram: Program;   // Programme 2: Pool Games
  
  // Méthodes génériques
  async createGame(type: GameType | PoolGameType, params: GameParams);
  async joinGame(gameId: string);
  async submitAction(gameId: string, action: any);
  async claimWinnings(gameId: string);
  
  // Helpers pour différentes UI
  async createSolDuel(stake: number, rounds: number);
  async createRPSArena(stake: number, mode: string);
  async createDiceBattle(prediction: string, amount: number);
  async enterLottery(amount: number, tickets: number);
}
```

### Nouvelles Possibilités de Jeux

Avec cette architecture, vous pouvez facilement créer de nouveaux jeux :

1. **Poker Duel** (pvp-games + nouvelle UI)
2. **Blackjack Pool** (pool-games + oracle de cartes)
3. **NFT Battle** (pvp-games + metadata NFT)
4. **Prediction Market** (pool-games + oracle de prix)
5. **Tournament Brackets** (pvp-games mode Tournament)

## Migration Plan

### Phase 1: Développement (Actuelle)
- Utiliser les programmes existants sur devnet
- Tester les deux architectures de programme

### Phase 2: Consolidation
- Fusionner les fonctionnalités dans les 2 programmes finaux
- Ajouter tous les GameType nécessaires
- Tester intensivement sur devnet

### Phase 3: Mainnet Deployment
- Déployer seulement 2 programmes sur mainnet
- Économie estimée: 3-6 SOL
- Migration progressive des utilisateurs

## Sécurité et Audit

### Mécanismes de Sécurité
- **Commit-Reveal**: Empêche la triche dans les jeux PvP
- **VDF Randomness**: Génération de nombres aléatoires vérifiables
- **Escrow Pattern**: Les fonds sont sécurisés dans des vaults PDA
- **Timeout Protection**: Annulation automatique des jeux inactifs
- **Anti-Spam**: Limites de mise min/max

### Points d'Audit
1. Vérification du commit-reveal
2. Sécurité des vaults
3. Calcul correct des gains
4. Protection contre les réentrants
5. Gestion des edge cases

## Conclusion

Cette architecture à 2 programmes offre :
- ✅ **Économies substantielles** sur les coûts de déploiement
- ✅ **Flexibilité maximale** pour créer de nouveaux jeux
- ✅ **Maintenance simplifiée** avec moins de code à auditer
- ✅ **Réutilisabilité** des mécaniques de base
- ✅ **Évolutivité** pour ajouter de nouveaux types de jeux