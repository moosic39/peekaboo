import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

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
  return { GestureHandlerRootView: View };
});

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 hours ago'),
}));

import HomeScreen from '../HomeScreen';
import { useActivityStore } from '@/stores/activityStore';

jest.mock('@/components/ActivityButton', () => ({
  ActivityButton: function MockActivityButton({ label, onPress, timeAgo }: any) {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID={`button-${label.toLowerCase()}`} onPress={onPress}>
        <Text>{label}</Text>
        {timeAgo !== undefined && (
          <Text testID={`timeago-${label.toLowerCase()}`}>{timeAgo}</Text>
        )}
      </TouchableOpacity>
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogActivity.mockReturnValue({
      id: 'test-123',
      type: 'feed',
      timestamp: new Date().toISOString(),
      baby_id: 'test-baby-123',
      created_by: 'local',
      details: { method: 'breast' },
      synced: false,
    });

    (useActivityStore as unknown as jest.Mock).mockReturnValue({
      activities: [],
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

      expect(queryByTestId('quick-options-sheet')).toBeNull();
      fireEvent.press(getByTestId('button-feed'));
      expect(getByTestId('quick-options-sheet')).toBeTruthy();
      expect(getByTestId('quick-options-sheet')).toHaveTextContent(/Options for feed/i);
    });

    it('should log activity when option is selected', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('option-breast'));

      expect(mockLogActivity).toHaveBeenCalledWith('feed', { method: 'breast' });
    });

    it('should close sheet after option is selected', async () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('button-feed'));
      expect(getByTestId('quick-options-sheet')).toBeTruthy();

      fireEvent.press(getByTestId('option-breast'));

      await waitFor(() => {
        expect(queryByTestId('quick-options-sheet')).toBeNull();
      });
    });

    it('should work for all activity types with correct details mapping', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('option-bottle'));
      expect(mockLogActivity).toHaveBeenCalledWith('feed', { method: 'bottle' });

      fireEvent.press(getByTestId('button-diaper'));
      fireEvent.press(getByTestId('option-wet'));
      expect(mockLogActivity).toHaveBeenCalledWith('diaper', { type: 'wet' });

      fireEvent.press(getByTestId('button-sleep'));
      fireEvent.press(getByTestId('option-start'));
      expect(mockLogActivity).toHaveBeenCalledWith('sleep', { status: 'start' });

      fireEvent.press(getByTestId('button-pump'));
      fireEvent.press(getByTestId('option-left'));
      expect(mockLogActivity).toHaveBeenCalledWith('pump', { side: 'left' });

      fireEvent.press(getByTestId('button-growth'));
      fireEvent.press(getByTestId('option-weight'));
      expect(mockLogActivity).toHaveBeenCalledWith('growth', { weight: 0 });
    });
  });

  describe('timeAgo display', () => {
    it('should pass timeAgo to button when activity exists for that type', () => {
      (useActivityStore as unknown as jest.Mock).mockReturnValue({
        activities: [{
          id: '1',
          type: 'feed' as const,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          baby_id: 'test-baby-123',
          created_by: 'local',
          details: { method: 'breast' as const },
          synced: false,
        }],
        logActivity: mockLogActivity,
      });

      const { getByTestId } = render(<HomeScreen />);
      expect(getByTestId('timeago-feed')).toBeTruthy();
    });

    it('should not pass timeAgo to button when no activity exists', () => {
      const { queryByTestId } = render(<HomeScreen />);
      expect(queryByTestId('timeago-feed')).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid button taps without crashing', () => {
      const { getByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('button-feed'));
      fireEvent.press(getByTestId('button-feed'));

      expect(getByTestId('quick-options-sheet')).toBeTruthy();
    });

    it('should allow closing sheet without selecting option', async () => {
      const { getByTestId, queryByTestId } = render(<HomeScreen />);

      fireEvent.press(getByTestId('button-feed'));
      expect(getByTestId('quick-options-sheet')).toBeTruthy();

      fireEvent.press(getByTestId('close-button'));

      await waitFor(() => {
        expect(queryByTestId('quick-options-sheet')).toBeNull();
      });

      expect(mockLogActivity).not.toHaveBeenCalled();
    });
  });
});
