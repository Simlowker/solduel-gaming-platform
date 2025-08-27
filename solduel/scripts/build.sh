#!/bin/bash
set -e

echo "🧹 Nettoyage..."
cd packages/programs/game-core
anchor clean
rm -rf target/ node_modules/
rm -f Cargo.lock

echo "🔨 Build optimisé..."
anchor build --arch sbf -- \
    -C opt-level=3 \
    -C lto=fat \
    -C codegen-units=1

SIZE=$(wc -c < target/deploy/game_core.so)
echo "📦 Taille du programme: $((SIZE / 1024))KB"

if [ $SIZE -gt 500000 ]; then
    echo "⚠️  Programme trop gros!"
    exit 1
fi

echo "✅ Build terminé!"