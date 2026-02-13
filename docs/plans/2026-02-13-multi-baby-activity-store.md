# Multi-Baby Activity Store Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate activityStore with familyStore to auto-filter activities by selected baby.

**Architecture:** Single source of truth pattern - familyStore owns currentBabyId, activityStore reads it on-demand.

**Tech Stack:** Zustand stores, TypeScript, Jest, React Native Testing Library

---

## Task 1: Update activityStore Tests for getCurrentBabyId Helper

**Files:**
- Modify: `src/stores/__tests__/activityStore.test.ts:4-11`
- Reference: Design doc section on testing strategy

**Step 1: Add familyStore mock to test setup**

Add after line 11 in test file:

```typescript
jest.mock('../familyStore', () => ({
  useFamilyStore: {
    getState: jest.fn(() => ({
      currentBabyId: 'test-baby-123',
    })),
  },
}));
```

**Step 2: Import useFamilyStore in tests**

Add after line 14:

```typescript
import { useFamilyStore } from '../familyStore';
```

**Step 3: Update test expectations for baby ID**

Find line 39 and change:
```typescript
expect(result.current.currentBabyId).toBe('default');
```

To:
```typescript
// currentBabyId removed from store state
```

Find line 56 and change:
```typescript
baby_id: 'default',
```

To:
```typescript
baby_id: 'test-baby-123',
```

Find line 194 and change:
```typescript
baby_id: 'default',
```

To:
```typescript
baby_id: 'test-baby-123',
```

**Step 4: Update reset() test**

Find lines 260-278 and replace with:

```typescript
describe('reset', () => {
  it('should clear all activities', () => {
    const { result } = renderHook(() => useActivityStore());

    act(() => {
      result.current.logActivity('feed', { method: 'breast' });
      result.current.logActivity('diaper', { type: 'wet' });
      result.current.logActivity('sleep', { status: 'start' });
    });

    expect(result.current.activities).toHaveLength(3);

    act(() => {
      result.current.reset();
    });

    expect(result.current.activities).toEqual([]);
    // currentBabyId no longer part of state
  });
});
```

**Step 5: Run tests to verify they fail**

Run: `npx jest src/stores/__tests__/activityStore.test.ts --no-coverage`

Expected: Multiple failures because currentBabyId still exists in store and getCurrentBabyId() doesn't exist yet.

**Step 6: Commit test changes**

```bash
git add src/stores/__tests__/activityStore.test.ts
git commit -m "test: update activityStore tests to expect familyStore integration

Prepare tests for getCurrentBabyId helper and removal of currentBabyId
from activityStore state. Tests currently fail as implementation not
updated yet (TDD approach).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Update activityStore Implementation - Remove currentBabyId

**Files:**
- Modify: `src/stores/activityStore.ts:7-18`
- Reference: Design doc section 1 (Remove currentBabyId from State)

**Step 1: Remove currentBabyId from interface**

Find lines 7-18 (ActivityStore interface) and change from:

```typescript
interface ActivityStore {
  // State
  activities: Activity[];
  currentBabyId: string;

  // Actions
  logActivity: (type: ActivityType, details: ActivityDetails) => Activity;
  getLastActivity: (type: ActivityType) => Activity | null;
  getTodayActivities: () => Activity[];
  deleteActivity: (id: string) => Promise<void>;
  reset: () => void;
}
```

To:

```typescript
interface ActivityStore {
  // State
  activities: Activity[];

  // Actions
  logActivity: (type: ActivityType, details: ActivityDetails) => Activity;
  getLastActivity: (type: ActivityType) => Activity | null;
  getTodayActivities: () => Activity[];
  deleteActivity: (id: string) => Promise<void>;
  reset: () => void;
}
```

**Step 2: Remove currentBabyId from initial state**

Find line 35 (inside store creation):

```typescript
currentBabyId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
```

Delete this line entirely.

**Step 3: Run tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts --no-coverage`

Expected: Still failing - getCurrentBabyId() not defined yet.

**Step 4: Commit**

```bash
git add src/stores/activityStore.ts
git commit -m "refactor: remove currentBabyId from activityStore state

Remove duplicate state - familyStore will be single source of truth.

Part of Phase 5 Week 4 - Multi-baby integration.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add getCurrentBabyId Helper Function

**Files:**
- Modify: `src/stores/activityStore.ts:1-6`
- Reference: Design doc section 2 (Add Helper Function)

**Step 1: Import useFamilyStore**

Change line 1-5 from:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { platformStorage } from '@/lib/storage';
import { Activity, ActivityType, ActivityDetails } from '@/types';
import { syncActivity, deleteActivity as deleteSyncActivity } from '@/lib/sync';
```

To:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { platformStorage } from '@/lib/storage';
import { Activity, ActivityType, ActivityDetails } from '@/types';
import { syncActivity, deleteActivity as deleteSyncActivity } from '@/lib/sync';
import { useFamilyStore } from './familyStore';
```

**Step 2: Add getCurrentBabyId helper**

Add after line 6 (after imports, before interface):

```typescript
/**
 * Get current baby ID from familyStore
 * Returns null if no baby selected
 */
const getCurrentBabyId = (): string | null => {
  return useFamilyStore.getState().currentBabyId;
};
```

**Step 3: Run tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts --no-coverage`

Expected: Still failing - methods not updated to use getCurrentBabyId() yet.

**Step 4: Commit**

```bash
git add src/stores/activityStore.ts
git commit -m "feat: add getCurrentBabyId helper to read from familyStore

Helper function enables activityStore to read current baby selection
from familyStore on-demand (single source of truth pattern).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update logActivity Method

**Files:**
- Modify: `src/stores/activityStore.ts:43-68`
- Reference: Design doc section 3 (Update logActivity Method)

**Step 1: Update logActivity to use getCurrentBabyId**

Find the logActivity method (around lines 43-68) and change:

```typescript
logActivity: (type: ActivityType, details: ActivityDetails) => {
  // Generate unique ID: timestamp + random suffix
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const activity: Activity = {
    id,
    type,
    timestamp: new Date().toISOString(),
    baby_id: get().currentBabyId,
    created_by: 'local',
    details,
    synced: false,
  };
```

To:

```typescript
logActivity: (type: ActivityType, details: ActivityDetails) => {
  const currentBabyId = getCurrentBabyId();

  // Defensive: shouldn't happen due to onboarding, but be safe
  if (!currentBabyId) {
    throw new Error('No baby selected. Please select a baby first.');
  }

  // Generate unique ID: timestamp + random suffix
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const activity: Activity = {
    id,
    type,
    timestamp: new Date().toISOString(),
    baby_id: currentBabyId,
    created_by: 'local',
    details,
    synced: false,
  };
```

**Step 2: Run tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts -t "logActivity" --no-coverage`

Expected: logActivity tests should now pass!

**Step 3: Commit**

```bash
git add src/stores/activityStore.ts
git commit -m "feat: update logActivity to use current baby from familyStore

Activities now logged with baby_id from familyStore.currentBabyId.
Includes defensive null check (throws error if no baby selected).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update getLastActivity Method

**Files:**
- Modify: `src/stores/activityStore.ts:70-77`
- Reference: Design doc section 4 (Update getLastActivity Method)

**Step 1: Update getLastActivity to filter by baby**

Find the getLastActivity method and change from:

```typescript
getLastActivity: (type: ActivityType) => {
  const filtered = get().activities.filter((a) => a.type === type);
  return filtered.length > 0 ? filtered[0] : null;
},
```

To:

```typescript
getLastActivity: (type: ActivityType) => {
  const currentBabyId = getCurrentBabyId();
  if (!currentBabyId) return null; // Safety check

  const filtered = get().activities.filter(
    (a) => a.type === type && a.baby_id === currentBabyId
  );
  return filtered.length > 0 ? filtered[0] : null;
},
```

**Step 2: Run tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts -t "getLastActivity" --no-coverage`

Expected: All getLastActivity tests should pass.

**Step 3: Commit**

```bash
git add src/stores/activityStore.ts
git commit -m "feat: filter getLastActivity by current baby

Method now returns last activity of given type for currently selected
baby only. Returns null if no baby selected (defensive).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update getTodayActivities Method

**Files:**
- Modify: `src/stores/activityStore.ts:79-89`
- Reference: Design doc section 5 (Update getTodayActivities Method)

**Step 1: Update getTodayActivities to filter by baby**

Find the getTodayActivities method and change from:

```typescript
getTodayActivities: () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  return get().activities.filter((a) => a.timestamp >= todayISO);
},
```

To:

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
},
```

**Step 2: Run tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts -t "getTodayActivities" --no-coverage`

Expected: All getTodayActivities tests should pass.

**Step 3: Commit**

```bash
git add src/stores/activityStore.ts
git commit -m "feat: filter getTodayActivities by current baby

Method now returns today's activities for currently selected baby only.
Returns empty array if no baby selected (defensive).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update reset Method

**Files:**
- Modify: `src/stores/activityStore.ts:112-116`
- Reference: Design doc section 6 (Update reset Method)

**Step 1: Remove currentBabyId from reset**

Find the reset method (line 116) and change from:

```typescript
reset: () => set({ activities: [], currentBabyId: 'default' }),
```

To:

```typescript
reset: () => set({ activities: [] }),
```

**Step 2: Run all activityStore tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts --no-coverage`

Expected: ALL tests should pass! ✅

**Step 3: Commit**

```bash
git add src/stores/activityStore.ts
git commit -m "refactor: remove currentBabyId from reset method

Store no longer manages currentBabyId state - removed from reset.

All activityStore tests passing. Core implementation complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Tests for Multi-Baby Filtering

**Files:**
- Modify: `src/stores/__tests__/activityStore.test.ts:131-169`
- Reference: Design doc testing strategy section 1

**Step 1: Add test for getLastActivity with multiple babies**

Add before the deleteActivity describe block (after line 169):

```typescript
describe('multi-baby filtering', () => {
  it('should filter getLastActivity by current baby', () => {
    const { result } = renderHook(() => useActivityStore());

    // Mock baby A selected
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-a',
    });

    let babyAFeed: any;
    act(() => {
      babyAFeed = result.current.logActivity('feed', { method: 'breast' });
    });

    // Manually add activity for baby B (simulating partner sync)
    act(() => {
      const babyBFeed = {
        id: 'baby-b-feed',
        type: 'feed' as const,
        timestamp: new Date().toISOString(),
        baby_id: 'baby-b',
        created_by: 'partner',
        details: { method: 'bottle' as const },
        synced: true,
      };
      result.current.activities.push(babyBFeed);
    });

    // Should only return baby A's feed
    const lastFeed = result.current.getLastActivity('feed');
    expect(lastFeed?.id).toBe(babyAFeed.id);
    expect(lastFeed?.baby_id).toBe('baby-a');
  });

  it('should filter getTodayActivities by current baby', () => {
    const { result } = renderHook(() => useActivityStore());

    // Mock baby A selected
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-a',
    });

    act(() => {
      result.current.logActivity('feed', { method: 'breast' });
      result.current.logActivity('diaper', { type: 'wet' });
    });

    // Mock baby B selected
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-b',
    });

    act(() => {
      result.current.logActivity('sleep', { status: 'start' });
    });

    // Switch back to baby A
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-a',
    });

    const todayActivities = result.current.getTodayActivities();
    expect(todayActivities).toHaveLength(2);
    expect(todayActivities.every(a => a.baby_id === 'baby-a')).toBe(true);
  });

  it('should handle baby switching correctly', () => {
    const { result } = renderHook(() => useActivityStore());

    // Start with baby A
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-a',
    });

    act(() => {
      result.current.logActivity('feed', { method: 'breast' });
    });

    // Switch to baby B
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-b',
    });

    // Baby B should have no activities
    expect(result.current.getLastActivity('feed')).toBeNull();
    expect(result.current.getTodayActivities()).toEqual([]);

    // Log activity for baby B
    act(() => {
      result.current.logActivity('feed', { method: 'bottle' });
    });

    // Now baby B should have one activity
    expect(result.current.getLastActivity('feed')?.baby_id).toBe('baby-b');
    expect(result.current.getTodayActivities()).toHaveLength(1);
  });
});
```

**Step 2: Run new tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts -t "multi-baby filtering" --no-coverage`

Expected: All 3 new tests should pass.

**Step 3: Commit**

```bash
git add src/stores/__tests__/activityStore.test.ts
git commit -m "test: add multi-baby filtering test coverage

Tests verify:
- getLastActivity filters by current baby
- getTodayActivities filters by current baby
- Baby switching updates filtered results correctly

All tests passing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add Tests for Edge Cases

**Files:**
- Modify: `src/stores/__tests__/activityStore.test.ts` (add after multi-baby filtering)
- Reference: Design doc error handling section

**Step 1: Add edge case tests**

Add after the multi-baby filtering describe block:

```typescript
describe('edge cases', () => {
  it('should throw error when logging activity with no baby selected', () => {
    const { result } = renderHook(() => useActivityStore());

    // Mock no baby selected
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: null,
    });

    expect(() => {
      act(() => {
        result.current.logActivity('feed', { method: 'breast' });
      });
    }).toThrow('No baby selected. Please select a baby first.');
  });

  it('should return null from getLastActivity when no baby selected', () => {
    const { result } = renderHook(() => useActivityStore());

    // Mock no baby selected
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: null,
    });

    expect(result.current.getLastActivity('feed')).toBeNull();
  });

  it('should return empty array from getTodayActivities when no baby selected', () => {
    const { result } = renderHook(() => useActivityStore());

    // Mock no baby selected
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: null,
    });

    expect(result.current.getTodayActivities()).toEqual([]);
  });

  it('should gracefully handle activities with unknown baby_id', () => {
    const { result } = renderHook(() => useActivityStore());

    // Mock baby A selected
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-a',
    });

    // Manually add activity with unknown baby_id
    act(() => {
      const unknownBabyActivity = {
        id: 'unknown-123',
        type: 'feed' as const,
        timestamp: new Date().toISOString(),
        baby_id: 'unknown-baby-id',
        created_by: 'migration',
        details: { method: 'breast' as const },
        synced: true,
      };
      result.current.activities.push(unknownBabyActivity);
    });

    // Should not appear in filtered results
    expect(result.current.getLastActivity('feed')).toBeNull();
    expect(result.current.getTodayActivities()).toEqual([]);

    // But activity should still be in store (data integrity)
    expect(result.current.activities).toHaveLength(1);
  });
});
```

**Step 2: Run edge case tests**

Run: `npx jest src/stores/__tests__/activityStore.test.ts -t "edge cases" --no-coverage`

Expected: All 4 edge case tests should pass.

**Step 3: Run complete test suite**

Run: `npx jest src/stores/__tests__/activityStore.test.ts --no-coverage`

Expected: All tests passing (original 16 + 3 multi-baby + 4 edge cases = 23 total).

**Step 4: Commit**

```bash
git add src/stores/__tests__/activityStore.test.ts
git commit -m "test: add edge case coverage for multi-baby integration

Tests verify defensive behavior:
- Throws error when logging with no baby selected
- Returns null/empty for queries with no baby selected
- Preserves activities with unknown baby_ids (data integrity)

23 tests passing. Test coverage complete.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Add Integration Tests

**Files:**
- Create: `src/stores/__tests__/activityStore.integration.test.ts`
- Reference: Design doc testing strategy section 2

**Step 1: Create integration test file**

```typescript
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/lib/sync', () => ({
  syncActivity: jest.fn().mockResolvedValue({ success: true }),
  deleteActivity: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../familyStore', () => ({
  useFamilyStore: {
    getState: jest.fn(() => ({
      currentBabyId: 'baby-a',
    })),
  },
}));

