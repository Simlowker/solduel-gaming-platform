#!/bin/bash
set -e

echo "🚀 Configuration Devnet..."
solana config set --url devnet

echo "💰 Airdrop SOL..."
solana airdrop 5

echo "📦 Déploiement..."
cd packages/programs/game-core
anchor deploy --provider.cluster devnet \
    -- --with-compute-unit-price 1000

PROGRAM_ID=$(solana address -k target/deploy/game_core-keypair.json)
echo "✅ Programme déployé: $PROGRAM_ID"
echo "📝 Mets à jour Anchor.toml avec: $PROGRAM_ID"