import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock dependencies BEFORE imports
jest.mock('@/stores/activityStore', () => ({
  useActivityStore: jest.fn(),
}));

jest.mock('@/stores/familyStore', () => ({
  useFamilyStore: jest.fn(() => ({
    currentBabyId: 'test-baby-123',
    babies: [],
    families: [],
  })),
}));

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
  };
});

import HomeScreen from '../HomeScreen';
import { useActivityStore } from '@/stores/activityStore';

// Mock components to avoid dependency issues
jest.mock('@/components/ActivityButton', () => ({
  ActivityButton: function MockActivityButton({ label, onPress }: any) {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID={`button-${label.toLowerCase()}`} onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/components/LastActivityCard', () => ({
  LastActivityCard: function MockLastActivityCard({ type, timestamp }: any) {
    const { Text, View } = require('react-native');
    return (
      <View testID={`card-${type}`}>
        <Text>Last {type}</Text>
        <Text>{timestamp}</Text>
      </View>
    );
  },
}));

jest.mock('@/components/QuickOptionsSheet', () => ({
  QuickOptionsSheet: function MockQuickOptionsSheet({ visible, activityType, onSelectOption, onClose }: any) {
    const { Text, TouchableOpacity, View } = require('react-native');
    if (!visible || !activityType) return null;

    const options: Record<string, string[]> = {
      feed: ['breast', 'bottle', 'both'],
      diaper: ['wet', 'dirty', 'both'],
      sleep: ['start', 'end'],
      pump: ['left', 'right', 'both'],
      growth: ['weight', 'height', 'all'],
    };

    return (
      <View testID="quick-options-sheet">
        <Text>Options for {activityType}</Text>
        {options[activityType]?.map((option) => (
          <TouchableOpacity
            key={option}
            testID={`option-${option}`}
            onPress={() => onSelectOption(option)}
          >
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity testID="close-button" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe('HomeScreen', () => {
  const mockLogActivity = jest.fn();
  const mockActivities: any[] = [];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogActivity.mockReturnValue({
      id: 'test-123',
      type: 'feed',
      timestamp: new Date().toISOString(),
      baby_id: 'default',
      created_by: 'local',
      details: { method: 'breast' },
      synced: false,
    });

    (useActivityStore as unknown as jest.Mock).mockReturnValue({
      activities: mockActivities,
      logActivity: mockLogActivity,
    });
  });

  describe('rendering', () => {
    it('should render all 5 activity buttons', () => {
      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('button-feed')).toBeTruthy();
      expect(getByTestId('button-diaper')).toBeTruthy();
      expect(getByTestId('button-sleep')).toBeTruthy();
      expect(getByTestId('button-pump')).toBeTruthy();
      expect(getByTestId('button-growth')).toBeTruthy();
    });

    it('should render section header', () => {
      const { getByText } = render(<HomeScreen />);

      expect(getByText('Log Activity')).toBeTruthy();
    });
  });

  describe('activity logging flow', () => {
    it('should open sheet when feed button is pressed', () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      // Sheet should not be visible initially
      expect(queryByTestId('quick-options-sheet')).toBeNull();

      // Press feed button
      fireEvent.press(getByTestId('button-feed'));

      // Sheet should be visible
      expect(getByTestId('quick-options-sheet')).toBeTruthy();
      expect(getByTestId('quick-options-sheet')).toHaveTextContent(/Options for feed/i);
    });

    it('should log activity when option is selected', () => {
      const { getByTestId } = render(<HomeScreen />);

      // Open sheet
      fireEvent.press(getByTestId('button-feed'));

      // Select option
      fireEvent.press(getByTestId('option-breast'));

      // Should call logActivity with correct parameters
      expect(mockLogActivity).toHaveBeenCalledWith('feed', { method: 'breast' });
    });

    it('should close sheet after option is selected', async () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      // Open sheet
      fireEvent.press(getByTestId('button-feed'));
      expect(getByTestId('quick-options-sheet')).toBeTruthy();

      // Select option
      fireEvent.press(getByTestId('option-breast'));

      // Sheet should close
      await waitFor(() => {
        expect(queryByTestId('quick-options-sheet')).toBeNull();
      });
    });

    it('should work for all activity types with correct details mapping', () => {
      const { getByTestId } = render(<HomeScreen />);

      // Test feed
      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('option-bottle'));
      expect(mockLogActivity).toHaveBeenCalledWith('feed', { method: 'bottle' });

      // Test diaper
      fireEvent.press(getByTestId('button-diaper'));
      fireEvent.press(getByTestId('option-wet'));
      expect(mockLogActivity).toHaveBeenCalledWith('diaper', { type: 'wet' });

      // Test sleep
      fireEvent.press(getByTestId('button-sleep'));
      fireEvent.press(getByTestId('option-start'));
      expect(mockLogActivity).toHaveBeenCalledWith('sleep', { status: 'start' });

      // Test pump
      fireEvent.press(getByTestId('button-pump'));
      fireEvent.press(getByTestId('option-left'));
      expect(mockLogActivity).toHaveBeenCalledWith('pump', { side: 'left' });

      // Test growth (placeholder weight value)
      fireEvent.press(getByTestId('button-growth'));
      fireEvent.press(getByTestId('option-weight'));
      expect(mockLogActivity).toHaveBeenCalledWith('growth', { weight: 0 });
    });
  });

  describe('last activity display', () => {
    it('should display last activity cards when activities exist', () => {
      const mockActivitiesWithData = [
        {
          id: '1',
          type: 'feed' as const,
          timestamp: new Date().toISOString(),
          baby_id: 'default',
          created_by: 'local',
          details: { method: 'breast' as const },
          synced: false,
        },
        {
          id: '2',
          type: 'diaper' as const,
          timestamp: new Date().toISOString(),
          baby_id: 'default',
          created_by: 'local',
          details: { type: 'wet' as const },
          synced: false,
        },
      ];

      (useActivityStore as unknown as jest.Mock).mockReturnValue({
        activities: mockActivitiesWithData,
        logActivity: mockLogActivity,
      });

      const { getByTestId } = render(<HomeScreen />);

      expect(getByTestId('card-feed')).toBeTruthy();
      expect(getByTestId('card-diaper')).toBeTruthy();
    });

    it('should show empty state for activity types with no logs', () => {
      const { getByText } = render(<HomeScreen />);

      // With no activities, should show empty states
      expect(getByText(/No feed logged/i)).toBeTruthy();
      expect(getByText(/No diaper logged/i)).toBeTruthy();
      expect(getByText(/No sleep logged/i)).toBeTruthy();
      expect(getByText(/No pump logged/i)).toBeTruthy();
      expect(getByText(/No growth logged/i)).toBeTruthy();
    });

    it('should update last activity cards after logging', () => {
      const { getByTestId, rerender } = render(<HomeScreen />);

      // Log activity
      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('option-breast'));

      // Update mock to include new activity
      const newActivity = {
        id: 'new-1',
        type: 'feed' as const,
        timestamp: new Date().toISOString(),
        baby_id: 'default',
        created_by: 'local',
        details: { method: 'breast' as const },
        synced: false,
      };

      (useActivityStore as unknown as jest.Mock).mockReturnValue({
        activities: [newActivity],
        logActivity: mockLogActivity,
      });

      // Re-render to simulate store update
      rerender(<HomeScreen />);

      // Should now show activity card instead of empty state
      expect(getByTestId('card-feed')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid button taps without crashing', () => {
      const { getByTestId } = render(<HomeScreen />);

      // Rapidly tap the same button multiple times
      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('button-feed'));

      // Should not crash and sheet should still be visible
      expect(getByTestId('quick-options-sheet')).toBeTruthy();
    });

    it('should allow closing sheet without selecting option', async () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      // Open sheet
      fireEvent.press(getByTestId('button-feed'));
      expect(getByTestId('quick-options-sheet')).toBeTruthy();

      // Close without selecting
      fireEvent.press(getByTestId('close-button'));

      // Sheet should close
      await waitFor(() => {
        expect(queryByTestId('quick-options-sheet')).toBeNull();
      });

      // Should not have logged any activity
      expect(mockLogActivity).not.toHaveBeenCalled();
    });
  });
});
