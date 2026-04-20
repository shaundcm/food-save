#!/bin/sh
set -e

# Extract host and port from DATABASE_URL
# Format: postgresql://user:pass@host:port/db
DB_HOST=$(echo "$DATABASE_URL" | sed 's|.*@\([^:]*\):\([0-9]*\)/.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed 's|.*@[^:]*:\([0-9]*\)/.*|\1|')

echo "⏳ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  echo "   PostgreSQL not ready, retrying in 2s..."
  sleep 2
done
echo "✅ PostgreSQL is up!"

echo "📦 Running migrations..."
./node_modules/.bin/prisma migrate deploy

echo "🌱 Seeding database..."
node dist/prisma/seed.js || echo "⚠️  Seed already applied or skipped"

echo "🚀 Starting server..."
exec node dist/index.js
