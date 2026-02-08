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

import { useActivityStore } from '../activityStore';
import * as syncService from '@/lib/sync';

describe('activityStore', () => {
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
  });

  describe('initialization', () => {
    it('should initialize with empty activities array', () => {
      const { result } = renderHook(() => useActivityStore());

      expect(result.current.activities).toEqual([]);
      expect(result.current.currentBabyId).toBe('default');
    });
  });

  describe('logActivity', () => {
    it('should add activity to store with generated ID and timestamp', () => {
      const { result } = renderHook(() => useActivityStore());

      let activity;
      act(() => {
        activity = result.current.logActivity('feed', { method: 'breast' });
      });

      expect(activity).toMatchObject({
        id: expect.stringMatching(/^\d+-[a-z0-9]+$/),
        type: 'feed',
        timestamp: expect.any(String),
        baby_id: 'default',
        created_by: 'local',
        details: { method: 'breast' },
        synced: false,
      });

      expect(result.current.activities).toHaveLength(1);
      expect(result.current.activities[0]).toEqual(activity);
    });

    it('should call syncActivity in background (non-blocking)', async () => {
      const { result } = renderHook(() => useActivityStore());

      let activity;
      act(() => {
        activity = result.current.logActivity('diaper', { type: 'wet' });
      });

      // Should be called with the activity
      await waitFor(() => {
        expect(syncService.syncActivity).toHaveBeenCalledWith(activity);
      });
    });

    it('should not throw if syncActivity fails', async () => {
      const { result } = renderHook(() => useActivityStore());
      (syncService.syncActivity as jest.Mock).mockRejectedValue(new Error('Network error'));

      let activity;
      act(() => {
        activity = result.current.logActivity('sleep', { status: 'start' });
      });

      expect(result.current.activities).toHaveLength(1);
    });

    it('should add multiple activities in chronological order (newest first)', async () => {
      const { result } = renderHook(() => useActivityStore());

      act(() => {
        result.current.logActivity('feed', { method: 'bottle' });
      });

      // Wait a tiny bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      act(() => {
        result.current.logActivity('diaper', { type: 'dirty' });
      });

      expect(result.current.activities).toHaveLength(2);
      expect(result.current.activities[0].type).toBe('diaper'); // Most recent first
      expect(result.current.activities[1].type).toBe('feed');
    });

    it('should support all activity types with correct details', () => {
      const { result } = renderHook(() => useActivityStore());

      act(() => {
        result.current.logActivity('feed', { method: 'both' });
        result.current.logActivity('diaper', { type: 'both' });
        result.current.logActivity('sleep', { status: 'end' });
        result.current.logActivity('pump', { side: 'left' });
        result.current.logActivity('growth', { weight: 15.5 });
      });

      expect(result.current.activities).toHaveLength(5);
      expect(result.current.activities.find(a => a.type === 'feed')?.details).toEqual({ method: 'both' });
      expect(result.current.activities.find(a => a.type === 'diaper')?.details).toEqual({ type: 'both' });
      expect(result.current.activities.find(a => a.type === 'sleep')?.details).toEqual({ status: 'end' });
      expect(result.current.activities.find(a => a.type === 'pump')?.details).toEqual({ side: 'left' });
      expect(result.current.activities.find(a => a.type === 'growth')?.details).toEqual({ weight: 15.5 });
    });
  });

  describe('getLastActivity', () => {
    it('should return null when no activities of given type', () => {
      const { result } = renderHook(() => useActivityStore());

      expect(result.current.getLastActivity('feed')).toBeNull();
    });

    it('should return most recent activity of given type', () => {
      const { result } = renderHook(() => useActivityStore());

      let firstFeed;
      let secondFeed;

      act(() => {
        firstFeed = result.current.logActivity('feed', { method: 'breast' });
        result.current.logActivity('diaper', { type: 'wet' });
        secondFeed = result.current.logActivity('feed', { method: 'bottle' });
      });

      const lastFeed = result.current.getLastActivity('feed');
      expect(lastFeed?.id).toBe(secondFeed.id);
      expect(lastFeed?.details).toEqual({ method: 'bottle' });
    });

    it('should return null after activities are deleted', () => {
      const { result } = renderHook(() => useActivityStore());

      let activity;
      act(() => {
        activity = result.current.logActivity('pump', { side: 'right' });
      });

      act(() => {
        result.current.deleteActivity(activity.id);
      });

      expect(result.current.getLastActivity('pump')).toBeNull();
    });
  });

  describe('getTodayActivities', () => {
    it('should return empty array when no activities', () => {
      const { result } = renderHook(() => useActivityStore());

      expect(result.current.getTodayActivities()).toEqual([]);
    });

    it('should return only activities from today', () => {
      const { result } = renderHook(() => useActivityStore());

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      act(() => {
        // Add today's activity
        result.current.logActivity('feed', { method: 'breast' });

        // Manually add yesterday's activity (simulating stored data)
        const yesterdayActivity = {
          id: 'old-123',
          type: 'feed' as const,
          timestamp: yesterday.toISOString(),
          baby_id: 'default',
          created_by: 'local',
          details: { method: 'bottle' as const },
          synced: true,
        };
        result.current.activities.push(yesterdayActivity);
      });

      const todayActivities = result.current.getTodayActivities();
      expect(todayActivities).toHaveLength(1);
      expect(todayActivities[0].type).toBe('feed');
      expect(todayActivities[0].details).toEqual({ method: 'breast' });
    });
  });

  describe('deleteActivity', () => {
    it('should remove activity from store', async () => {
      const { result } = renderHook(() => useActivityStore());

      let activity;
      act(() => {
        activity = result.current.logActivity('sleep', { status: 'start' });
      });

      expect(result.current.activities).toHaveLength(1);

      await act(async () => {
        await result.current.deleteActivity(activity.id);
      });

      expect(result.current.activities).toHaveLength(0);
    });

    it('should call sync service deleteActivity', async () => {
      const { result } = renderHook(() => useActivityStore());

      let activity;
      act(() => {
        activity = result.current.logActivity('growth', { weight: 10 });
      });

      await act(async () => {
        await result.current.deleteActivity(activity.id);
      });

      expect(syncService.deleteActivity).toHaveBeenCalledWith(activity.id);
    });

    it('should not throw if sync deletion fails', async () => {
      const { result } = renderHook(() => useActivityStore());
      (syncService.deleteActivity as jest.Mock).mockRejectedValue(new Error('Network error'));

      let activity;
      act(() => {
        activity = result.current.logActivity('diaper', { type: 'wet' });
      });

      await act(async () => {
        await expect(result.current.deleteActivity(activity.id)).resolves.not.toThrow();
      });

      // Activity should still be removed from local store
      expect(result.current.activities).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should clear all activities and reset baby ID', () => {
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
      expect(result.current.currentBabyId).toBe('default');
    });
  });

  describe('persistence', () => {
    it('should persist activities to AsyncStorage', async () => {
      const { result } = renderHook(() => useActivityStore());

      act(() => {
        result.current.logActivity('feed', { method: 'breast' });
      });

      // Wait for persistence
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          '@peekaboo:activities',
          expect.stringContaining('"type":"feed"')
        );
      });
    });
  });
});
