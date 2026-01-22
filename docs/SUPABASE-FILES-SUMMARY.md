# Supabase Setup Files Summary

This document provides a quick overview of all Supabase-related files created for the Peekaboo project.

## Files Created

### 1. `specs/database-schema.sql` (11KB)

**Purpose:** Complete PostgreSQL database schema for multi-tenant baby activity tracking.

**Key Features:**
- 4 main tables: `families`, `family_members`, `babies`, `activities`
- UUID extension for unique identifiers
- Performance indexes for all common queries
- Row Level Security (RLS) policies ensuring data isolation
- Auto-generated 6-character invite codes
- Automatic admin assignment when creating families
- Triggers for updated_at timestamps
- Real-time publication setup comments

**Tables:**
- `families`: Family groups with unique invite codes
- `family_members`: User-family membership with roles (admin/member)
- `babies`: Baby profiles linked to families
- `activities`: All logged activities with JSONB details

**Security:**
- Complete RLS policies on all tables
- Users can only access data for families they belong to
- Admins have additional privileges (delete, manage members)

### 2. `.env.example` (Updated)

**Purpose:** Template for environment variables with comprehensive documentation.

**Contains:**
- `EXPO_PUBLIC_SUPABASE_URL` - Project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key for client-side use
- Detailed comments explaining:
  - Where to find credentials
  - Security best practices
  - Local development setup
  - Deployment configuration

**Usage:**
```bash
cp .env.example .env
# Edit .env with your actual Supabase credentials
```

### 3. `src/lib/supabase.ts` (5.9KB)

**Purpose:** Supabase client configuration with TypeScript types.

**Key Features:**
- React Native URL polyfill for compatibility
- AsyncStorage for session persistence (2026 best practice)
- Environment variable validation with helpful errors
- Complete TypeScript database types
- Helper functions:
  - `isAuthenticated()` - Check if user is logged in
  - `getCurrentUserId()` - Get current user's ID
  - `signOut()` - Sign out user

**Database Types:**
- `Database` interface matching Supabase schema
- Typed entities: `DbActivity`, `DbBaby`, `DbFamily`, `DbFamilyMember`
- Full Insert/Update/Row types for type safety

**Usage:**
```typescript
import { supabase, isAuthenticated } from '@/lib/supabase';

const authenticated = await isAuthenticated();
if (authenticated) {
  // Fetch data
}
```

### 4. `src/lib/sync.ts` (13KB)

**Purpose:** Offline-first synchronization service with real-time capabilities.

**Architecture:**
- Activities logged locally first (Zustand/AsyncStorage)
- Automatic sync to Supabase when online
- Failed syncs queued for retry (max 5 attempts)
- Real-time subscriptions for partner updates

**Key Functions:**

**Real-Time:**
- `subscribeToActivities(babyId, onInsert, onUpdate, onDelete)` - Subscribe to activity changes
  - Returns cleanup function for unsubscribing
  - Filters by baby ID
  - Handles INSERT, UPDATE, DELETE events

**Sync:**
- `syncActivity(activity)` - Sync single activity to Supabase
  - Returns true if successful, false if queued
  - Automatic retry queue on failure
  
- `syncPendingActivities()` - Process retry queue
  - Called on app startup or network reconnect
  - Returns number of successfully synced activities
  - Drops activities after max retries

**Data Fetching:**
- `fetchActivities(babyId, limit)` - Get activities for a baby
- `deleteActivity(activityId)` - Remove activity from Supabase

**Family Management:**
- `joinFamilyByCode(inviteCode)` - Join family via invite code
- `fetchUserFamilies()` - Get families user belongs to
- `fetchFamilyBabies(familyId)` - Get babies in a family

**Error Handling:**
- Comprehensive try-catch blocks
- Console logging for debugging
- Graceful degradation when offline
- Retry logic with exponential backoff

### 5. `docs/SUPABASE-SETUP.md` (11KB)

**Purpose:** Comprehensive step-by-step setup guide.

**Sections:**
1. **Prerequisites** - What you need before starting
2. **Create Supabase Project** - Detailed project creation steps
3. **Run Database Schema** - SQL deployment instructions
4. **Get API Credentials** - Where to find URL and keys
5. **Configure Environment Variables** - Setting up .env file
6. **Enable Real-Time Replication** - Real-time setup for activities
7. **Test Your Setup** - Verification procedures with examples
8. **Security Best Practices** - RLS, environment variables, auth
9. **Troubleshooting** - Common issues and solutions

