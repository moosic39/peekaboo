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
 * Growth tracking details
 */
export interface GrowthDetails {
  weight?: number; // in kg
  height?: number; // in cm
  headCircumference?: number; // in cm
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
  synced?: boolean; // Whether synced to Supabase
}

/**
 * Baby profile interface
 */
export interface Baby {
  id: string;
  name: string;
  birthdate: string; // ISO 8601 format
  family_id: string;
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
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name?: string;
}
