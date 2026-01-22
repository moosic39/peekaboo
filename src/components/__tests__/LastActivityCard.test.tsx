import React from 'react';
import { render } from '@testing-library/react-native';
import { LastActivityCard } from '../LastActivityCard';
import { ActivityType } from '@/types';

// Mock date-fns to ensure consistent time formatting in tests
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date: Date) => {
    const timestamp = date.getTime();
    const now = new Date('2026-01-17T12:00:00.000Z').getTime();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  }),
}));

describe('LastActivityCard', () => {
  // Use consistent mock dates for testing
  const mockTimestampRecent = '2026-01-17T10:00:00.000Z'; // 2 hours ago
  const mockTimestampOld = '2026-01-16T12:00:00.000Z'; // 1 day ago
  const mockTimestampMinutes = '2026-01-17T11:30:00.000Z'; // 30 minutes ago

  describe('Rendering', () => {
    it('renders with correct activity type icon and label', () => {
      const { getByText } = render(
        <LastActivityCard type="feed" timestamp={mockTimestampRecent} />
      );

      expect(getByText('🍼')).toBeTruthy();
      expect(getByText('Feed')).toBeTruthy();
    });

    it('displays time ago correctly for recent activities', () => {
      const { getByText } = render(
        <LastActivityCard type="feed" timestamp={mockTimestampRecent} />
      );

      expect(getByText('2 hours ago')).toBeTruthy();
    });

    it('displays time ago correctly for old activities', () => {
      const { getByText } = render(
        <LastActivityCard type="diaper" timestamp={mockTimestampOld} />
      );

      expect(getByText('1 day ago')).toBeTruthy();
    });

    it('displays time ago correctly for activities in minutes', () => {
      const { getByText } = render(
        <LastActivityCard type="sleep" timestamp={mockTimestampMinutes} />
      );

      expect(getByText('30 minutes ago')).toBeTruthy();
    });

    it('renders optional details when provided', () => {
      const { getByText } = render(
        <LastActivityCard
          type="feed"
          timestamp={mockTimestampRecent}
          details="Breast • Left"
        />
      );

      expect(getByText('Breast • Left')).toBeTruthy();
    });

    it('does not render details section when not provided', () => {
      const { queryByText } = render(
        <LastActivityCard type="feed" timestamp={mockTimestampRecent} />
      );

      // Should only have the main elements, no details text
      expect(queryByText(/Breast/)).toBeNull();
    });
  });

  describe('Activity Type Variations', () => {
    const testCases: Array<{
      type: ActivityType;
      icon: string;
      label: string;
    }> = [
      { type: 'feed', icon: '🍼', label: 'Feed' },
      { type: 'diaper', icon: '🧷', label: 'Diaper' },
      { type: 'sleep', icon: '😴', label: 'Sleep' },
      { type: 'pump', icon: '🍶', label: 'Pump' },
      { type: 'growth', icon: '📏', label: 'Growth' },
    ];

    testCases.forEach(({ type, icon, label }) => {
      it(`renders correctly for ${type} activity`, () => {
        const { getByText } = render(
          <LastActivityCard type={type} timestamp={mockTimestampRecent} />
        );

        expect(getByText(icon)).toBeTruthy();
        expect(getByText(label)).toBeTruthy();
        expect(getByText('2 hours ago')).toBeTruthy();
      });
    });
  });

  describe('Styling and Visual Elements', () => {
    it('applies activity-specific border color', () => {
      const { getByText } = render(
        <LastActivityCard type="feed" timestamp={mockTimestampRecent} />
      );

      // Navigate up to find the card View
      const label = getByText('Feed');
      let currentNode = label.parent;
      let card = null;

      // Traverse up to find the card with borderLeftColor
      while (currentNode && !card) {
        if (
          currentNode.props.style &&
          Array.isArray(currentNode.props.style)
        ) {
          const hasColor = currentNode.props.style.some(
            (style: any) => style && style.borderLeftColor === '#4A90D9'
          );
          if (hasColor) {
            card = currentNode;
            break;
          }
        }
        currentNode = currentNode.parent;
      }

      expect(card).toBeTruthy();
    });

    it('uses correct colors for different activity types', () => {
      const colorTestCases: Array<{ type: ActivityType; color: string }> = [
        { type: 'feed', color: '#4A90D9' },
        { type: 'diaper', color: '#F5C842' },
        { type: 'sleep', color: '#9B6BC2' },
        { type: 'pump', color: '#E891B0' },
        { type: 'growth', color: '#5CB85C' },
      ];

      colorTestCases.forEach(({ type, color }) => {
        const { getByText } = render(
          <LastActivityCard type={type} timestamp={mockTimestampRecent} />
        );

        const label = ACTIVITY_LABELS[type];
        let currentNode = getByText(label).parent;
        let card = null;

        // Traverse up to find the card with borderLeftColor
        while (currentNode && !card) {
          if (
            currentNode.props.style &&
            Array.isArray(currentNode.props.style)
          ) {
            const hasColor = currentNode.props.style.some(
              (style: any) => style && style.borderLeftColor === color
            );
            if (hasColor) {
              card = currentNode;
              break;
            }
          }
          currentNode = currentNode.parent;
        }

        expect(card).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very old timestamps', () => {
      const veryOldTimestamp = '2026-01-10T12:00:00.000Z'; // 7 days ago
      const { getByText } = render(
        <LastActivityCard type="feed" timestamp={veryOldTimestamp} />
      );

      expect(getByText('7 days ago')).toBeTruthy();
    });

    it('renders with empty details string', () => {
      const { getByText, queryByTestId } = render(
        <LastActivityCard
          type="feed"
          timestamp={mockTimestampRecent}
          details=""
        />
      );

      // Should render without crashing
      expect(getByText('Feed')).toBeTruthy();
    });

    it('handles long details text without breaking layout', () => {
      const longDetails =
        'Very long details text that should wrap properly within the card layout without breaking the UI';

      const { getByText } = render(
        <LastActivityCard
          type="feed"
          timestamp={mockTimestampRecent}
          details={longDetails}
        />
      );

      expect(getByText(longDetails)).toBeTruthy();
    });
  });
});

// Import for color test case
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  feed: 'Feed',
  diaper: 'Diaper',
  sleep: 'Sleep',
  pump: 'Pump',
  growth: 'Growth',
};
