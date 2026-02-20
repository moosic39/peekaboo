/**
 * Color constants for the app — Dark & Premium theme
 */

/**
 * Activity-specific accent colors (bright on dark background)
 */
export const activityColors = {
  feed: '#5BA8F5',    // sky blue
  diaper: '#FFD166',  // golden amber
  sleep: '#B08CE8',   // soft lilac
  pump: '#F0A3C8',    // blush pink
  growth: '#6DD16D',  // mint green
} as const;

/**
 * Activity background tints — used for button/card backgrounds (12% opacity)
 */
export const activityColorsBg = {
  feed: 'rgba(91, 168, 245, 0.12)',
  diaper: 'rgba(255, 209, 102, 0.12)',
  sleep: 'rgba(176, 140, 232, 0.12)',
  pump: 'rgba(240, 163, 200, 0.12)',
  growth: 'rgba(109, 209, 109, 0.12)',
} as const;

/**
 * Activity border colors — used for card/button borders (35% opacity)
 */
export const activityColorsBorder = {
  feed: 'rgba(91, 168, 245, 0.35)',
  diaper: 'rgba(255, 209, 102, 0.35)',
  sleep: 'rgba(176, 140, 232, 0.35)',
  pump: 'rgba(240, 163, 200, 0.35)',
  growth: 'rgba(109, 209, 109, 0.35)',
} as const;

/**
 * General app colors
 */
export const colors = {
  // Core
  primary: '#5BA8F5',
  background: '#0D0D1A',

  // Glass surfaces
  surface: 'rgba(255, 255, 255, 0.07)',
  surfaceBorder: 'rgba(255, 255, 255, 0.12)',

  // Text
  text: '#F2F2F7',
  textSecondary: 'rgba(242, 242, 247, 0.55)',
  textLight: 'rgba(242, 242, 247, 0.30)',

  // UI
  border: 'rgba(255, 255, 255, 0.10)',
  error: '#FF6B6B',
  success: '#6DD16D',
  warning: '#FFD166',

  // Activity colors (re-exported for convenience)
  ...activityColors,
} as const;

/**
 * Type for activity color keys
 */
export type ActivityColorKey = keyof typeof activityColors;
