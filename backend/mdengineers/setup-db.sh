#!/bin/bash

# M&D Engineering - Railway Database Setup Script
# Run this to set up your Railway database with all required tables

echo "🚀 M&D Engineering Backend - Database Setup"
echo "=========================================="
echo ""

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set!"
    echo "Please set DATABASE_URL in Railway or export it:"
    echo "  export DATABASE_URL='postgresql://postgres:password@host:port/database'"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""
echo "Running database schema setup..."
echo ""

# Run the schema file
psql "$DATABASE_URL" -f sql/schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema created successfully!"
    echo ""
    echo "Verifying tables..."
    psql "$DATABASE_URL" -c "\dt"
    echo ""
    echo "🎉 Setup complete!"
else
    echo ""
    echo "❌ Database setup failed!"
    exit 1
fi
