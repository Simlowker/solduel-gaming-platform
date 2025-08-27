#!/bin/bash
set -e

read -p "⚠️  Déployer sur MAINNET? (yes/no) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo "🚀 Configuration Mainnet..."
solana config set --url mainnet-beta

echo "📦 Backup keypair..."
mkdir -p backups
cp packages/programs/game-core/target/deploy/game_core-keypair.json \
   backups/mainnet-$(date +%Y%m%d-%H%M%S).json

echo "💰 Déploiement avec priority fees..."
cd packages/programs/game-core
anchor deploy --provider.cluster mainnet-beta \
    --provider.wallet ~/.config/solana/mainnet-wallet.json \
    -- --with-compute-unit-price 5000 \
    --max-sign-attempts 10

echo "✅ Déployé sur Mainnet!"