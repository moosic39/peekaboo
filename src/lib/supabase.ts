/**
 * Supabase Client Configuration
 *
 * This module initializes and exports a configured Supabase client for use throughout
 * the app. It uses expo-sqlite for session persistence (2026 best practice) and includes
 * proper error handling for missing environment variables.
 *
 * Key Features:
 * - URL polyfill for React Native compatibility
 * - expo-sqlite/localStorage for session persistence
 * - TypeScript database types
 * - Environment variable validation
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Validate required environment variables
 * Throws a descriptive error if variables are missing
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

/**
 * Supabase client instance
 *
 * Configured with:
 * - AsyncStorage for session persistence (survives app restarts)
 * - Auto-refresh tokens for seamless authentication
 * - Proper error detection
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for session persistence (2026 best practice)
    storage: AsyncStorage,
    // Automatically refresh tokens before they expire
    autoRefreshToken: true,
    // Automatically detect authentication state changes
    detectSessionInUrl: false, // Not needed for mobile apps
  },
});

/**
 * Database Types
 *
 * These types match the Supabase database schema and provide
 * type safety when interacting with the database.
 */

export interface Database {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
        };
      };
      babies: {
        Row: {
          id: string;
          family_id: string;
          name: string;
          birthdate: string;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          name: string;
          birthdate: string;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          name?: string;
          birthdate?: string;
          photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      activities: {
        Row: {
          id: string;
          baby_id: string;
          created_by: string;
          type: 'feed' | 'diaper' | 'sleep' | 'pump' | 'growth';
          timestamp: string;
          details: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          baby_id: string;
          created_by: string;
          type: 'feed' | 'diaper' | 'sleep' | 'pump' | 'growth';
          timestamp?: string;
          details?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          baby_id?: string;
          created_by?: string;
          type?: 'feed' | 'diaper' | 'sleep' | 'pump' | 'growth';
          timestamp?: string;
          details?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

/**
 * Export typed versions of database entities
 * These can be used in components and stores for type safety
 */
export type DbActivity = Database['public']['Tables']['activities']['Row'];
export type DbBaby = Database['public']['Tables']['babies']['Row'];
export type DbFamily = Database['public']['Tables']['families']['Row'];
export type DbFamilyMember = Database['public']['Tables']['family_members']['Row'];

/**
 * Helper function to check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return !error && !!session;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Helper function to get current user ID
 * Returns null if not authenticated
 *
 * DEVELOPMENT MODE: Returns 'dev-user' if no session exists
 * TODO: Remove this bypass once authentication is implemented
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      // DEVELOPMENT BYPASS: Return a test user ID for offline testing
      console.warn('No authenticated session - using development user ID');
      return 'dev-user';
    }
    return session.user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    // DEVELOPMENT BYPASS: Return test user on error
    return 'dev-user';
  }
};

/**
 * Helper function to sign out
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};
