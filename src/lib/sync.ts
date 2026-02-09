/**
 * Sync Service
 *
 * This module provides offline-first synchronization between local state (Zustand)
 * and Supabase. It implements a simple queue pattern for retry logic and provides
 * real-time subscription capabilities for partner sync.
 *
 * Key Features:
 * - Offline-first: Activities are logged locally first, then synced
 * - Retry logic: Failed syncs are queued and retried
 * - Real-time subscriptions: Partners see updates instantly
 * - Error handling: Graceful degradation when offline
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, getCurrentUserId } from './supabase';
import type { Activity, Baby, Family } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Storage key for pending activities queue
 */
const PENDING_QUEUE_KEY = '@peekaboo:pending_activities';

/**
 * Interface for pending activity in sync queue
 */
interface PendingActivity {
  activity: Activity;
  retryCount: number;
  lastAttempt: string;
}

/**
 * Subscribe to real-time activity updates for a baby
 *
 * This function sets up a real-time subscription to the activities table,
 * filtered by baby_id. When an activity is inserted, updated, or deleted,
 * the provided callback is invoked with the new data.
 *
 * @param babyId - The baby ID to subscribe to
 * @param onInsert - Callback when a new activity is logged
 * @param onUpdate - Callback when an activity is updated
 * @param onDelete - Callback when an activity is deleted
 * @returns Cleanup function to unsubscribe
 *
 * @example
 * const unsubscribe = subscribeToActivities(
 *   babyId,
 *   (activity) => console.log('New activity:', activity),
 *   (activity) => console.log('Updated activity:', activity),
 *   (id) => console.log('Deleted activity:', id)
 * );
 *
 * // Later, when component unmounts:
 * unsubscribe();
 */
