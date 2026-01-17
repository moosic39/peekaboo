/**
 * Color constants for the app
 */

/**
 * Activity-specific colors
 * Each activity type has a unique color for visual distinction
 */
export const activityColors = {
  feed: '#4A90D9',      // Blue - feeding/nutrition
  diaper: '#F5C842',    // Yellow - diaper changes
  sleep: '#9B6BC2',     // Purple - sleep tracking
  pump: '#E891B0',      // Pink - pumping sessions
  growth: '#5CB85C',    // Green - growth measurements
} as const;

/**
 * General app colors
 */
export const colors = {
  // Primary colors
  primary: '#4A90D9',
  background: '#FFFFFF',
  surface: '#F5F5F5',

  // Text colors
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',

  // UI colors
  border: '#E0E0E0',
  error: '#D32F2F',
  success: '#4CAF50',
  warning: '#FFA726',

  // Activity colors (re-exported for convenience)
  ...activityColors,
} as const;

/**
 * Type for activity color keys
 */
export type ActivityColorKey = keyof typeof activityColors;
