#!/bin/bash

# Run LKG Build Script
# Usage: ./run-lkg.sh [number_of_conversations]
#
# Prerequisites:
#   - Create .env file with required credentials (see .env.example)
#   - Or export environment variables manually

set -e  # Exit on error

# Get number of conversations (default to 50 for POC)
CONV_COUNT=${1:-50}

echo "=== Latent Knowledge Graph Builder ==="
echo ""

# Check if .env file exists and load it
if [ -f ".env" ]; then
  echo "✓ Loading environment from .env file"
  export $(cat .env | grep -v '^#' | xargs)
elif [ -f ".env.local" ]; then
  echo "✓ Loading environment from .env.local file"
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Validate required environment variables
MISSING_VARS=()

if [ -z "$OPENAI_API_KEY" ]; then
  MISSING_VARS+=("OPENAI_API_KEY")
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
  MISSING_VARS+=("VITE_SUPABASE_URL")
fi

if [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ] && [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  MISSING_VARS+=("VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY")
fi

if [ -z "$LKG_USER_ID" ]; then
  MISSING_VARS+=("LKG_USER_ID")
fi

# If any vars are missing, show error and exit
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "❌ Error: Missing required environment variables:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "📝 Setup Instructions:"
  echo ""
  echo "1. Copy .env.example to .env:"
  echo "   cp .env.example .env"
  echo ""
  echo "2. Edit .env and add your credentials"
  echo ""
  echo "3. Get your user ID:"
  echo "   Method A: Login to app, then in browser console run:"
  echo "     await supabase.auth.getUser().then(r => console.log(r.data.user.id))"
  echo ""
  echo "   Method B: Check Supabase Dashboard → Authentication → Users"
  echo ""
  echo "4. Run this script again:"
  echo "   ./run-lkg.sh $CONV_COUNT"
  echo ""
  exit 1
fi

# Set conversation count
export LKG_MAX_CONVERSATIONS=$CONV_COUNT

echo "Configuration:"
echo "  - User ID: ${LKG_USER_ID:0:8}..."
echo "  - Conversations to process: $LKG_MAX_CONVERSATIONS"
echo "  - OpenAI API Key: ${OPENAI_API_KEY:0:7}...${OPENAI_API_KEY: -4}"
echo ""
echo "Starting build..."
echo ""

# Run the build
npm run build-lkg

echo ""
echo "=== Build Complete ==="
echo ""
echo "Next steps:"
echo "  1. Start the app: npm run dev"
echo "  2. Click the 'Knowledge' button in the navigation"
echo "  3. Explore your knowledge graph!"
echo ""