export const subscribeToActivities = (
  babyId: string,
  onInsert?: (activity: Activity) => void,
  onUpdate?: (activity: Activity) => void,
  onDelete?: (activityId: string) => void
): (() => void) => {
  let channel: RealtimeChannel | null = null;

  try {
    // Create a channel for this baby's activities
    channel = supabase
      .channel(`activities:baby_id=eq.${babyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `baby_id=eq.${babyId}`,
        },
        (payload) => {
          if (onInsert && payload.new) {
            // Transform database row to Activity type
            const activity = dbActivityToActivity(payload.new as any);
            onInsert(activity);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'activities',
          filter: `baby_id=eq.${babyId}`,
        },
        (payload) => {
          if (onUpdate && payload.new) {
            const activity = dbActivityToActivity(payload.new as any);
            onUpdate(activity);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'activities',
          filter: `baby_id=eq.${babyId}`,
        },
        (payload) => {
          if (onDelete && payload.old) {
            onDelete((payload.old as any).id);
          }
        }
      )
      .subscribe();

    console.log(`Subscribed to activities for baby: ${babyId}`);
  } catch (error) {
    console.error('Error subscribing to activities:', error);
  }

  // Return cleanup function
  return () => {
    if (channel) {
      supabase.removeChannel(channel);
      console.log(`Unsubscribed from activities for baby: ${babyId}`);
    }
  };
};

/**
 * Sync a single activity to Supabase
 *
 * This is the core sync function. It attempts to insert the activity into
 * Supabase. If it fails, the activity is added to the pending queue for retry.
 *
 * @param activity - The activity to sync
 * @returns Promise<boolean> - true if synced successfully, false otherwise
 *
 * @example
 * const success = await syncActivity(activity);
 * if (success) {
 *   console.log('Activity synced!');
 * } else {
 *   console.log('Activity queued for retry');
 * }
 */
export const syncActivity = async (activity: Activity): Promise<boolean> => {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('Cannot sync activity: User not authenticated');
      await addToPendingQueue(activity);
      return false;
    }

    // Insert activity into Supabase
    const { error } = await supabase.from('activities').insert({
      id: activity.id,
      baby_id: activity.baby_id,
      created_by: userId,
      type: activity.type,
      timestamp: activity.timestamp,
      details: activity.details,
    });

    if (error) {
      console.error('Error syncing activity:', error);
      await addToPendingQueue(activity);
      return false;
    }

    console.log('Activity synced successfully:', activity.id);
    return true;
  } catch (error) {
    console.error('Unexpected error syncing activity:', error);
    await addToPendingQueue(activity);
    return false;
  }
};

/**
 * Fetch activities for a baby from Supabase
 *
 * This function retrieves all activities for a specific baby, ordered by
 * timestamp (most recent first). Use this to populate the initial state
 * or refresh the activity list.
 *
 * @param babyId - The baby ID to fetch activities for
 * @param limit - Optional limit on number of activities (default: 100)
 * @returns Promise<Activity[]> - Array of activities
 *
 * @example
 * const activities = await fetchActivities(babyId);
 * console.log(`Fetched ${activities.length} activities`);
 */
export const fetchActivities = async (
  babyId: string,
  limit: number = 100
): Promise<Activity[]> => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('baby_id', babyId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    // Transform database rows to Activity type
    return (data || []).map(dbActivityToActivity);
  } catch (error) {
    console.error('Unexpected error fetching activities:', error);
    return [];
  }
};

/**
 * Delete an activity from Supabase
 *
 * @param activityId - The activity ID to delete
 * @returns Promise<boolean> - true if deleted successfully
 */
export const deleteActivity = async (activityId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('Error deleting activity:', error);
      return false;
    }

    console.log('Activity deleted successfully:', activityId);
    return true;
  } catch (error) {
    console.error('Unexpected error deleting activity:', error);
    return false;
  }
};

/**
 * Sync all pending activities from the queue
 *
 * This function processes the pending queue, attempting to sync each activity.
 * Activities that fail after MAX_RETRIES are removed from the queue.
 * Call this when the app comes online or on app startup.
 *
 * @returns Promise<number> - Number of activities successfully synced
 *
 * @example
 * const synced = await syncPendingActivities();
 * console.log(`Synced ${synced} pending activities`);
 */
export const syncPendingActivities = async (): Promise<number> => {
  const MAX_RETRIES = 5;
  let syncedCount = 0;

  try {
    // Get pending queue
    const queue = await getPendingQueue();
    if (queue.length === 0) {
      console.log('No pending activities to sync');
      return 0;
    }

    console.log(`Syncing ${queue.length} pending activities...`);

    // Process each pending activity
    const newQueue: PendingActivity[] = [];
    for (const pending of queue) {
      const success = await syncActivity(pending.activity);

      if (success) {
        syncedCount++;
      } else if (pending.retryCount < MAX_RETRIES) {
        // Keep in queue for retry
        newQueue.push({
          ...pending,
          retryCount: pending.retryCount + 1,
          lastAttempt: new Date().toISOString(),
        });
      } else {
        // Max retries reached, drop from queue
        console.warn(
          `Max retries reached for activity ${pending.activity.id}, dropping from queue`
        );
      }
    }

    // Save updated queue
    await savePendingQueue(newQueue);
    console.log(
      `Sync complete: ${syncedCount} synced, ${newQueue.length} still pending`
    );

    return syncedCount;
  } catch (error) {
    console.error('Error syncing pending activities:', error);
    return syncedCount;
  }
};

/**
 * Join a family using an invite code
 *
 * @param inviteCode - The 6-character invite code
 * @returns Promise<Family | null> - The family if joined successfully
 */
export const joinFamilyByCode = async (
  inviteCode: string
): Promise<Family | null> => {
  try {
    // Get current user ID
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn('Cannot join family: User not authenticated');
      return null;
    }

    // Find family by invite code
    const { data: families, error: familyError } = await supabase
      .from('families')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (familyError || !families) {
      console.error('Family not found:', familyError);
      return null;
    }

    // Add user to family_members
    const { error: memberError } = await supabase.from('family_members').insert({
      family_id: families.id,
      user_id: userId,
      role: 'member',
    });

    if (memberError) {
      console.error('Error joining family:', memberError);
      return null;
    }

    console.log('Successfully joined family:', families.name);
    return families as Family;
  } catch (error) {
    console.error('Unexpected error joining family:', error);
    return null;
  }
};

/**
 * Fetch families the current user belongs to
 *
 * @returns Promise<Family[]> - Array of families
 */
export const fetchUserFamilies = async (): Promise<Family[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('family_members')
      .select('families(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching families:', error);
      return [];
    }

    return (data || []).map((item: any) => item.families as Family);
  } catch (error) {
    console.error('Unexpected error fetching families:', error);
    return [];
  }
};

/**
 * Fetch babies for a family
 *
 * @param familyId - The family ID
 * @returns Promise<Baby[]> - Array of babies
 */
export const fetchFamilyBabies = async (familyId: string): Promise<Baby[]> => {
  try {
    const { data, error } = await supabase
      .from('babies')
      .select('*')
      .eq('family_id', familyId);

    if (error) {
      console.error('Error fetching babies:', error);
      return [];
    }

    return (data || []) as Baby[];
  } catch (error) {
    console.error('Unexpected error fetching babies:', error);
    return [];
  }
};

/**
 * Create a new family
 * - Generates unique invite code
 * - Creates family and adds current user as admin
 * - Returns the created family
 */
export const createFamily = async (name: string): Promise<Family | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.error('Cannot create family: User not authenticated');
      return null;
    }

    // Generate 6-character uppercase invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({ name, invite_code: inviteCode })
      .select()
      .single();

    if (familyError || !family) {
      console.error('Error creating family:', familyError);
      return null;
    }

    // Add current user as admin
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: family.id,
        user_id: userId,
        role: 'admin',
      });

    if (memberError) {
      console.error('Error adding user to family:', memberError);
      // Family was created but membership failed - still return the family
    }

    return family as Family;
  } catch (error) {
    console.error('Unexpected error creating family:', error);
    return null;
  }
};

/**
 * Create a new baby profile
 * - Adds baby to specified family
 * - Returns the created baby
 */
export const createBaby = async (
  familyId: string,
  name: string,
  birthdate: string,
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
): Promise<Baby | null> => {
  try {
    const { data, error } = await supabase
      .from('babies')
      .insert({
        family_id: familyId,
        name,
        birthdate,
        gender,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Error creating baby:', error);
      return null;
    }

    return data as Baby;
  } catch (error) {
    console.error('Unexpected error creating baby:', error);
    return null;
  }
};

// ============================================
// INTERNAL HELPER FUNCTIONS
// ============================================

/**
 * Transform database activity row to Activity type
 */
function dbActivityToActivity(dbActivity: any): Activity {
  return {
    id: dbActivity.id,
    type: dbActivity.type,
    timestamp: dbActivity.timestamp,
    baby_id: dbActivity.baby_id,
    created_by: dbActivity.created_by,
    details: dbActivity.details,
    synced: true,
  };
}

/**
 * Get pending activities queue from storage
 */
async function getPendingQueue(): Promise<PendingActivity[]> {
  try {
    const json = await AsyncStorage.getItem(PENDING_QUEUE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error reading pending queue:', error);
    return [];
  }
}

/**
 * Save pending activities queue to storage
 */
async function savePendingQueue(queue: PendingActivity[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving pending queue:', error);
  }
}

/**
 * Add an activity to the pending queue
 */
async function addToPendingQueue(activity: Activity): Promise<void> {
  try {
    const queue = await getPendingQueue();

    // Check if activity already in queue
    const exists = queue.some((p) => p.activity.id === activity.id);
    if (exists) {
      console.log('Activity already in pending queue:', activity.id);
      return;
    }

    // Add to queue
    queue.push({
      activity,
      retryCount: 0,
      lastAttempt: new Date().toISOString(),
    });

    await savePendingQueue(queue);
    console.log('Activity added to pending queue:', activity.id);
  } catch (error) {
    console.error('Error adding to pending queue:', error);
  }
}