import { useActivityStore } from '../activityStore';
import { useFamilyStore } from '../familyStore';

describe('activityStore - Integration Tests', () => {
  beforeEach(async () => {
    // Reset store
    const { result } = renderHook(() => useActivityStore());
    await act(async () => {
      result.current.reset();
    });
    jest.clearAllMocks();

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Reset familyStore mock to baby-a
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-a',
    });
  });

  describe('complete multi-baby workflow', () => {
    it('should handle full family workflow: create babies, log activities, switch babies', () => {
      const { result } = renderHook(() => useActivityStore());

      // Step 1: Parent creates family, adds baby A
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      // Step 2: Log activities for baby A
      act(() => {
        result.current.logActivity('feed', { method: 'breast' });
        result.current.logActivity('diaper', { type: 'wet' });
        result.current.logActivity('sleep', { status: 'start' });
      });

      expect(result.current.getTodayActivities()).toHaveLength(3);
      expect(result.current.getLastActivity('feed')?.baby_id).toBe('baby-a');

      // Step 3: Add baby B to family
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-b',
      });

      // Step 4: Log activities for baby B
      act(() => {
        result.current.logActivity('feed', { method: 'bottle' });
        result.current.logActivity('pump', { side: 'left' });
      });

      // Should only see baby B's activities
      expect(result.current.getTodayActivities()).toHaveLength(2);
      expect(result.current.getLastActivity('feed')?.baby_id).toBe('baby-b');
      expect(result.current.getLastActivity('feed')?.details).toEqual({ method: 'bottle' });

      // Step 5: Switch back to baby A
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      // Should see baby A's activities again
      expect(result.current.getTodayActivities()).toHaveLength(3);
      expect(result.current.getLastActivity('feed')?.details).toEqual({ method: 'breast' });

      // Step 6: Verify all activities stored (both babies)
      expect(result.current.activities).toHaveLength(5);
    });

    it('should handle partner sync scenario correctly', () => {
      const { result } = renderHook(() => useActivityStore());

      // We're viewing baby A
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      // Log activity for baby A
      act(() => {
        result.current.logActivity('feed', { method: 'breast' });
      });

      expect(result.current.getTodayActivities()).toHaveLength(1);

      // Partner logs activity for baby B (real-time sync simulation)
      act(() => {
        const partnerActivity = {
          id: 'partner-123',
          type: 'diaper' as const,
          timestamp: new Date().toISOString(),
          baby_id: 'baby-b',
          created_by: 'partner',
          details: { type: 'dirty' as const },
          synced: true,
        };
        result.current.activities.unshift(partnerActivity);
      });

      // Our view shouldn't change (still viewing baby A)
      expect(result.current.getTodayActivities()).toHaveLength(1);
      expect(result.current.getTodayActivities()[0].baby_id).toBe('baby-a');

      // But activity is in store (available when we switch)
      expect(result.current.activities).toHaveLength(2);

      // Switch to baby B
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-b',
      });

      // Partner's activity appears immediately (no fetch needed)
      expect(result.current.getTodayActivities()).toHaveLength(1);
      expect(result.current.getLastActivity('diaper')?.created_by).toBe('partner');
    });

    it('should maintain filtering when activities arrive out of order', () => {
      const { result } = renderHook(() => useActivityStore());

      // Baby A selected
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      act(() => {
        result.current.logActivity('feed', { method: 'breast' });
      });

      // Switch to baby B
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-b',
      });

      act(() => {
        result.current.logActivity('feed', { method: 'bottle' });
      });

      // Manually add old activity for baby A (simulating late sync)
      act(() => {
        const oldActivity = {
          id: 'old-123',
          type: 'diaper' as const,
          timestamp: new Date(Date.now() - 60000).toISOString(), // 1 min ago
          baby_id: 'baby-a',
          created_by: 'sync',
          details: { type: 'wet' as const },
          synced: true,
        };
        result.current.activities.push(oldActivity);
      });

      // Baby B view should be unaffected
      expect(result.current.getTodayActivities()).toHaveLength(1);
      expect(result.current.getTodayActivities()[0].baby_id).toBe('baby-b');

      // Switch to baby A
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      // Should see both baby A activities
      expect(result.current.getTodayActivities()).toHaveLength(2);
      expect(result.current.getTodayActivities().every(a => a.baby_id === 'baby-a')).toBe(true);
    });
  });
});
```

**Step 2: Run integration tests**

Run: `npx jest src/stores/__tests__/activityStore.integration.test.ts --no-coverage`

Expected: All 3 integration tests should pass.

**Step 3: Run complete test suite**

Run: `npx jest src/stores/__tests__/ --no-coverage`

Expected: All unit tests + integration tests passing.

**Step 4: Commit**

```bash
git add src/stores/__tests__/activityStore.integration.test.ts
git commit -m "test: add integration tests for multi-baby workflows

