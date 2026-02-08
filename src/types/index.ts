/**
 * Core activity types supported by the app
 */
export type ActivityType = 'feed' | 'diaper' | 'sleep' | 'pump' | 'growth';

/**
 * Feeding activity details
 */
export interface FeedDetails {
  method: 'breast' | 'bottle' | 'both';
  amount?: number; // in ml, optional for bottle
  duration?: number; // in minutes, optional for breast
  side?: 'left' | 'right'; // for breast feeding
}

/**
 * Diaper change details
 */
export interface DiaperDetails {
  type: 'wet' | 'dirty' | 'both';
  notes?: string;
}

/**
 * Sleep activity details
 */
export interface SleepDetails {
  status: 'start' | 'end';
  duration?: number; // in minutes, calculated when ending
}

/**
 * Pumping activity details
 */
export interface PumpDetails {
  side: 'left' | 'right' | 'both';
  amount?: number; // in ml
  duration?: number; // in minutes
}

/**
 * Growth tracking details (stored in activities.details JSONB)
 */
export interface GrowthDetails {
  weight?: number; // in kg (e.g., 3.45, 12.50)
  height?: number; // in cm (e.g., 50.5, 85.0)
  headCircumference?: number; // in cm (e.g., 35.5)
  notes?: string;
}

/**
 * Union type for all activity details
 */
export type ActivityDetails =
  | FeedDetails
  | DiaperDetails
  | SleepDetails
  | PumpDetails
  | GrowthDetails;

/**
 * Base activity interface
 */
export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO 8601 format
  baby_id: string;
  created_by: string;
  details: ActivityDetails;
  notes?: string; // Optional user notes for any activity
  synced?: boolean; // Whether synced to Supabase
  created_at?: string; // ISO 8601 format
  updated_at?: string; // ISO 8601 format
}

/**
 * Baby profile interface
 */
export interface Baby {
  id: string;
  name: string;
  birthdate: string; // ISO 8601 format (stored as birth_date in DB)
  family_id: string;
  birth_weight?: number; // kg (e.g., 3.45)
  birth_height?: number; // cm (e.g., 50.5)
  birth_head_circumference?: number; // cm
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  photo_url?: string;
  created_at?: string; // ISO 8601 format
  updated_at?: string; // ISO 8601 format
}

/**
 * Family interface
 */
export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

/**
 * Growth measurement interface (separate from activities for better tracking)
 */
export interface GrowthMeasurement {
  id: string;
  baby_id: string;
  measured_at: string; // ISO 8601 format
  weight?: number; // kg (e.g., 3.45, 12.50)
  height?: number; // cm (e.g., 50.5, 85.0)
  head_circumference?: number; // cm (e.g., 35.5)
  notes?: string;
  created_by?: string;
  created_at?: string; // ISO 8601 format
  updated_at?: string; // ISO 8601 format
}

/**
 * Daily activity summary for graphing
 */
export interface DailyActivitySummary {
  baby_id: string;
  type: ActivityType;
  activity_date: string; // ISO date (YYYY-MM-DD)
  count: number;
  first_activity: string; // ISO 8601 format
  last_activity: string; // ISO 8601 format
}

/**
 * Growth trend data for charts
 */
export interface GrowthTrend {
  baby_id: string;
  measured_at: string; // ISO 8601 format
  weight?: number;
  height?: number;
  head_circumference?: number;
  previous_weight?: number;
  previous_height?: number;
  previous_head_circumference?: number;
  weight_change?: number;
  height_change?: number;
}

/**
 * Feeding statistics for a specific date
 */
export interface FeedingStats {
  baby_id: string;
  feed_date: string; // ISO date (YYYY-MM-DD)
  total_feeds: number;
  breast_feeds: number;
  bottle_feeds: number;
  mixed_feeds: number;
  total_amount_ml?: number;
  avg_duration_min?: number;
}

/**
 * Sleep statistics for a specific date
 */
export interface SleepStats {
  baby_id: string;
  sleep_date: string; // ISO date (YYYY-MM-DD)
  sleep_sessions_started: number;
  sleep_sessions_ended: number;
  total_sleep_minutes?: number;
  avg_sleep_duration?: number;
}

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * Family member role types
 */
export type FamilyMemberRole = 'admin' | 'member' | 'viewer';
