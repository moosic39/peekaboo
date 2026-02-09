import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Family, Baby } from '@/types';
import {
  fetchUserFamilies,
  fetchFamilyBabies,
  createFamily as createFamilySync,
  createBaby as createBabySync,
  joinFamilyByCode,
} from '@/lib/sync';

interface FamilyStore {
  // State
  families: Family[];
  babies: Baby[];
  currentFamilyId: string | null;
  currentBabyId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchFamilies: () => Promise<void>;
  fetchBabies: (familyId: string) => Promise<void>;
  createFamily: (name: string) => Promise<Family | null>;
  joinFamily: (inviteCode: string) => Promise<Family | null>;
  createBaby: (
    familyId: string,
    name: string,
    birthdate: string,
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  ) => Promise<Baby | null>;
  setCurrentFamily: (familyId: string) => void;
  setCurrentBaby: (babyId: string) => void;
  reset: () => void;
}

/**
 * Family Store - Multi-user and baby management
 *
 * Features:
 * - Manages families and babies for current user
 * - Tracks current selections (family and baby)
 * - Persists to AsyncStorage
 * - Auto-selects first family/baby if only one exists
 */
export const useFamilyStore = create<FamilyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      families: [],
      babies: [],
      currentFamilyId: null,
      currentBabyId: null,
      loading: false,
      error: null,

      /**
       * Fetch all families for current user
       * Auto-selects first family if only one exists
       */
      fetchFamilies: async () => {
        set({ loading: true, error: null });

        try {
          const families = await fetchUserFamilies();

          set({ families, loading: false });

          // Auto-select first family if only one exists and none selected
          if (families.length === 1 && !get().currentFamilyId) {
            const familyId = families[0].id;
            set({ currentFamilyId: familyId });

            // Auto-fetch babies for this family
            await get().fetchBabies(familyId);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch families';
          set({ loading: false, error: message });
          console.error('Error fetching families:', error);
        }
      },

      /**
       * Fetch babies for a specific family
       * Auto-selects first baby if only one exists
       */
      fetchBabies: async (familyId: string) => {
        set({ loading: true, error: null });

        try {
          const babies = await fetchFamilyBabies(familyId);

          set({ babies, loading: false });

          // Auto-select first baby if only one exists and none selected
          if (babies.length === 1 && !get().currentBabyId) {
            set({ currentBabyId: babies[0].id });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch babies';
          set({ loading: false, error: message });
          console.error('Error fetching babies:', error);
        }
      },

      /**
       * Create a new family
       * Auto-selects the new family and fetches its babies
       */
      createFamily: async (name: string) => {
        set({ loading: true, error: null });

        try {
          const family = await createFamilySync(name);

          if (!family) {
            set({ loading: false, error: 'Failed to create family' });
            return null;
          }

          // Add to families list and select it
          set((state) => ({
            families: [...state.families, family],
            currentFamilyId: family.id,
            loading: false,
          }));

          // Fetch babies (will be empty for new family)
          await get().fetchBabies(family.id);

          return family;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create family';
          set({ loading: false, error: message });
          console.error('Error creating family:', error);
          return null;
        }
      },

      /**
       * Join an existing family via invite code
       * Auto-selects the joined family and fetches its babies
       */
      joinFamily: async (inviteCode: string) => {
        set({ loading: true, error: null });

        try {
          const family = await joinFamilyByCode(inviteCode);

          if (!family) {
            set({ loading: false, error: 'Invalid invite code or family not found' });
            return null;
          }

          // Add to families list and select it
          set((state) => ({
            families: [...state.families, family],
            currentFamilyId: family.id,
            loading: false,
          }));

          // Fetch babies for this family
          await get().fetchBabies(family.id);

          return family;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to join family';
          set({ loading: false, error: message });
          console.error('Error joining family:', error);
          return null;
        }
      },

      /**
       * Create a new baby in a family
       * Auto-selects the new baby if it's the first one
       */
      createBaby: async (
        familyId: string,
        name: string,
        birthdate: string,
        gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
      ) => {
        set({ loading: true, error: null });

        try {
          const baby = await createBabySync(familyId, name, birthdate, gender);

          if (!baby) {
            set({ loading: false, error: 'Failed to create baby' });
            return null;
          }

          // Add to babies list
          set((state) => ({
            babies: [...(state.babies || []), baby],
            // Auto-select if first baby
            currentBabyId: (state.babies || []).length === 0 ? baby.id : state.currentBabyId,
            loading: false,
          }));

          return baby;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create baby';
          set({ loading: false, error: message });
          console.error('Error creating baby:', error);
          return null;
        }
      },

      /**
       * Set current family selection
       * Fetches babies for the selected family
       */
      setCurrentFamily: (familyId: string) => {
        set({ currentFamilyId: familyId });
        get().fetchBabies(familyId);
      },

      /**
       * Set current baby selection
       */
      setCurrentBaby: (babyId: string) => {
        set({ currentBabyId: babyId });
      },

      /**
       * Reset store to initial state
       * Used for sign out
       */
      reset: () => {
        set({
          families: [],
          babies: [],
          currentFamilyId: null,
          currentBabyId: null,
          loading: false,
          error: null,
        });
      },
    }),
    {
      name: '@peekaboo:family',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
