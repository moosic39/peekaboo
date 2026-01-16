# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Peekaboo is a React Native baby activity tracker built with Expo. The app provides one-tap logging for baby activities (feeding, diaper changes, sleep, pumping, growth) with real-time partner sync via Supabase.

**Tech Stack:**
- Expo (React Native) with TypeScript
- Supabase (auth, real-time DB, PostgreSQL)
- Zustand (local state management)
- React Navigation (bottom tabs)
- Bottom Sheet UI for quick options
- AsyncStorage for persistence

## Progress Tracking System

**IMPORTANT:** This repository includes a comprehensive progress tracking system. **Always check project status before starting work.**

### Quick Status Check

**First thing to do when starting work:**
```bash
./check-status.sh
```

This script shows:
- ✓ What's already completed
- ✗ What's missing or not started
- Next recommended step
- Overall completion percentage

### Status Files

1. **`STATUS.md`** - Current project state
   - Read this first to understand where the project is
   - Shows completed tasks, pending tasks, and next steps
   - Contains session notes tracking progress over time
   - **Update this after completing major work**

2. **`check-status.sh`** - Automated status checker
   - Run anytime to see current state
   - Checks filesystem for expected files/directories
   - Provides immediate feedback on progress

3. **`SETUP-CHECKLIST.md`** - Detailed step-by-step guide
   - Complete checklist with manual checkboxes
   - Includes all commands and instructions
   - Has spaces to record credentials/IDs
   - Follow this for implementation order

4. **`QUICK-START.md`** - Guide to using the tracking system
   - Explains how to use all tracking files
   - Workflow recommendations
   - Tips for maintaining progress

### Workflow for Claude Code

**When starting a session:**
```bash
# 1. Check current status
./check-status.sh

# 2. Read what's been done and what's next
cat STATUS.md | grep -A 20 "Next Steps"

# 3. Review session notes to understand context
tail -30 STATUS.md
```

**When completing work:**
1. Run `./check-status.sh` to verify completion
2. Update `STATUS.md`:
   - Move completed items from "Not Started" to "Completed"
   - Update progress tracker
   - Add session notes describing what was done
3. Commit changes with descriptive message

**Implementation order:**
Follow the phases outlined in `specs/implementation-plan-v1.md` and tracked in `SETUP-CHECKLIST.md`:
1. Phase 1: Project Setup (Tasks 1-4)
2. Phase 2: Core UI Components (Tasks 5-7)
3. Phase 3: Home Screen (Tasks 8-9)
4. Phase 4: Timeline Screen (Tasks 10-12)
5. Phase 5: Stats Screen (Task 13)
6. Phase 6: Supabase Integration (Tasks 14-15)

### Current Project State

**To determine current state:**
- Run `./check-status.sh` for automated check
- Read `STATUS.md` for detailed status
- Check if `package.json` exists to know if Expo project is initialized

**If project not initialized:**
The deployment configurations exist but the Expo project hasn't been created yet. Start with Task 1 in `SETUP-CHECKLIST.md`.

## Development Commands

### Setup
```bash
# Install dependencies
npx expo install

# Start development server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android
```

### Testing
```bash
# Run all tests
npx jest

# Run specific test file
npx jest path/to/test.tsx

# Run tests in watch mode
npx jest --watch
```

### Web Development
```bash
# Start web version
npx expo start --web

# Build for web
npx expo export -p web

# Test web build locally
npx serve dist
```

### Environment Setup
Create a `.env` file in the project root with:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Architecture

### Directory Structure
```
src/
├── components/       # Reusable UI components
├── screens/         # Screen components (Home, Timeline, Stats)
├── hooks/           # Custom React hooks
├── stores/          # Zustand state stores
├── types/           # TypeScript type definitions
├── lib/             # Utilities and services (supabase, sync)
└── constants/       # App constants (colors, config)
```

### Path Aliases
TypeScript is configured with `@/*` alias pointing to `src/*`:
```typescript
import { colors } from '@/constants/colors';
import { Activity } from '@/types';
```

### Core Data Types

**Activity Types:** `'feed' | 'diaper' | 'sleep' | 'pump' | 'growth'`

Each activity has:
- `id`: Unique identifier
- `type`: Activity type
- `timestamp`: ISO string
- `baby_id`: Reference to baby
- `created_by`: User ID
- `details`: Type-specific details (FeedDetails, DiaperDetails, etc.)

### State Management

**Activity Store (Zustand):** `src/stores/activityStore.ts`
- Persists to AsyncStorage
- Methods: `logActivity()`, `getLastActivity()`, `getTodayActivities()`, `deleteActivity()`
- Real-time sync integration point

### Component Architecture

**Activity Button:** Large tap target for quick activity logging
- Opens bottom sheet on press
- Color-coded by activity type

**Quick Options Sheet:** Bottom sheet with activity-specific options
- Feed: Breast/Bottle/Both
- Diaper: Wet/Dirty/Both
- Sleep: Start/End
- Pump: Left/Right/Both
- Growth: Weight/Height/All

**Last Activity Card:** Shows time since last activity of each type
- Uses `date-fns` for relative time formatting

**Timeline Item:** Activity list item with timestamp and details

### Screens

1. **HomeScreen:** Main activity logging interface with buttons and status
2. **TimelineScreen:** Chronological activity history grouped by date
3. **StatsScreen:** Daily and weekly statistics

