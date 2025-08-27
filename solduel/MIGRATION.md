# Guide de Migration - Architecture Optimisée

## Résumé des Changements

✅ **Architecture réduite à 2 programmes Solana** au lieu de 4-5
✅ **SDK unifié et modulaire** pour tous les types de jeux  
✅ **Support de 17+ types de jeux** différents avec seulement 2 programmes
✅ **Économie de 3-6 SOL** sur le déploiement mainnet

## Programmes

### 1. `pvp-games` (Jeux PvP avec Commit-Reveal)
- **ID Devnet**: `Eh6yjDzBq3cSxkLLqWHQ8fWyQ9pA9kRKjTnCa7MbSKm2`
- **Types supportés**: RockPaperScissors, CoinFlip, DiceRoll, HighLow, NumberGuess, ColorPrediction, Tournament
- **Modes**: SingleRound, BestOf3, BestOf5, Tournament

### 2. `pool-games` (Jeux à Pool avec Tirage Proportionnel) 
- **ID Devnet**: `6MgJKi5hA4GYPLvSYwt5XhaFGsA8gz4xD5EC46wDz4NL`
- **Types supportés**: GlobalLottery, MiniLottery, JackpotPool, StrategicDuel, MultiPlayerDuel, etc.

## Utilisation du SDK

### Création de jeu générique
```typescript
import SolDuelSDK, { GameType, GameMode, PoolGameType } from './lib/solduel-sdk';

// Créer n'importe quel jeu PvP
await sdk.createPvPGame(
  GameType.RockPaperScissors,
  GameMode.BestOf3,
  0.5 // mise en SOL
);

// Créer n'importe quel jeu Pool
await sdk.createPoolGame(
  PoolGameType.GlobalLottery,
  0.1, // frais d'entrée
  0,   // max participants (0 = illimité)
  new Date(Date.now() + 24*60*60*1000) // fin du round
);
```

### Méthodes UI-spécifiques (compatibilité)
```typescript
// Sol Duel
await sdk.createStrategicDuel(0.5, 3); // mise 0.5 SOL, best of 3

// RPS Arena  
await sdk.createRPSGame(0.5, 'tournament');

// Dice Battle
await sdk.placeBet('heads', 50, 0.5);

// Global Lottery
await sdk.buyLotteryTickets(1, 10); // 1 SOL pour 10 tickets
```

## Étapes de Déploiement

### Phase 1: Test sur Devnet ✅
- Programmes déployés et testables
- SDK mis à jour avec nouvelle architecture

### Phase 2: Extension des Smart Contracts
1. Mettre à jour `game-core/src/state.rs` avec les nouveaux enums
2. Recompiler avec `anchor build`
3. Redéployer sur devnet avec `anchor deploy`
4. Générer les nouveaux IDLs

### Phase 3: Déploiement Mainnet
1. Déployer seulement 2 programmes
2. Économie estimée: 3-6 SOL
3. Migration progressive des utilisateurs

## Nouveaux Jeux Possibles

Avec cette architecture, vous pouvez facilement ajouter :
- **Poker Duel** (pvp-games + nouvelle UI)
- **Blackjack Pool** (pool-games + oracle)
- **NFT Battle** (pvp-games + metadata NFT)
- **Prediction Market** (pool-games + oracle de prix)
- **Tournament Brackets** (pvp-games mode Tournament)

## Notes Importantes

⚠️ **Le programme Pool n'a pas encore d'IDL** - À générer après déploiement
⚠️ **Treasury address à configurer** dans le SDK (ligne 418)
⚠️ **VDF integration** à finaliser pour la génération de randomness

## Prochaines Étapes

1. ✅ Architecture documentée
2. ✅ SDK mis à jour
3. ⏳ Compiler et déployer les programmes mis à jour
4. ⏳ Générer les nouveaux IDLs
5. ⏳ Tester sur devnet
6. ⏳ Audit de sécurité
7. ⏳ Déploiement mainnet