**Testing Examples:**
- Connection test script
- RLS verification queries
- Real-time subscription example
- Family creation and membership tests

**Troubleshooting Covers:**
- Missing environment variables
- Database schema issues
- Real-time not working
- RLS policy violations
- Sync failures
- Invite code problems

## Implementation Overview

### Offline-First Architecture

```
┌─────────────┐
│   User Tap  │
└──────┬──────┘
       │
       v
┌─────────────────┐
│ Zustand Store   │ ← Activities stored locally first
│ (AsyncStorage)  │
└──────┬──────────┘
       │
       v
┌─────────────────┐
│  Sync Service   │ ← Attempts to sync to Supabase
└──────┬──────────┘
       │
       ├─ Success ──→ Mark as synced
       │
       └─ Failure ──→ Add to retry queue
```

### Real-Time Sync

```
Device A                   Supabase                    Device B
   │                          │                           │
   │─── Log Activity ────────→│                           │
   │                          │                           │
   │                          │─── Real-time Event ──────→│
   │                          │                           │
   │                          │←── Subscribed ───────────│
   │                          │                           │
   │                          │                           │
   │←─ Partner logged! ──────│                           │
```

### Multi-Tenant Security

```
User → Authenticated Session → RLS Policies → Only Family Data

RLS ensures:
- Users only see families they belong to
- Activities filtered by baby's family
- Can't access other families' data
- Admins have additional privileges
```

## Usage Flow

### 1. Initial Setup (Once)

```bash
# 1. Create Supabase project at supabase.com
# 2. Run database-schema.sql in SQL Editor
# 3. Get credentials from Settings > API
# 4. Create .env file
cp .env.example .env
# 5. Fill in credentials
# 6. Enable real-time for activities table
# 7. Restart dev server
npx expo start --clear
```

### 2. Development (Ongoing)

```typescript
// Activities are logged offline-first
import { useActivityStore } from '@/stores/activityStore';

const store = useActivityStore();
await store.logActivity(activity); // Saved locally

// Sync service automatically syncs to Supabase
import { syncActivity } from '@/lib/sync';
await syncActivity(activity); // Tries to sync, queues if fails

// Subscribe to real-time updates from partner
import { subscribeToActivities } from '@/lib/sync';

const unsubscribe = subscribeToActivities(
  babyId,
  (activity) => store.addActivity(activity), // New activity
  (activity) => store.updateActivity(activity), // Updated
  (id) => store.deleteActivity(id) // Deleted
);

// Cleanup on unmount
return () => unsubscribe();
```

### 3. Testing

```bash
# Test connection
npx ts-node test-supabase.ts

# Check RLS policies
# In Supabase SQL Editor:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

# All should show rowsecurity = true
```

## File Sizes

- `specs/database-schema.sql`: 11KB
- `src/lib/supabase.ts`: 5.9KB
- `src/lib/sync.ts`: 13KB
- `docs/SUPABASE-SETUP.md`: 11KB
- Total: ~41KB of production-ready code

## Next Steps

**After creating these files:**

1. Follow `docs/SUPABASE-SETUP.md` to deploy Supabase backend
2. Or continue with Phase 3 UI development (can work offline)
3. Integrate sync service with activity store (Phase 6)
4. Test real-time updates between devices
5. Deploy to production (Vercel + EAS)

## Key Design Decisions

1. **AsyncStorage over expo-sqlite** - Simpler, sufficient for session persistence
2. **Simple retry queue over PowerSync** - Adequate for this use case, less complexity
3. **Row Level Security** - Essential for multi-tenant architecture
4. **Offline-first** - Better UX, works without connection
5. **Real-time subscriptions** - Enable instant partner sync
6. **TypeScript throughout** - Type safety and better DX

## Architecture Validation

All code follows 2026 best practices:
- URL polyfill for React Native
- AsyncStorage for persistence (not localStorage)
- Proper error handling with try-catch
- Comprehensive logging for debugging
- Type-safe database interactions
- Security-first approach with RLS

---

**Status:** All Supabase setup files complete and production-ready. Next: Deploy backend or continue UI development.