### Supabase Integration

**Database Schema:**
- `families`: Family groups with invite codes
- `babies`: Baby profiles linked to families
- `activities`: Activity logs
- `family_members`: User-family membership

**Sync Service:** `src/lib/sync.ts`
- `syncActivity()`: Push activity to Supabase
- `fetchActivities()`: Pull activities for a baby
- `subscribeToActivities()`: Real-time subscription
- `joinFamilyByCode()`: Join family via invite

**Row Level Security:** Enabled on all tables - users can only access data for families they belong to.

## Development Guidelines

### Progress Tracking
**Always update STATUS.md after completing major tasks:**

1. Run `./check-status.sh` to verify what's been completed
2. Edit `STATUS.md`:
   - Move completed items from "Not Started" to "Completed"
   - Update progress percentages in the tracker table
   - Add session notes with what was done and next steps
3. Commit the updated STATUS.md

**Example session notes:**
```markdown
Session 3 (2026-01-17):
- Completed Phase 2: All core UI components built and tested
- Activity buttons working with proper colors
- Bottom sheet integrates correctly
Next: Start Phase 3 - Implement HomeScreen
```

### Test-Driven Development
Follow TDD pattern for new components:
1. Write failing test first
2. Implement minimal code to pass
3. Run test to verify
4. Commit

### Adding New Activity Types
To add a new activity type:
1. Add type to `ActivityType` union in `src/types/index.ts`
2. Create corresponding details interface (e.g., `NewActivityDetails`)
3. Add to `ActivityDetails` union type
4. Add color to `src/constants/colors.ts`
5. Add icon and label to `ICONS` and `LABELS` constants
6. Update `QuickOptionsSheet` OPTIONS mapping

### Babel Configuration
Reanimated plugin must be last in `babel.config.js`:
```javascript
plugins: ['react-native-reanimated/plugin']
```

### Color System
Activity-specific colors defined in `src/constants/colors.ts`:
- feed: Blue (#4A90D9)
- diaper: Yellow (#F5C842)
- sleep: Purple (#9B6BC2)
- pump: Pink (#E891B0)
- growth: Green (#5CB85C)

### Navigation
Bottom tab navigation with emoji icons. Tabs: Home (🏠), Timeline (📋), Stats (📊)

## Implementation Notes

### Offline-First Approach
Activities are logged locally first (Zustand + AsyncStorage), then synced to Supabase when connected.

### GestureHandler Root
HomeScreen wraps content in `GestureHandlerRootView` for bottom sheet support.

### Date Formatting
- Activity timestamps: ISO 8601 strings
- Display formatting: `date-fns` library
- Time ago: Custom format (e.g., "2h ago", "45m ago")

### Activity Deletion
Long-press on timeline items triggers deletion (currently immediate, TODO: add confirmation dialog).

### Web Platform Support
The app supports web deployment using `react-native-web`:
- **QuickOptionsSheet:** Has a web-specific variant (`QuickOptionsSheet.web.tsx`) using Modal instead of BottomSheet
- **Platform detection:** Metro bundler automatically uses `.web.tsx` files when building for web
- **Limitations:** Some native gestures and features have reduced functionality on web

## Deployment

### Web Deployment (Vercel)

**Quick Deploy:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

**Configuration:** `vercel.json` is pre-configured for Expo web builds.

**Environment Variables:** Set in Vercel dashboard:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Auto-Deploy:** Connect GitHub repository in Vercel for automatic deployments on push.

### Mobile Deployment (EAS Build)

**Prerequisites:**
```bash
# Install EAS CLI
npm i -g eas-cli

# Login
eas login
```

**Build Commands:**
```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build both
eas build --platform all --profile production
```

**Submit to Stores:**
```bash
# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

**Configuration:** `eas.json` contains build profiles (development, preview, production).

**Project Setup:**
1. Run `eas build:configure` on first use
2. Update `app.config.js` with your EAS project ID
3. Configure store credentials in `eas.json`

**See `DEPLOYMENT.md` for detailed deployment instructions including:**
- Platform-specific setup (iOS/Android)
- Environment variable management
- CI/CD configuration
- Cost breakdown
- Troubleshooting guide

## Implementation Reference

### Full Implementation Plan
See `specs/implementation-plan-v1.md` for complete task-by-task implementation guide including:
- Detailed steps for each task
- Expected outputs and verification steps
- Commit messages
- Test implementation patterns

### Phase Overview
The implementation plan is organized into 6 phases with 15 tasks total. Each task includes specific files to create/modify, commands to run, and verification steps.

**Note:** The plan includes specific commands with hardcoded paths (`/Users/mickael/Documents/dev/peekaboo`). Adjust paths as needed for your environment.

## Future Features (Not Yet Implemented)
- Authentication screens (sign up/sign in)
- Family/baby setup onboarding
- Active Supabase sync integration
- Settings screen
- Push notifications
- Home screen widgets
- CSV export
- Multiple babies support

## Reference Documentation

### Quick Reference
- **Progress tracking:** Run `./check-status.sh`
- **Current status:** Read `STATUS.md`
- **Implementation guide:** See `specs/implementation-plan-v1.md`
- **Deployment guide:** See `DEPLOYMENT.md`
- **Setup steps:** See `SETUP-CHECKLIST.md`
- **Quick start:** See `QUICK-START.md`
