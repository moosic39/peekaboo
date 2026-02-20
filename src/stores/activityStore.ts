import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { platformStorage } from '@/lib/storage';
import { Activity, ActivityType, ActivityDetails } from '@/types';
import { syncActivity, deleteActivity as deleteSyncActivity } from '@/lib/sync';
import { useFamilyStore } from './familyStore';

/**
 * Get current baby ID from familyStore
 * Returns null if no baby selected
 */
const getCurrentBabyId = (): string | null => {
  return useFamilyStore.getState().currentBabyId;
};

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

      /**
       * Log a new activity
       * - Generates unique ID and timestamp
       * - Adds to store immediately (offline-first)
       * - Syncs to Supabase in background (non-blocking)
       */
      logActivity: (type: ActivityType, details: ActivityDetails) => {
        const currentBabyId = getCurrentBabyId();

        // Defensive: shouldn't happen due to onboarding, but be safe
        if (!currentBabyId) {
          throw new Error('No baby selected. Please select a baby first.');
        }

        // Generate a RFC 4122 UUID v4 (required by the DB activities.id UUID column)
        const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

        const activity: Activity = {
          id,
          type,
          timestamp: new Date().toISOString(),
          baby_id: currentBabyId,
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
        const currentBabyId = getCurrentBabyId();
        if (!currentBabyId) return null; // Safety check

        const filtered = get().activities.filter(
          (a) => a.type === type && a.baby_id === currentBabyId
        );
        return filtered.length > 0 ? filtered[0] : null;
      },

      /**
       * Get all activities from today
       * Filters by date (midnight to now)
       */
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
      reset: () => set({ activities: [] }),
    }),
    {
      name: '@peekaboo:activities',
      storage: createJSONStorage(() => platformStorage),
    }
  )
);
