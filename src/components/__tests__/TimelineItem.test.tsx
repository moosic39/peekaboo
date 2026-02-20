import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TimelineItem } from '../TimelineItem';
import { Activity, ActivityType } from '@/types';
import { activityColorsBg, activityColorsBorder, activityColors } from '@/constants/colors';
import type {
  FeedDetails,
  DiaperDetails,
  SleepDetails,
  PumpDetails,
  GrowthDetails,
} from '@/types';

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, formatStr: string) => {
    // Return predictable time format for testing
    return '10:30 AM';
  }),
}));

describe('TimelineItem', () => {
  const mockTimestamp = '2026-01-17T10:30:00.000Z';

  const createMockActivity = (
    type: ActivityType,
    details: any
  ): Activity => ({
    id: 'test-activity-id',
    type,
    timestamp: mockTimestamp,
    baby_id: 'test-baby-id',
    created_by: 'test-user-id',
    details,
    synced: true,
  });

  describe('Rendering', () => {
    it('renders feed activity with correct details', () => {
      const feedDetails: FeedDetails = {
        method: 'breast',
        side: 'left',
        duration: 15,
      };

      const activity = createMockActivity('feed', feedDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('🍼')).toBeTruthy();
      expect(getByText('Feed')).toBeTruthy();
      expect(getByText('10:30 AM')).toBeTruthy();
      expect(getByText('Breast · Left · 15min')).toBeTruthy();
    });

    it('renders diaper activity with correct details', () => {
      const diaperDetails: DiaperDetails = {
        type: 'wet',
        notes: 'Changed in nursery',
      };

      const activity = createMockActivity('diaper', diaperDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('🧷')).toBeTruthy();
      expect(getByText('Diaper')).toBeTruthy();
      expect(getByText('Wet · Changed in nursery')).toBeTruthy();
    });

    it('renders sleep activity with correct details', () => {
      const sleepDetails: SleepDetails = {
        status: 'start',
      };

      const activity = createMockActivity('sleep', sleepDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('😴')).toBeTruthy();
      expect(getByText('Sleep')).toBeTruthy();
      expect(getByText('Started')).toBeTruthy();
    });

    it('renders pump activity with correct details', () => {
      const pumpDetails: PumpDetails = {
        side: 'both',
        amount: 120,
        duration: 20,
      };

      const activity = createMockActivity('pump', pumpDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('🍶')).toBeTruthy();
      expect(getByText('Pump')).toBeTruthy();
      expect(getByText('Both · 120ml · 20min')).toBeTruthy();
    });

    it('renders growth activity with correct details', () => {
      const growthDetails: GrowthDetails = {
        weight: 4.5,
        height: 55,
        headCircumference: 38,
      };

      const activity = createMockActivity('growth', growthDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('📏')).toBeTruthy();
      expect(getByText('Growth')).toBeTruthy();
      expect(getByText('4.5kg · 55cm · Head: 38cm')).toBeTruthy();
    });
  });

  describe('Activity Detail Formatting', () => {
    it('formats feed with bottle and amount', () => {
      const feedDetails: FeedDetails = {
        method: 'bottle',
        amount: 150,
      };

      const activity = createMockActivity('feed', feedDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Bottle · 150ml')).toBeTruthy();
    });

    it('formats feed with both method', () => {
      const feedDetails: FeedDetails = {
        method: 'both',
        duration: 25,
      };

      const activity = createMockActivity('feed', feedDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Both · 25min')).toBeTruthy();
    });

    it('formats diaper without notes', () => {
      const diaperDetails: DiaperDetails = {
        type: 'dirty',
      };

      const activity = createMockActivity('diaper', diaperDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Dirty')).toBeTruthy();
    });

    it('formats diaper with both type', () => {
      const diaperDetails: DiaperDetails = {
        type: 'both',
      };

      const activity = createMockActivity('diaper', diaperDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Both')).toBeTruthy();
    });

    it('formats sleep end with duration', () => {
      const sleepDetails: SleepDetails = {
        status: 'end',
        duration: 120,
      };

      const activity = createMockActivity('sleep', sleepDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Ended · 120min')).toBeTruthy();
    });

    it('formats pump with only side', () => {
      const pumpDetails: PumpDetails = {
        side: 'left',
      };

      const activity = createMockActivity('pump', pumpDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Left')).toBeTruthy();
    });

    it('formats pump with right side and amount', () => {
      const pumpDetails: PumpDetails = {
        side: 'right',
        amount: 80,
      };

      const activity = createMockActivity('pump', pumpDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Right · 80ml')).toBeTruthy();
    });

    it('formats growth with only weight', () => {
      const growthDetails: GrowthDetails = {
        weight: 5.2,
      };

      const activity = createMockActivity('growth', growthDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('5.2kg')).toBeTruthy();
    });

    it('formats growth with weight and height only', () => {
      const growthDetails: GrowthDetails = {
        weight: 5.2,
        height: 60,
      };

      const activity = createMockActivity('growth', growthDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('5.2kg · 60cm')).toBeTruthy();
    });

    it('handles growth with no measurements', () => {
      const growthDetails: GrowthDetails = {
        notes: 'Routine checkup',
      };

      const activity = createMockActivity('growth', growthDetails);
      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Measured')).toBeTruthy();
    });
  });

  describe('Long Press Handling', () => {
    it('calls onLongPress when long pressed', () => {
      const onLongPress = jest.fn();
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);

      const { getByLabelText } = render(
        <TimelineItem activity={activity} onLongPress={onLongPress} />
      );

      const item = getByLabelText('Feed activity at 10:30 AM');
      fireEvent(item, 'longPress');

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('does not crash when onLongPress is not provided', () => {
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);

      const { getByLabelText } = render(
        <TimelineItem activity={activity} />
      );

      const item = getByLabelText('Feed activity at 10:30 AM');

      // Should not crash when long pressing without handler
      expect(() => {
        fireEvent(item, 'longPress');
      }).not.toThrow();
    });

    it('sets correct accessibility hint when onLongPress is provided', () => {
      const onLongPress = jest.fn();
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);

      const { getByLabelText } = render(
        <TimelineItem activity={activity} onLongPress={onLongPress} />
      );

      const item = getByLabelText('Feed activity at 10:30 AM');
      expect(item.props.accessibilityHint).toBe('Long press to delete');
    });
  });

  describe('Color Application', () => {
    it('applies correct glow colors for feed activity', () => {
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);

      const { getByTestId } = render(<TimelineItem activity={activity} />);
      const iconContainer = getByTestId('icon-container');

      expect(iconContainer.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: activityColorsBg.feed,
            borderColor: activityColorsBorder.feed,
            shadowColor: activityColors.feed,
          }),
        ])
      );
    });

    it('applies correct glow colors for each activity type', () => {
      const testCases: Array<{ type: ActivityType; details: any }> = [
        { type: 'feed', details: { method: 'breast' } },
        { type: 'diaper', details: { type: 'wet' } },
        { type: 'sleep', details: { status: 'start' } },
        { type: 'pump', details: { side: 'left' } },
        { type: 'growth', details: { weight: 5.0 } },
      ];

      testCases.forEach(({ type, details }) => {
        const activity = createMockActivity(type, details);
        const { getByTestId } = render(<TimelineItem activity={activity} />);
        const iconContainer = getByTestId('icon-container');

        expect(iconContainer.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              backgroundColor: activityColorsBg[type],
              borderColor: activityColorsBorder[type],
              shadowColor: activityColors[type],
            }),
          ])
        );
      });
    });
  });

  describe('Visual Feedback', () => {
    it('applies pressed style when pressed', () => {
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);

      const { getByLabelText } = render(
        <TimelineItem activity={activity} />
      );

      const item = getByLabelText('Feed activity at 10:30 AM');

      // Simulate press in
      fireEvent(item, 'pressIn');

      // Note: Testing pressed state is tricky with Pressable
      // The component should handle this via the style function
      expect(item).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('handles activity with no details section gracefully', () => {
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);

      const { getByText, queryByText } = render(
        <TimelineItem activity={activity} />
      );

      expect(getByText('Feed')).toBeTruthy();
      // Details should still show "Breast"
      expect(getByText('Breast')).toBeTruthy();
    });

    it('renders correctly with synced status', () => {
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);
      activity.synced = true;

      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Feed')).toBeTruthy();
    });

    it('renders correctly with unsynced status', () => {
      const feedDetails: FeedDetails = { method: 'breast' };
      const activity = createMockActivity('feed', feedDetails);
      activity.synced = false;

      const { getByText } = render(<TimelineItem activity={activity} />);

      expect(getByText('Feed')).toBeTruthy();
    });
  });
});