Integration scenarios:
- Full family workflow (create, log, switch babies)
- Partner sync simulation (activities for different babies)
- Out-of-order activity arrival (late sync)

All tests passing. Multi-baby integration fully tested.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update Screen Tests (HomeScreen)

**Files:**
- Modify: `src/screens/__tests__/HomeScreen.test.tsx:1-20`
- Reference: Design doc testing strategy section 3

**Step 1: Add familyStore mock to HomeScreen tests**

Find the mock section (around lines 5-20) and add:

```typescript
jest.mock('@/stores/familyStore', () => ({
  useFamilyStore: jest.fn(() => ({
    currentBabyId: 'test-baby-123',
    babies: [],
    families: [],
  })),
}));
```

**Step 2: Run HomeScreen tests**

Run: `npx jest src/screens/__tests__/HomeScreen.test.tsx --no-coverage`

Expected: All tests should pass (screens already use store methods which now handle filtering).

**Step 3: Commit if changes needed**

```bash
git add src/screens/__tests__/HomeScreen.test.tsx
git commit -m "test: add familyStore mock to HomeScreen tests

HomeScreen tests now mock familyStore for multi-baby context.
All tests passing without changes (screens use store methods).

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Update Screen Tests (TimelineScreen & StatsScreen)

**Files:**
- Modify: `src/screens/__tests__/TimelineScreen.test.tsx`
- Modify: `src/screens/__tests__/StatsScreen.test.tsx`

**Step 1: Add familyStore mock to TimelineScreen**

Add the same mock as in Task 11:

```typescript
jest.mock('@/stores/familyStore', () => ({
  useFamilyStore: jest.fn(() => ({
    currentBabyId: 'test-baby-123',
    babies: [],
    families: [],
  })),
}));
```

**Step 2: Add familyStore mock to StatsScreen**

Add the same mock:

```typescript
jest.mock('@/stores/familyStore', () => ({
  useFamilyStore: jest.fn(() => ({
    currentBabyId: 'test-baby-123',
    babies: [],
    families: [],
  })),
}));
```

**Step 3: Run all screen tests**

Run: `npx jest src/screens/__tests__/ --no-coverage`

Expected: All screen tests passing.

**Step 4: Commit**

```bash
git add src/screens/__tests__/TimelineScreen.test.tsx src/screens/__tests__/StatsScreen.test.tsx
git commit -m "test: add familyStore mocks to all screen tests

