#!/bin/bash

# Peekaboo Project Status Checker
# Run this script to see what's been completed

echo "🔍 Peekaboo Project Status Check"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

# Pre-Setup / Deployment Config
echo "📦 Deployment Configuration:"
check_file "vercel.json" "Vercel config"
check_file "eas.json" "EAS Build config"
check_file "app.config.js" "Expo app config"
check_file ".vercelignore" "Vercel ignore file"
check_file "src/components/QuickOptionsSheet.web.tsx" "Web fallback component"
echo ""

# Documentation
echo "📚 Documentation:"
check_file "CLAUDE.md" "Claude Code guidance"
check_file "DEPLOYMENT.md" "Deployment guide"
check_file "README.md" "Project README"
check_file "SETUP-CHECKLIST.md" "Setup checklist"
check_file "STATUS.md" "Status tracker"
echo ""

# Phase 1: Project Setup
echo "🏗️  Phase 1: Project Setup"
check_file "package.json" "Expo project initialized"
check_dir "node_modules" "Dependencies installed"
check_file "babel.config.js" "Babel configuration"
check_file "tsconfig.json" "TypeScript configuration"
echo ""

# Project Structure
echo "📁 Project Structure:"
check_dir "src/components" "Components directory"
check_dir "src/screens" "Screens directory"
check_dir "src/hooks" "Hooks directory"
check_dir "src/stores" "Stores directory"
check_dir "src/types" "Types directory"
check_dir "src/lib" "Lib directory"
check_dir "src/constants" "Constants directory"
check_file "src/types/index.ts" "Type definitions"
check_file "src/constants/colors.ts" "Colors constants"
echo ""

# Environment
echo "🔐 Environment:"
check_file ".env" "Environment variables"
check_file ".env.example" "Environment example"
echo ""

# Components
echo "🧩 Components:"
check_file "src/components/ActivityButton.tsx" "ActivityButton"
check_file "src/components/QuickOptionsSheet.tsx" "QuickOptionsSheet"
check_file "src/components/LastActivityCard.tsx" "LastActivityCard"
check_file "src/components/TimelineItem.tsx" "TimelineItem"
echo ""

# Screens
echo "📱 Screens:"
check_file "src/screens/HomeScreen.tsx" "HomeScreen"
check_file "src/screens/TimelineScreen.tsx" "TimelineScreen"
check_file "src/screens/StatsScreen.tsx" "StatsScreen"
echo ""

# Stores
echo "💾 State Management:"
check_file "src/stores/activityStore.ts" "Activity store"
echo ""

# Services
echo "🔧 Services:"
check_file "src/lib/supabase.ts" "Supabase client"
check_file "src/lib/sync.ts" "Sync service"
echo ""

# Summary
echo ""
echo "=================================="
echo "📊 Summary:"
echo ""

TOTAL=0
COMPLETED=0

# Count files
for file in "vercel.json" "eas.json" "app.config.js" "CLAUDE.md" "DEPLOYMENT.md" "README.md" "package.json" "babel.config.js" "tsconfig.json" "src/types/index.ts" "src/constants/colors.ts" ".env"; do
    TOTAL=$((TOTAL + 1))
    if [ -f "$file" ]; then
        COMPLETED=$((COMPLETED + 1))
    fi
done

PERCENTAGE=$((COMPLETED * 100 / TOTAL))

echo "Completion: $COMPLETED/$TOTAL files ($PERCENTAGE%)"
echo ""

if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}⚠️  Next Step: Initialize Expo project${NC}"
    echo "   Run: npx create-expo-app@latest peekaboo --template expo-template-blank-typescript"
elif [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Next Step: Set up Supabase and create .env file${NC}"
elif [ ! -f "src/types/index.ts" ]; then
    echo -e "${YELLOW}⚠️  Next Step: Create project structure (Task 4)${NC}"
elif [ ! -f "src/components/ActivityButton.tsx" ]; then
    echo -e "${YELLOW}⚠️  Next Step: Build core UI components (Phase 2)${NC}"
else
    echo -e "${GREEN}✨ Project setup complete! Continue with remaining phases.${NC}"
fi

echo ""
echo "For detailed progress, check STATUS.md or SETUP-CHECKLIST.md"
