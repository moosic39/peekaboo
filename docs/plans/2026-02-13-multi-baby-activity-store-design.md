# Multi-Baby Activity Store Integration

**Date:** 2026-02-13
**Status:** Approved
**Phase:** Phase 5 Week 4 - Integration & Polish

## Overview

Integrate the `activityStore` with `familyStore` to support multi-baby activity tracking. This enables users to switch between babies and see only the selected baby's activities, while maintaining offline-first architecture and partner sync capabilities.

## Problem Statement

Currently, `activityStore` has a hardcoded `currentBabyId` that's separate from `familyStore.currentBabyId`. This creates two problems:

1. **Duplicate state:** Two sources of truth for which baby is selected
2. **No filtering:** Activity query methods return ALL babies' activities, not just the current baby's

Users can select different babies via `BabySelector`, but the activity screens don't reflect this selection.

## Goals

1. Remove duplicate `currentBabyId` state from activityStore
2. Make activityStore read from familyStore (single source of truth)
3. Auto-filter activities by current baby in all query methods
4. Maintain offline-first architecture (all activities in memory)
5. Support partner sync (all babies' activities synced and available)
6. Enable instant baby switching (no refetch needed)

## Non-Goals

- Changing persistence strategy (keep all activities together)
- Lazy loading activities (keep everything in memory)
- Per-baby activity stores (too complex, breaks partner sync)

## Design

### Architecture: Single Source of Truth Pattern

**Principle:** `familyStore.currentBabyId` is the single source of truth for baby selection.

**Store relationship:**
```
familyStore.currentBabyId (source of truth)
         ↓
activityStore reads it on-demand
         ↓
Returns filtered activities
         ↓
Components get current baby's data
```

**Key decisions:**
- No subscription between stores (read on-demand is simpler)
- All activities stored together (supports partner sync)
- Filtering happens at query time (not storage time)
- Fast baby switching (all data already in memory)

### Store Changes (activityStore.ts)

#### 1. Remove `currentBabyId` from State

**Before:**
```typescript
interface ActivityStore {
  activities: Activity[];
  currentBabyId: string;  // ← Remove this
  // ... methods
}

// Initial state
currentBabyId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',  // ← Remove this
```

**After:**
```typescript
interface ActivityStore {
  activities: Activity[];
  // currentBabyId removed
  // ... methods
}

// No currentBabyId in initial state
```

#### 2. Add Helper Function

Add at top of file (before store creation):

```typescript
import { useFamilyStore } from './familyStore';

/**
 * Get current baby ID from familyStore
 * Returns null if no baby selected
 */
const getCurrentBabyId = (): string | null => {
  return useFamilyStore.getState().currentBabyId;
};
```

#### 3. Update `logActivity` Method

**Before:**
```typescript
logActivity: (type: ActivityType, details: ActivityDetails) => {
  const activity: Activity = {
    // ...
    baby_id: get().currentBabyId,  // ← Old approach
    // ...
  };
  // ...
}
```

**After:**
```typescript
logActivity: (type: ActivityType, details: ActivityDetails) => {
  const currentBabyId = getCurrentBabyId();

  // Defensive: shouldn't happen due to onboarding, but be safe
  if (!currentBabyId) {
    throw new Error('No baby selected. Please select a baby first.');
  }

  const activity: Activity = {
    // ...
    baby_id: currentBabyId,  // ← New approach
    // ...
  };
  // ... rest unchanged
}
```

#### 4. Update `getLastActivity` Method

**Before:**
```typescript
getLastActivity: (type: ActivityType) => {
  const filtered = get().activities.filter((a) => a.type === type);
  return filtered.length > 0 ? filtered[0] : null;
}
```

**After:**
```typescript
getLastActivity: (type: ActivityType) => {
  const currentBabyId = getCurrentBabyId();
  if (!currentBabyId) return null; // Safety check

  const filtered = get().activities.filter(
    (a) => a.type === type && a.baby_id === currentBabyId
  );
  return filtered.length > 0 ? filtered[0] : null;
}
```

#### 5. Update `getTodayActivities` Method

**Before:**
```typescript
getTodayActivities: () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  return get().activities.filter((a) => a.timestamp >= todayISO);
}
```

**After:**
```typescript
getTodayActivities: () => {
  const currentBabyId = getCurrentBabyId();
  if (!currentBabyId) return []; // Safety check

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  return get().activities.filter(
    (a) => a.timestamp >= todayISO && a.baby_id === currentBabyId
  );
}
```

#### 6. Update `reset` Method

**Before:**
```typescript
reset: () => set({ activities: [], currentBabyId: 'default' }),
```

**After:**
```typescript
reset: () => set({ activities: [] }),
```

**No changes needed for:**
- `deleteActivity()` - deletes by ID regardless of baby
- Persistence configuration - keeps `@peekaboo:activities` key unchanged

### Data Flow

#### Flow 1: Logging an Activity
```
User taps "Feed" button
         ↓
HomeScreen calls activityStore.logActivity('feed', details)
         ↓
activityStore calls getCurrentBabyId()
         ↓
Reads familyStore.getState().currentBabyId
         ↓
Creates activity with that baby_id
         ↓
Adds to activities array (in memory)
         ↓
Persists to AsyncStorage (all babies together)
         ↓
Syncs to Supabase in background
         ↓
UI re-renders with new activity
```

#### Flow 2: Switching Babies
```
User taps BabySelector and picks different baby
         ↓
BabySelector calls familyStore.setCurrentBaby(babyId)
         ↓
familyStore updates currentBabyId
         ↓
Components re-render (they subscribe to activityStore)
         ↓
Components call getLastActivity() / getTodayActivities()
         ↓
Store methods read NEW currentBabyId
         ↓
Return filtered activities for newly selected baby
         ↓
UI shows different baby's activities (instant switch)
```

**Key insight:** No data refetch needed. Baby switch is instant because all activities are already in memory.

#### Flow 3: Real-time Sync (Partner Logs Activity)
```
Partner logs activity for Baby B (we're viewing Baby A)
         ↓
Supabase real-time fires update
         ↓
Sync service receives new activity
         ↓
Adds to activityStore.activities array
         ↓
Activity has baby_id = Baby B
         ↓
Our UI doesn't change (we're filtering for Baby A)
         ↓
User switches to Baby B
         ↓
Partner's activity appears immediately (already in memory)
```

### Error Handling

#### Edge Case 1: No Baby Selected
**Scenario:** `currentBabyId === null`

**Handling:**
- `logActivity()`: Throw error with message "No baby selected. Please select a baby first."
- `getLastActivity()`: Return `null`
- `getTodayActivities()`: Return empty array `[]`

**When this happens:** Shouldn't occur in normal flow due to onboarding, but defensive coding prevents crashes.

#### Edge Case 2: Baby Deleted While Selected
**Scenario:** `currentBabyId` points to baby that no longer exists

**Handling:**
- Methods filter activities normally
- No activities match the deleted baby's ID
- Components show "No activities" state gracefully
- User can switch to different baby via selector

**No special handling needed:** Graceful degradation.

#### Edge Case 3: Activities with Unknown baby_id
**Scenario:** Old activities or data migration issues

**Handling:**
- Filtering excludes them (they don't match `currentBabyId`)
- Activities remain in store (data integrity preserved)
- Don't delete or modify unknown activities

### Testing Strategy

#### 1. Update activityStore Tests
File: `src/stores/__tests__/activityStore.test.ts`

**Tests to modify:**
- Mock `useFamilyStore.getState()` to return test baby IDs
- Update `logActivity` tests to verify it uses current baby
- Update `getLastActivity` tests to verify filtering by baby
- Update `getTodayActivities` tests to verify filtering by baby

**New tests to add:**
- Test `getLastActivity()` with multiple babies (verify correct filtering)
- Test `getTodayActivities()` with multiple babies
- Test null `currentBabyId` edge cases
- Test baby switching scenario (change mock return value, verify filtering updates)
- Test `logActivity()` throws error when no baby selected

#### 2. Add Integration Tests
File: `src/stores/__tests__/activityStore.integration.test.ts` (new file)

**Integration scenarios:**
- Complete flow: set baby → log activity → verify baby_id
- Multiple babies: log for baby A → switch to baby B → verify filtered results
- Baby switching: log for baby A → switch to baby B → log for baby B → switch back to A → verify correct activities shown
- Real-time sync simulation: activity arrives for different baby, verify it doesn't appear until baby switch

#### 3. Update Screen Tests
Files:
- `src/screens/__tests__/HomeScreen.test.tsx`
- `src/screens/__tests__/TimelineScreen.test.tsx`
- `src/screens/__tests__/StatsScreen.test.tsx`

**Changes needed:**
- Mock both `useActivityStore` and `useFamilyStore`
- Verify components call store methods (which handle filtering)
- Tests should pass with minimal modifications (screens already use store methods)

**Test coverage goal:** 100% of new filtering logic + all edge cases.

## Implementation Plan

Implementation will be done in this order:

1. **Update activityStore.ts**
   - Remove `currentBabyId` from interface and state
   - Add `getCurrentBabyId()` helper
   - Update all methods with filtering logic
   - Update `reset()` method

2. **Update tests**
   - Modify existing activityStore tests
   - Add integration tests
   - Verify all tests pass

3. **Verify screen behavior**
   - Manually test HomeScreen with baby switching
   - Manually test TimelineScreen with baby switching
   - Manually test StatsScreen with baby switching
   - Update screen tests if needed

4. **Update documentation**
   - Update CLAUDE.md with new architecture
   - Update STATUS.md with completion
   - Add session notes

## Alternatives Considered

### Alternative 1: Subscribe and React Pattern
**Approach:** activityStore subscribes to familyStore changes and maintains filtered state

**Rejected because:**
- Over-engineered for the use case
- Adds subscription lifecycle complexity
- Zustand direct reads are simpler
- No clear performance benefit

### Alternative 2: Per-Baby Activity Stores
**Approach:** Separate activity collections per baby with different AsyncStorage keys

**Rejected because:**
- Breaks partner sync model (need all babies' activities)
- Adds latency to baby switching (must load from storage)
- Contradicts offline-first approach
- Much more complex to implement

## Success Metrics

✅ **Functionality:**
- Activities filter by selected baby automatically
- Baby switching is instant (no loading states)
- Partner activities sync for all babies
- No duplicate state between stores

✅ **Code Quality:**
- All existing tests pass
- New tests cover filtering logic
- No TypeScript errors
- Clean, readable code

✅ **User Experience:**
- Selecting different baby shows their activities immediately
- No delays or loading states when switching
- Partner's activities appear in real-time (when viewing their baby)

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing tests | High | Update tests incrementally, verify each change |
| Edge case: no baby selected | Medium | Defensive coding with null checks and helpful errors |
| Store coupling | Low | Acceptable - Zustand makes cross-store reads trivial |
| Performance with many activities | Low | In-memory filtering is fast; all babies together is still small dataset |

## Open Questions

None - design is approved and ready for implementation.

## Related Documents

- **Implementation Plan:** Will be created by writing-plans skill
- **Status Tracking:** STATUS.md (Phase 5 Week 4 - Task 11)
- **Setup Guide:** SETUP-CHECKLIST.md
- **Architecture Guide:** CLAUDE.md

---

**Next Step:** Create detailed implementation plan with step-by-step tasks.
