import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { platformStorage } from '@/lib/storage';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthStore {
  // State
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Actions
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

/**
 * Auth Store - Authentication state management with Zustand
 *
 * Features:
 * - Supabase auth integration (email/password)
 * - Auto-persists session to AsyncStorage
 * - Auth state listener for session changes
 * - Email verification requirement
 * - Password reset functionality
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      loading: false,
      error: null,

      /**
       * Sign up with email and password
       * - Creates new user account
       * - Sends email verification link
       * - Returns true on success
       */
      signUp: async (email: string, password: string) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              // Redirect URL after email verification (for web)
              emailRedirectTo: typeof window !== 'undefined' && window.location
                ? window.location.origin
                : undefined,
            },
          });

          if (error) {
            set({ loading: false, error: error.message });
            return false;
          }

          if (!data.user) {
            set({ loading: false, error: 'Failed to create account' });
            return false;
          }

          // Note: User won't be signed in until email is verified
          set({ loading: false });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          set({ loading: false, error: message });
          return false;
        }
      },

      /**
       * Sign in with email and password
       * - Validates credentials with Supabase
       * - Checks email verification status
       * - Returns true on success
       */
      signIn: async (email: string, password: string) => {
        set({ loading: true, error: null });

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ loading: false, error: error.message });
            return false;
          }

          if (!data.session || !data.user) {
            set({ loading: false, error: 'Failed to sign in' });
            return false;
          }

          // Check if email is verified
          if (!data.user.email_confirmed_at) {
            set({ loading: false, error: 'Please check your email to verify your account' });
            // Sign out the user since email is not verified
            await supabase.auth.signOut();
            return false;
          }

          // Session is automatically updated via auth state listener
          set({ loading: false });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          set({ loading: false, error: message });
          return false;
        }
      },

      /**
       * Sign out current user
       * - Clears session from Supabase and AsyncStorage
       * - Resets other stores via their reset methods
       */
      signOut: async () => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase.auth.signOut();

          if (error) {
            set({ loading: false, error: error.message });
            throw error;
          }

          // Clear auth state
          set({ user: null, session: null, loading: false });

          // Reset other stores
          // Note: These imports are dynamic to avoid circular dependencies
          try {
            const { useActivityStore } = require('./activityStore');
            useActivityStore.getState().reset();
          } catch (err) {
            console.warn('Could not reset activityStore:', err);
          }

          try {
            const { useFamilyStore } = require('./familyStore');
            useFamilyStore.getState().reset();
          } catch (err) {
            console.warn('Could not reset familyStore:', err);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          set({ loading: false, error: message });
          throw err;
        }
      },

      /**
       * Send password reset email
       * - Sends reset link to user's email
       * - Returns true on success
       */
      resetPassword: async (email: string) => {
        set({ loading: true, error: null });

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: typeof window !== 'undefined' && window.location
              ? `${window.location.origin}/reset-password`
              : undefined,
          });

          if (error) {
            set({ loading: false, error: error.message });
            return false;
          }

          set({ loading: false });
          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'An unexpected error occurred';
          set({ loading: false, error: message });
          return false;
        }
      },

      /**
       * Initialize auth state
       * - Checks for existing session
       * - Sets up auth state change listener
       * - Should be called on app startup
       */
      initializeAuth: async () => {
        set({ loading: true });

        try {
          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('Error getting session:', error);
            set({ user: null, session: null, loading: false });
            return;
          }

          // Set initial session
          set({
            user: session?.user ?? null,
            session: session ?? null,
            loading: false,
          });

          // Set up auth state change listener
          supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            set({
              user: session?.user ?? null,
              session: session ?? null,
            });
          });
        } catch (err) {
          console.error('Error initializing auth:', err);
          set({ user: null, session: null, loading: false });
        }
      },

      /**
       * Clear error message
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: '@peekaboo:auth',
      storage: createJSONStorage(() => platformStorage),
      // Only persist user and session, not loading/error
      partialize: (state) => ({
        user: state.user,
        session: state.session,
      }),
    }
  )
);
