#!/bin/bash

# Deployment script for Prompt Engineering Hub
# Usage: ./scripts/deploy.sh [environment]

set -e

ENVIRONMENT="${1:-production}"
echo "🚀 Deploying to $ENVIRONMENT..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ Error: package.json not found. Run this from the project root.${NC}"
  exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}🔍 Running type checks...${NC}"
npx tsc --noEmit

echo -e "${YELLOW}🧹 Running linter...${NC}"
npm run lint || true

echo -e "${YELLOW}🏗️  Building production bundle...${NC}"
npm run build

echo -e "${GREEN}✅ Build successful!${NC}"

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
  echo -e "${YELLOW}🌍 Deploying to Vercel production...${NC}"
  npx vercel --prod --yes
elif [ "$ENVIRONMENT" = "preview" ]; then
  echo -e "${YELLOW}👀 Deploying to Vercel preview...${NC}"
  npx vercel --yes
else
  echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
  echo "Valid environments: production, preview"
  exit 1
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"

# Show deployment URL (Vercel CLI output)
echo -e "${GREEN}Visit your deployment above ⬆️${NC}"
