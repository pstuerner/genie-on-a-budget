#!/bin/sh
set -e

echo "🚀 Starting Genie on a Budget initialization..."

# Parse POSTGRES_URL to extract connection details
if [ -n "$POSTGRES_URL" ]; then
  # Extract host, port, user, and database from POSTGRES_URL
  # Format: postgresql://user:password@host:port/database
  POSTGRES_HOST=$(echo "$POSTGRES_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  POSTGRES_PORT=$(echo "$POSTGRES_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  POSTGRES_USER=$(echo "$POSTGRES_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  POSTGRES_DB=$(echo "$POSTGRES_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  
  # Default values if parsing fails
  POSTGRES_HOST=${POSTGRES_HOST:-localhost}
  POSTGRES_PORT=${POSTGRES_PORT:-5432}
  POSTGRES_USER=${POSTGRES_USER:-postgres}
  POSTGRES_DB=${POSTGRES_DB:-postgres}
else
  echo "❌ POSTGRES_URL is not defined"
  exit 1
fi

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "   PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run migrations (before parquet import to ensure schema exists)
echo ""
tsx scripts/run-migrations.ts

# Import parquet data (only if not already imported)
echo ""
if [ -f "./data/train-00000-of-00003.parquet" ]; then
  echo "⏳ Checking parquet data import..."
  tsx scripts/import-parquet.ts ./data/train-00000-of-00003.parquet
  echo "✅ Parquet data ready!"
else
  echo "⚠️  Parquet file not found at ./data/train-00000-of-00003.parquet, skipping import"
fi

# Start the application
echo ""
echo "🚀 Starting the application..."
echo "   Application will be available at http://localhost:3000"
echo ""
exec node server.js
