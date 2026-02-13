import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { subDays, startOfDay } from 'date-fns';
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

import StatsScreen from '../StatsScreen';
import { useActivityStore } from '@/stores/activityStore';

const mockUseActivityStore = useActivityStore as jest.MockedFunction<typeof useActivityStore>;

describe('StatsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and sections', () => {
    mockUseActivityStore.mockReturnValue({
      activities: [],
    } as any);

    render(<StatsScreen />);

    expect(screen.getByText('Statistics')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('This Week')).toBeTruthy();
  });

  it('displays zero counts when no activities', () => {
    mockUseActivityStore.mockReturnValue({
      activities: [],
    } as any);

    render(<StatsScreen />);

    // Check for multiple "0" counts (there should be 8 total - 4 for Today, 4 for This Week)
    const zeroCounts = screen.getAllByText('0');
    expect(zeroCounts.length).toBeGreaterThanOrEqual(8);

    // Check that all activity labels are present
    expect(screen.getAllByText('Feeds').length).toBe(2); // Today and This Week
    expect(screen.getAllByText('Diapers').length).toBe(2);
    expect(screen.getAllByText('Sleep').length).toBe(2);
    expect(screen.getAllByText('Pumps').length).toBe(2);
  });

  it('counts today\'s activities correctly', () => {
    const now = new Date();

    const activities: Activity[] = [
      {
        id: '1',
        type: 'feed',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'breast' },
      },
      {
        id: '2',
        type: 'feed',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'bottle' },
      },
      {
        id: '3',
        type: 'diaper',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { type: 'wet' },
      },
      {
        id: '4',
        type: 'sleep',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'start', duration: 120 },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
    } as any);

    render(<StatsScreen />);

    // Today section should show: 2 feeds, 1 diaper, 1 sleep
    const allText = screen.UNSAFE_getAllByType(require('react-native').Text);
    const textContent = allText.map((node: any) => node.props.children).join(' ');

    expect(textContent).toContain('2'); // feed count
    expect(textContent).toContain('1'); // diaper count
  });

  it('counts week\'s activities correctly', () => {
    const today = new Date();
    const threeDaysAgo = subDays(today, 3);
    const fiveDaysAgo = subDays(today, 5);

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
        type: 'feed',
        timestamp: threeDaysAgo.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'bottle' },
      },
      {
        id: '3',
        type: 'feed',
        timestamp: fiveDaysAgo.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'both' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
    } as any);

    render(<StatsScreen />);

    // This week should include all 3 feeds (within 7 days)
    const allText = screen.UNSAFE_getAllByType(require('react-native').Text);
    const textContent = allText.map((node: any) => node.props.children).join(' ');

    expect(textContent).toContain('3'); // week feed count
  });

  it('calculates sleep duration correctly', () => {
    const now = new Date();

    const activities: Activity[] = [
      {
        id: '1',
        type: 'sleep',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'end', duration: 60 },
      },
      {
        id: '2',
        type: 'sleep',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'end', duration: 90 },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
    } as any);

    render(<StatsScreen />);

    // Total sleep: 60 + 90 = 150 minutes = 2h 30m (appears in both Today and This Week)
    const sleepDurations = screen.getAllByText('2h 30m');
    expect(sleepDurations.length).toBeGreaterThanOrEqual(1);
  });

  it('formats sleep duration: 120min → "2h"', () => {
    const now = new Date();

    const activities: Activity[] = [
      {
        id: '1',
        type: 'sleep',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'end', duration: 120 },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
    } as any);

    render(<StatsScreen />);

    const sleepDurations = screen.getAllByText('2h');
    expect(sleepDurations.length).toBeGreaterThanOrEqual(1);
  });

  it('formats sleep duration: 45min → "45m"', () => {
    const now = new Date();

    const activities: Activity[] = [
      {
        id: '1',
        type: 'sleep',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'end', duration: 45 },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
    } as any);

    render(<StatsScreen />);

    const sleepDurations = screen.getAllByText('45m');
    expect(sleepDurations.length).toBeGreaterThanOrEqual(1);
  });

  it('shows all 4 activity types (feed, diaper, sleep, pump)', () => {
    mockUseActivityStore.mockReturnValue({
      activities: [],
    } as any);

    render(<StatsScreen />);

    // Each label appears twice (Today and This Week sections)
    expect(screen.getAllByText('Feeds').length).toBe(2);
    expect(screen.getAllByText('Diapers').length).toBe(2);
    expect(screen.getAllByText('Sleep').length).toBe(2);
    expect(screen.getAllByText('Pumps').length).toBe(2);
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
    } as any);

    const { rerender } = render(<StatsScreen />);

    // Initial state - should have at least one "1" for the feed count
    let allText = screen.UNSAFE_getAllByType(require('react-native').Text);
    let textContent = allText.map((node: any) => node.props.children).join(' ');
    expect(textContent).toContain('1');

    // Add another activity
    const newActivities: Activity[] = [
      ...activities,
      {
        id: '2',
        type: 'feed',
        timestamp: new Date().toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { method: 'bottle' },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities: newActivities,
    } as any);

    rerender(<StatsScreen />);

    // Should now show "2" for the feed count
    allText = screen.UNSAFE_getAllByType(require('react-native').Text);
    textContent = allText.map((node: any) => node.props.children).join(' ');
    expect(textContent).toContain('2');
  });

  it('handles missing sleep duration gracefully', () => {
    const now = new Date();

    const activities: Activity[] = [
      {
        id: '1',
        type: 'sleep',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'start' }, // No duration
      },
      {
        id: '2',
        type: 'sleep',
        timestamp: now.toISOString(),
        baby_id: 'baby1',
        created_by: 'user1',
        details: { status: 'end', duration: 60 },
      },
    ];

    mockUseActivityStore.mockReturnValue({
      activities,
    } as any);

    render(<StatsScreen />);

    // Should show 1h (only counting the activity with duration)
    const sleepDurations = screen.getAllByText('1h');
    expect(sleepDurations.length).toBeGreaterThanOrEqual(1);

    // Should show count of 2 (both sleep activities counted)
    const allText = screen.UNSAFE_getAllByType(require('react-native').Text);
    const textContent = allText.map((node: any) => node.props.children).join(' ');
    expect(textContent).toContain('2'); // sleep count
  });
});