All screen tests now include familyStore context for multi-baby
support. Tests passing without changes to test logic.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Run Complete Test Suite

**Files:**
- None (verification step)

**Step 1: Run all tests**

Run: `npx jest --no-coverage`

Expected: All tests passing across the entire project.

**Step 2: Check test count**

Expected test count should be approximately:
- activityStore unit: 23 tests
- activityStore integration: 3 tests
- familyStore: 21 tests
- auth screens: 36 tests
- form components: 26 tests
- other components: 66 tests
- screen tests: ~30 tests
- **Total: ~205 tests passing**

**Step 3: Run with coverage**

Run: `npx jest --coverage`

Expected: High coverage for activityStore (>95%).

**Step 4: Document results**

If all tests pass, no commit needed. Move to next task.

If any tests fail, fix them before proceeding.

---

## Task 14: Manual Testing - Baby Switching

**Files:**
- None (manual testing)

**Step 1: Start development server**

Run: `npx expo start`

**Step 2: Test baby switching flow**

1. Sign in to app
2. Ensure you have 2+ babies in your family (use Settings → Add Baby if needed)
3. Log some activities (feed, diaper, sleep)
4. Open BabySelector (should be available on HomeScreen after Task 12 of main implementation)
5. Switch to different baby
6. Verify activities change (should show empty state or different baby's activities)
7. Log new activity for new baby
8. Switch back to first baby
9. Verify first baby's activities appear again

**Step 3: Test edge cases**

1. Try logging activity with only 1 baby (should work normally)
2. Verify partner sync: Have partner log activity, verify it appears when you switch to that baby

**Step 4: Document issues**

If any issues found, create GitHub issues or fix immediately.

---

## Task 15: Update CLAUDE.md Documentation

**Files:**
- Modify: `CLAUDE.md` (Architecture section)

**Step 1: Update State Management section**

Find the "State Management" section in CLAUDE.md and update the Activity Store description:

Change from:
```markdown
**Activity Store (Zustand):** `src/stores/activityStore.ts`
- Activity logging and history
- Methods: `logActivity()`, `getLastActivity()`, `getTodayActivities()`, `deleteActivity()`
- Persists to AsyncStorage with @peekaboo:activities key
- Real-time sync integration point
- Uses `familyStore.currentBabyId` to scope activities
```

To:
```markdown
**Activity Store (Zustand):** `src/stores/activityStore.ts`
- Activity logging and history filtered by current baby
- Methods: `logActivity()`, `getLastActivity()`, `getTodayActivities()`, `deleteActivity()`
- Persists all babies' activities to AsyncStorage with @peekaboo:activities key
- Real-time sync integration point (syncs all babies for partner collaboration)
- Reads `familyStore.currentBabyId` on-demand for filtering (single source of truth)
- Auto-filters query results by selected baby (instant baby switching)
- Defensive null checks for edge cases (no baby selected)
```

**Step 2: Add architecture note**

Add new subsection under "State Management":

```markdown
**Multi-Baby Architecture:**
- `familyStore.currentBabyId` is the single source of truth for baby selection
- `activityStore` reads current baby ID on-demand (no subscription needed)
- All activities stored together in memory (enables fast switching + partner sync)
- Query methods (`getLastActivity`, `getTodayActivities`) auto-filter by current baby
- Baby switching is instant (no refetch required - all data already in memory)
- Partner activities sync for all babies, filtered by UI based on selection
```

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with multi-baby architecture

Document single source of truth pattern and filtering behavior.
Clarify how activityStore integrates with familyStore.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 16: Update STATUS.md

**Files:**
- Modify: `STATUS.md`

**Step 1: Mark Task 11 as complete**

Find "Phase 5: Week 4" section and change:

```markdown
- [ ] **Task 11:** Update Activity Store for Multi-Baby Support
  - [ ] Remove hardcoded baby ID from activityStore
  - [ ] Get currentBabyId from familyStore
  - [ ] Subscribe to familyStore baby changes
  - [ ] Update tests
```

To:

```markdown
- [x] **Task 11:** Update Activity Store for Multi-Baby Support
  - [x] Remove hardcoded baby ID from activityStore
  - [x] Get currentBabyId from familyStore (on-demand, no subscription)
  - [x] Filter activities by current baby in query methods
  - [x] Update tests (23 unit + 3 integration tests)
  - [x] Update screen tests with familyStore mocks
  - [x] All tests passing (~205 total)
```

**Step 2: Add session notes**

Add to Session Notes section at bottom:

```markdown
Session 12 (2026-02-13):
- Completed Task 11: Update Activity Store for Multi-Baby Support
- Implemented single source of truth pattern:
  * Removed currentBabyId from activityStore state
  * Added getCurrentBabyId() helper to read from familyStore
  * Updated logActivity to use current baby ID
  * Added filtering to getLastActivity and getTodayActivities
  * Defensive null checks for edge cases
- Test coverage:
  * Updated 16 existing unit tests
  * Added 7 new tests (3 multi-baby + 4 edge cases)
  * Created 3 integration tests
  * Updated screen test mocks
  * 205+ tests passing
- Architecture validated:
  * All activities stored together (fast switching)
  * Query methods auto-filter by current baby
  * Partner sync works seamlessly
  * No refetch needed when switching babies
- Documentation updated in CLAUDE.md
Next: Task 12 - Add BabySelector to main screens
```

**Step 3: Update progress tracker**

Find the progress tracker table and update:

```markdown
| Phase 5 Week 4: Integration | 🚧 In Progress | 25% (1/4 tasks) |
```

**Step 4: Commit**

```bash
git add STATUS.md
git commit -m "docs: update STATUS.md - Task 11 complete

Mark Phase 5 Week 4 Task 11 as complete:
- Activity store multi-baby integration done
- 26 tests added (23 unit + 3 integration)
- All tests passing
- Architecture validated

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Summary

**Implementation complete for Task 11!**

**What was accomplished:**
1. ✅ Removed duplicate `currentBabyId` state from activityStore
2. ✅ Implemented `getCurrentBabyId()` helper to read from familyStore
3. ✅ Updated all methods to filter by current baby
4. ✅ Added comprehensive test coverage (26 new tests)
5. ✅ Updated screen tests with familyStore mocks
6. ✅ Verified all ~205 tests passing
7. ✅ Updated documentation (CLAUDE.md and STATUS.md)

**Architecture:**
- Single source of truth: `familyStore.currentBabyId`
- On-demand reads (no subscription complexity)
- All activities in memory (fast switching)
- Auto-filtering in query methods
- Partner sync works seamlessly

**Next Steps:**
- **Task 12:** Add BabySelector to main screens (HomeScreen, TimelineScreen, StatsScreen)
- **Task 13:** Integration testing and edge cases
- **Task 14:** Final documentation updates

**Files Modified:**
- `src/stores/activityStore.ts` (core implementation)
- `src/stores/__tests__/activityStore.test.ts` (unit tests)
- `src/stores/__tests__/activityStore.integration.test.ts` (new file)
- `src/screens/__tests__/HomeScreen.test.tsx` (mocks)
- `src/screens/__tests__/TimelineScreen.test.tsx` (mocks)
- `src/screens/__tests__/StatsScreen.test.tsx` (mocks)
- `CLAUDE.md` (architecture docs)
- `STATUS.md` (progress tracking)

**Commits:** 16 commits following TDD approach

---

**Ready for execution!** Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan.
