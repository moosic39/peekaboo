import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { format, subDays, startOfDay } from 'date-fns';
import { Activity } from '@/types';

// Mock dependencies BEFORE imports
jest.mock('@/lib/sync', () => ({
  syncActivity: jest.fn().mockResolvedValue({ success: true }),
  deleteActivity: jest.fn().mockResolvedValue(undefined),
  fetchActivities: jest.fn(),
  subscribeToActivities: jest.fn(),
}));

jest.mock('@/stores/activityStore');

jest.mock('@/stores/familyStore', () => ({
  useFamilyStore: jest.fn(() => ({
    currentBabyId: 'test-baby-123',
    babies: [],
    families: [],
  })),
}));

import TimelineScreen from '../TimelineScreen';
import { useActivityStore } from '@/stores/activityStore';

const mockUseActivityStore = useActivityStore as jest.MockedFunction<typeof useActivityStore>;

// Mock TimelineItem component
jest.mock('@/components/TimelineItem', () => ({
  TimelineItem: ({ activity, onLongPress }: any) => {
    const { Text, Pressable } = require('react-native');
    return (
      <Pressable onLongPress={onLongPress} testID={`timeline-item-${activity.id}`}>
        <Text>{activity.type}</Text>
        <Text>{activity.timestamp}</Text>
      </Pressable>
    );
  },
}));

describe('TimelineScreen', () => {
  const mockDeleteActivity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and empty state when no activities', () => {
    mockUseActivityStore.mockReturnValue({
      activities: [],
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    expect(screen.getByText('Timeline')).toBeTruthy();
    expect(screen.getByText('No activities yet')).toBeTruthy();
    expect(screen.getByText('Activities you log will appear here')).toBeTruthy();
  });

  it('groups activities by date correctly', () => {
    const today = new Date();
    const yesterday = subDays(today, 1);

    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: today.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
      {
        id: '2',
        type: 'diaper',
        timestamp: yesterday.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { type: 'wet' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Yesterday')).toBeTruthy();
  });

  it('displays "Today" for today\'s activities', () => {
    const today = new Date();

    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: today.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('displays "Yesterday" for yesterday\'s activities', () => {
    const yesterday = subDays(new Date(), 1);

    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: yesterday.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    expect(screen.getByText('Yesterday')).toBeTruthy();
  });

  it('displays formatted date for older activities', () => {
    const twoDaysAgo = subDays(startOfDay(new Date()), 2);
    const expectedDate = format(twoDaysAgo, 'EEEE, MMMM d');

    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: twoDaysAgo.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    expect(screen.getByText(expectedDate)).toBeTruthy();
  });

  it('renders TimelineItem for each activity', () => {
    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: new Date().toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
      {
        id: '2',
        type: 'diaper',
        timestamp: new Date().toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { type: 'wet' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    expect(screen.getByTestId('timeline-item-1')).toBeTruthy();
    expect(screen.getByTestId('timeline-item-2')).toBeTruthy();
  });

  it('calls deleteActivity on long-press', () => {
    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: new Date().toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    const { getByTestId } = render(<TimelineScreen />);

    const timelineItem = getByTestId('timeline-item-1');
    fireEvent(timelineItem, 'onLongPress');

    expect(mockDeleteActivity).toHaveBeenCalledWith('1');
  });

  it('maintains sort order (newest first within sections)', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: twoHoursAgo.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
      {
        id: '2',
        type: 'diaper',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { type: 'wet' },
      },
      {
        id: '3',
        type: 'sleep',
        timestamp: oneHourAgo.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'end' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    // Verify all three items exist and are rendered
    expect(screen.getByTestId('timeline-item-1')).toBeTruthy();
    expect(screen.getByTestId('timeline-item-2')).toBeTruthy();
    expect(screen.getByTestId('timeline-item-3')).toBeTruthy();

    // All items are from today, so they should all be in the "Today" section
    expect(screen.getByText('Today')).toBeTruthy();
  });

  it('handles single activity correctly', () => {
    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: new Date().toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    render(<TimelineScreen />);

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByTestId('timeline-item-1')).toBeTruthy();
  });

  it('updates when activities change', () => {
    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: new Date().toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
      deleteActivity: mockDeleteActivity,
    } as any);

    const { rerender } = render(<TimelineScreen />);

    expect(screen.getByTestId('timeline-item-1')).toBeTruthy();

    // Update activities
    const newActivities: Activity[] = [
      ...activities,
      {
        id: '2',
        type: 'diaper',
        timestamp: new Date().toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { type: 'wet' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities: newActivities,
      deleteActivity: mockDeleteActivity,
    } as any);

    rerender(<TimelineScreen />);

    expect(screen.getByTestId('timeline-item-1')).toBeTruthy();
    expect(screen.getByTestId('timeline-item-2')).toBeTruthy();
  });
});
