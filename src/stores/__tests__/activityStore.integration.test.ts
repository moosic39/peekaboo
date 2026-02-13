import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies BEFORE imports
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@/lib/sync', () => ({
  syncActivity: jest.fn().mockResolvedValue({ success: true }),
  deleteActivity: jest.fn().mockResolvedValue(undefined),
  fetchActivities: jest.fn(),
  subscribeToActivities: jest.fn(),
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
import * as syncService from '@/lib/sync';

describe('activityStore - Integration Tests', () => {
  beforeEach(async () => {
    // Clear store before each test
    const { result } = renderHook(() => useActivityStore());
    await act(async () => {
      result.current.reset();
    });
    jest.clearAllMocks();

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Mock sync service
    (syncService.syncActivity as jest.Mock).mockResolvedValue({ success: true });
    (syncService.deleteActivity as jest.Mock).mockResolvedValue(undefined);

    // Reset to default baby
    (useFamilyStore.getState as jest.Mock).mockReturnValue({
      currentBabyId: 'baby-a',
    });
  });

  describe('full workflow integration', () => {
    it('should handle complete multi-baby workflow from login to activity logging', async () => {
      const { result } = renderHook(() => useActivityStore());

      // Step 1: User logs in and has baby A selected by default
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      // Step 2: User logs a feeding for baby A
      let babyAFeed: any;
      act(() => {
        babyAFeed = result.current.logActivity('feed', { method: 'breast' });
      });

      expect(babyAFeed.baby_id).toBe('baby-a');
      expect(result.current.getLastActivity('feed')?.baby_id).toBe('baby-a');
      expect(result.current.getTodayActivities()).toHaveLength(1);

      // Step 3: User switches to baby B
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-b',
      });

      // Baby B should show no activities
      expect(result.current.getLastActivity('feed')).toBeNull();
      expect(result.current.getTodayActivities()).toEqual([]);

      // Step 4: User logs a diaper change for baby B
      let babyBDiaper: any;
      act(() => {
        babyBDiaper = result.current.logActivity('diaper', { type: 'wet' });
      });

      expect(babyBDiaper.baby_id).toBe('baby-b');
      expect(result.current.getLastActivity('diaper')?.baby_id).toBe('baby-b');
      expect(result.current.getTodayActivities()).toHaveLength(1);

      // Step 5: Switch back to baby A
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      // Should see baby A's feed but not baby B's diaper
      expect(result.current.getLastActivity('feed')?.id).toBe(babyAFeed.id);
      expect(result.current.getLastActivity('diaper')).toBeNull();
      expect(result.current.getTodayActivities()).toHaveLength(1);

      // Step 6: Verify sync was called for both activities
      await waitFor(() => {
        expect(syncService.syncActivity).toHaveBeenCalledTimes(2);
        expect(syncService.syncActivity).toHaveBeenCalledWith(babyAFeed);
        expect(syncService.syncActivity).toHaveBeenCalledWith(babyBDiaper);
      });

      // Step 7: Verify total activities in store (both babies)
      expect(result.current.activities).toHaveLength(2);
    });
  });

  describe('partner sync integration', () => {
    it('should handle partner syncing activities for different babies', async () => {
      const { result } = renderHook(() => useActivityStore());

      // Step 1: User has baby A selected and logs a feed
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      act(() => {
        result.current.logActivity('feed', { method: 'breast' });
      });

      expect(result.current.getTodayActivities()).toHaveLength(1);

      // Step 2: Partner logs a diaper change for baby B (comes via real-time sync)
      act(() => {
        const partnerActivity = {
          id: 'partner-activity-123',
          type: 'diaper' as const,
          timestamp: new Date().toISOString(),
          baby_id: 'baby-b',
          created_by: 'partner-user-id',
          details: { type: 'dirty' as const },
          synced: true,
        };
        // Simulate real-time subscription adding activity
        result.current.activities.push(partnerActivity);
      });

      // Step 3: User should still only see baby A's activities
      expect(result.current.getTodayActivities()).toHaveLength(1);
      expect(result.current.getTodayActivities()[0].baby_id).toBe('baby-a');

      // Step 4: User switches to baby B
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-b',
      });

      // Now should see baby B's activity from partner
      expect(result.current.getTodayActivities()).toHaveLength(1);
      expect(result.current.getTodayActivities()[0].baby_id).toBe('baby-b');
      expect(result.current.getTodayActivities()[0].created_by).toBe('partner-user-id');

      // Step 5: Verify total activities in store
      expect(result.current.activities).toHaveLength(2);
    });
  });

  describe('out-of-order activity arrival', () => {
    it('should maintain correct ordering when activities arrive out of sequence', async () => {
      const { result } = renderHook(() => useActivityStore());

      // Mock baby A selected
      (useFamilyStore.getState as jest.Mock).mockReturnValue({
        currentBabyId: 'baby-a',
      });

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Step 1: Most recent activity arrives first
      let mostRecentFeed: any;
      act(() => {
        mostRecentFeed = result.current.logActivity('feed', { method: 'breast' });
      });

      // Step 2: Older activity arrives from sync (partner logged it earlier)
      act(() => {
        const olderActivity = {
          id: 'older-activity-123',
          type: 'diaper' as const,
          timestamp: twoHoursAgo.toISOString(),
          baby_id: 'baby-a',
          created_by: 'partner',
          details: { type: 'wet' as const },
          synced: true,
        };
        result.current.activities.push(olderActivity);
      });

      // Step 3: Middle activity arrives
      act(() => {
        const middleActivity = {
          id: 'middle-activity-456',
          type: 'sleep' as const,
          timestamp: oneHourAgo.toISOString(),
          baby_id: 'baby-a',
          created_by: 'partner',
          details: { status: 'start' as const },
          synced: true,
        };
        result.current.activities.push(middleActivity);
      });

      // Step 4: Verify all activities are present
      const activities = result.current.getTodayActivities();
      expect(activities).toHaveLength(3);

      // Step 5: Verify activities are accessible by type
      // Note: The order in the array depends on insertion order when pushed manually,
      // but the store should still return the correct "last" activity by timestamp
      const allActivitiesByType = {
        feed: activities.filter(a => a.type === 'feed'),
        diaper: activities.filter(a => a.type === 'diaper'),
        sleep: activities.filter(a => a.type === 'sleep'),
      };

      expect(allActivitiesByType.feed).toHaveLength(1);
      expect(allActivitiesByType.diaper).toHaveLength(1);
      expect(allActivitiesByType.sleep).toHaveLength(1);

      // Step 6: Verify getLastActivity returns most recent of each type
      // For feed, it should be the one we just logged (most recent)
      expect(result.current.getLastActivity('feed')?.id).toBe(mostRecentFeed.id);

      // For diaper and sleep, there's only one of each, so should return those
      expect(result.current.getLastActivity('diaper')?.timestamp).toBe(twoHoursAgo.toISOString());
      expect(result.current.getLastActivity('sleep')?.timestamp).toBe(oneHourAgo.toISOString());

      // Step 7: Verify total count in store
      expect(result.current.activities).toHaveLength(3);
    });
  });
});
