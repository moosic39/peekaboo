import { ActivityType } from '@/types';

/**
 * Icon emojis for each activity type
 */
export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  feed: '🍼',
  diaper: '🧷',
  sleep: '😴',
  pump: '🍶',
  growth: '📏',
} as const;

/**
 * Display labels for each activity type
 */
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  feed: 'Feed',
  diaper: 'Diaper',
  sleep: 'Sleep',
  pump: 'Pump',
  growth: 'Growth',
} as const;
