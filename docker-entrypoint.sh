#!/bin/sh
set -e

echo "🔄 Aguardando banco de dados..."
sleep 3

echo "📦 Aplicando schema do Prisma..."
npx prisma db push --skip-generate --accept-data-loss

echo "👤 Verificando seed do admin..."
node seed-admin.js || echo "⚠️ Seed já executado ou falhou (ignorando)"

echo "🚀 Iniciando aplicação..."
exec node server.js
