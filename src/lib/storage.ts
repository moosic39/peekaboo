/**
 * Storage Adapter for Zustand Persistence
 *
 * Provides platform-specific storage:
 * - Web: Uses localStorage
 * - Native: Uses AsyncStorage
 *
 * This ensures Zustand persist middleware works correctly on all platforms.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';

/**
 * Web storage implementation using localStorage
 * Made async to match AsyncStorage API for consistency
 */
const webStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

/**
 * Native storage implementation using AsyncStorage
 */
const nativeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (error) {
      console.error('Error writing to AsyncStorage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  },
};

/**
 * Platform-specific storage adapter
 * Automatically selects the correct storage based on platform
 */
export const platformStorage: StateStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
