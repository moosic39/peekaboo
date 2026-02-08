import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, ActivityType, ActivityDetails } from '@/types';
import { syncActivity, deleteActivity as deleteSyncActivity } from '@/lib/sync';

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

/**
 * Activity Store - Offline-first state management with Zustand
 *
 * Features:
 * - Immediate local updates (no waiting for sync)
 * - Auto-persists to AsyncStorage
 * - Background sync to Supabase
 * - Sorted newest first
 */
export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      // Initial state
      activities: [],
      // DEVELOPMENT: Using test baby ID - update once auth is implemented
      currentBabyId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',

      /**
       * Log a new activity
       * - Generates unique ID and timestamp
       * - Adds to store immediately (offline-first)
       * - Syncs to Supabase in background (non-blocking)
       */
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

        // Update store immediately (offline-first)
        set((state) => ({
          activities: [activity, ...state.activities],
        }));

        // Background sync (non-blocking, fire-and-forget)
        syncActivity(activity).catch((err) => {
          console.error('Background sync failed:', err);
        });

        return activity;
      },

      /**
       * Get most recent activity of given type
       * Returns null if no activities of that type exist
       */
      getLastActivity: (type: ActivityType) => {
        const filtered = get().activities.filter((a) => a.type === type);
        return filtered.length > 0 ? filtered[0] : null;
      },

      /**
       * Get all activities from today
       * Filters by date (midnight to now)
       */
      getTodayActivities: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        return get().activities.filter((a) => a.timestamp >= todayISO);
      },

      /**
       * Delete activity
       * - Removes from local store immediately
       * - Syncs deletion to Supabase
       * - Doesn't throw on sync failure (local delete succeeds)
       */
      deleteActivity: async (id: string) => {
        // Remove from store immediately
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        }));

        // Sync deletion to server
        try {
          await deleteSyncActivity(id);
        } catch (err) {
          console.error('Failed to delete activity from server:', err);
          // Don't re-throw - local deletion succeeded
        }
      },

      /**
       * Reset store to initial state
       * Used for testing and future logout functionality
       */
      reset: () => set({ activities: [], currentBabyId: 'default' }),
    }),
    {
      name: '@peekaboo:activities',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
