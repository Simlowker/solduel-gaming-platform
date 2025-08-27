# 🎮 Guide Multijoueur SolDuel

## 📋 Étapes pour jouer en multijoueur sur Devnet

### 1. 🔧 Préparer votre wallet Solana

```bash
# Vérifier votre wallet
solana config get

# Si nécessaire, configurer pour devnet
solana config set --url devnet

# Obtenir des SOL de test
solana airdrop 2
```

### 2. 🚀 Déployer le smart contract (si pas encore fait)

```bash
# Dans le dossier contracts
cd solduel/contracts

# Builder le contract
anchor build --skip-lint

# Déployer sur devnet
anchor deploy --provider.cluster devnet

# Copier l'IDL généré
cp target/idl/universal_game.json ../idl/
```

### 3. ⚙️ Configurer l'environnement

Créez ou vérifiez `.env.local` dans `solduel/` :
```env
NEXT_PUBLIC_PROGRAM_ID=BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
```

### 4. 🎯 Lancer l'application

```bash
# Dans le dossier solduel
npm run dev

# L'app sera accessible sur http://localhost:3000
```

### 5. 🎮 Jouer en multijoueur

#### Configuration initiale (ADMIN SEULEMENT - 1 fois) :
1. Connectez votre wallet (Phantom/Solflare)
2. Cliquez sur "Initialize Config" sur la page d'accueil
3. Attendez la confirmation de la transaction

#### Pour jouer :

**Joueur 1 (Créateur) :**
1. Connectez votre wallet sur devnet
2. Choisissez un jeu (Rock Paper Scissors, Dice Battle, etc.)
3. Cliquez "Create Game" et définissez la mise
4. Partagez l'ID du jeu ou l'URL avec le Joueur 2

**Joueur 2 (Challenger) :**
1. Connectez votre wallet sur devnet  
2. Entrez l'ID du jeu ou accédez via l'URL partagée
3. Cliquez "Join Game"
4. Les deux joueurs font leurs choix

**Résolution :**
- Le gagnant récupère automatiquement le pot
- Les statistiques sont mises à jour

### 6. 🌐 Déploiement sur Vercel (pour jouer à distance)

```bash
# Pousser sur GitHub
git add .
git commit -m "Ready for multiplayer"
git push

# Vercel va automatiquement déployer
# URL : https://votre-app.vercel.app
```

## 🛠️ Dépannage

### Erreur "Config not initialized"
→ L'admin doit cliquer "Initialize Config" une fois

### Erreur "Insufficient balance"
→ Faites `solana airdrop 2` pour obtenir plus de SOL de test

### Erreur "Program not found"
→ Vérifiez que le contract est bien déployé sur devnet

### Erreur "Wallet not connected"
→ Connectez votre wallet et assurez-vous d'être sur devnet

## 🔍 Vérifications importantes

```bash
# Vérifier le déploiement du programme
solana program show BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg --url devnet

# Vérifier votre balance
solana balance --url devnet

# Voir les logs du programme
solana logs BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg --url devnet
```

## 📝 Notes

- **Smart Contract**: Le programme ID `BELsmsp7jdUSUJDfcsLXP8HSdJsaAtbSBSJ95gRUbTyg` est le contrat universel qui gère tous les jeux
- **Devnet**: Réseau de test gratuit, les SOL n'ont aucune valeur réelle
- **Wallet**: Phantom et Solflare sont recommandés
- **Latence**: Sur devnet, les transactions peuvent prendre 1-3 secondes

## 🎯 Modes de jeu disponibles

1. **Rock Paper Scissors Arena** : Pierre-Papier-Ciseaux classique avec commit-reveal
2. **Dice Battle** : Lancer de dés avec paris stratégiques
3. **Sol Duel** : Duel multi-rounds avec système de paris poker
4. **Lottery Wheel** : Loterie avec système de tickets pondérés

Bon jeu ! 🚀