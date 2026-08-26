#!/bin/sh

echo "🔄 Aguardando banco de dados (db:5432)..."

# Loop de espera até o banco de dados responder
MAX_RETRIES=30
COUNT=0

until pg_isready -h db -p 5432 -U rodeio_admin > /dev/null 2>&1 || nc -z db 5432 > /dev/null 2>&1; do
  COUNT=$((COUNT+1))
  if [ $COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Timeout aguardando banco de dados na porta 5432."
    break
  fi
  echo "⏳ Aguardando banco de dados responder ($COUNT/$MAX_RETRIES)..."
  sleep 2
done

echo "✅ Conexão com banco estabelecida!"

echo "📦 Aplicando schema do Prisma..."
npx prisma db push --skip-generate --accept-data-loss

echo "👤 Verificando seed do admin..."
node seed-admin.js || echo "⚠️ Seed já executado ou falhou (ignorando)"

echo "🚀 Iniciando aplicação..."
exec node server.js
