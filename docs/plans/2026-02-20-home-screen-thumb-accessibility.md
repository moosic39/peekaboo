# Home Screen Thumb Accessibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign HomeScreen so activity buttons are the dominant element in the thumb zone with last-logged time embedded in each button, no scrolling required.

**Architecture:** Remove ScrollView and the separate "Recent" section. Use a flex grid that fills available screen height. Each ActivityButton receives a `timeAgo` string computed in HomeScreen from recent activities, merging action and status into one element.

**Tech Stack:** React Native, Expo, Zustand, date-fns

---

### Task 1: Add `timeAgo` prop to ActivityButton

**Files:**
- Modify: `src/components/ActivityButton.tsx`
- Modify: `src/components/__tests__/ActivityButton.test.tsx`

**Step 1: Write failing tests**

Add these two tests inside the `describe('ActivityButton')` block in `src/components/__tests__/ActivityButton.test.tsx`:

```tsx
it('renders timeAgo when provided', () => {
  const { getByText } = render(
    <ActivityButton
      type="feed"
      onPress={mockOnPress}
      label="Feed"
      icon="🍼"
      timeAgo="2 hours ago"
    />
  );
  expect(getByText('2 hours ago')).toBeTruthy();
});

it('renders — when timeAgo is not provided', () => {
  const { getByText } = render(
    <ActivityButton
      type="feed"
      onPress={mockOnPress}
      label="Feed"
      icon="🍼"
    />
  );
  expect(getByText('—')).toBeTruthy();
});
```

**Step 2: Run tests to verify they fail**

```bash
npx jest src/components/__tests__/ActivityButton.test.tsx -t "timeAgo" --no-coverage
```

Expected: FAIL — "Unable to find an element with the text"

**Step 3: Update ActivityButton**

Replace the contents of `src/components/ActivityButton.tsx` with:

```tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ActivityType } from '@/types';
import { activityColors, activityColorsBg, activityColorsBorder } from '@/constants/colors';

export interface ActivityButtonProps {
  type: ActivityType;
  onPress: () => void;
  label: string;
  icon: string;
  timeAgo?: string;
}

/**
 * Large, tappable button for logging activities.
 * Shows icon, label, and time since last log.
 * Uses flex: 1 to fill its parent container.
 */
export const ActivityButton: React.FC<ActivityButtonProps> = ({
  type,
  onPress,
  label,
  icon,
  timeAgo,
}) => {
  const glowColor = activityColors[type];
  const bgColor = activityColorsBg[type];
  const borderColor = activityColorsBorder[type];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          shadowColor: glowColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityLabel={`Log ${label} activity`}
      accessibilityHint={`Tap to record a ${label} activity`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.timeAgo}>{timeAgo ?? '—'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 38,
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F2F2F7',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(242, 242, 247, 0.55)',
    marginTop: 4,
    textAlign: 'center',
  },
});
```

**Step 4: Run all ActivityButton tests**

```bash
npx jest src/components/__tests__/ActivityButton.test.tsx --no-coverage
```

Expected: All PASS

**Step 5: Commit**

```bash
git add src/components/ActivityButton.tsx src/components/__tests__/ActivityButton.test.tsx
git commit -m "feat: add timeAgo prop to ActivityButton"
```

---

### Task 2: Redesign HomeScreen layout

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/__tests__/HomeScreen.test.tsx`

**Step 1: Update HomeScreen tests**

Replace the entire contents of `src/screens/__tests__/HomeScreen.test.tsx` with the following. Key changes:
- ActivityButton mock now renders `timeAgo` with a testID
- Remove the `LastActivityCard` mock (no longer used)
- Replace `last activity display` describe block with `timeAgo display`

```tsx
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
```

**Step 2: Run tests to verify the new test expectations fail against the old implementation**

```bash
npx jest src/screens/__tests__/HomeScreen.test.tsx --no-coverage
```

Expected: Several FAIL (timeAgo tests, missing date-fns mock errors)

**Step 3: Rewrite HomeScreen**

Replace the entire contents of `src/screens/HomeScreen.tsx` with:

```tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityButton } from '@/components/ActivityButton';
import { QuickOptionsSheet } from '@/components/QuickOptionsSheet';
import { useActivityStore } from '@/stores/activityStore';
import { useFamilyStore } from '@/stores/familyStore';
import { ActivityType, ActivityDetails } from '@/types';
import { colors } from '@/constants/colors';
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/constants/activities';

const ACTIVITY_TYPES: ActivityType[] = ['feed', 'diaper', 'sleep', 'pump', 'growth'];

/**
 * HomeScreen - Main activity logging interface
 *
 * Full-screen flex grid of 5 activity buttons, no scroll.
 * Each button shows the activity label and time since last log.
 * Buttons fill the thumb zone for one-handed use.
 */
export default function HomeScreen() {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const { activities, logActivity } = useActivityStore();
  const { currentBabyId } = useFamilyStore();

  const lastActivities = useMemo(() => {
    const result: Record<ActivityType, typeof activities[0] | null> = {
      feed: null, diaper: null, sleep: null, pump: null, growth: null,
    };
    ACTIVITY_TYPES.forEach((type) => {
      const filtered = activities.filter(
        (a) => a.type === type && a.baby_id === currentBabyId
      );
      result[type] = filtered.length > 0 ? filtered[0] : null;
    });
    return result;
  }, [activities, currentBabyId]);

  const timeAgoMap = useMemo(() => {
    const result: Partial<Record<ActivityType, string>> = {};
    ACTIVITY_TYPES.forEach((type) => {
      const last = lastActivities[type];
      if (last) {
        result[type] = formatDistanceToNow(new Date(last.timestamp), { addSuffix: true });
      }
    });
    return result;
  }, [lastActivities]);

  const handleActivityPress = useCallback((type: ActivityType) => {
    setSelectedType(type);
  }, []);

  const handleOptionSelect = useCallback((value: string) => {
    if (!selectedType) return;
    try {
      logActivity(selectedType, mapOptionToDetails(selectedType, value));
    } catch (err) {
      console.error('Failed to log activity:', err);
    } finally {
      setSelectedType(null);
    }
  }, [selectedType, logActivity]);

  const handleSheetClose = useCallback(() => setSelectedType(null), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Log Activity</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.row}>
            <ActivityButton
              type="feed"
              label={ACTIVITY_LABELS.feed}
              icon={ACTIVITY_ICONS.feed}
              timeAgo={timeAgoMap.feed}
              onPress={() => handleActivityPress('feed')}
            />
            <ActivityButton
              type="diaper"
              label={ACTIVITY_LABELS.diaper}
              icon={ACTIVITY_ICONS.diaper}
              timeAgo={timeAgoMap.diaper}
              onPress={() => handleActivityPress('diaper')}
            />
          </View>

          <View style={styles.row}>
            <ActivityButton
              type="sleep"
              label={ACTIVITY_LABELS.sleep}
              icon={ACTIVITY_ICONS.sleep}
              timeAgo={timeAgoMap.sleep}
              onPress={() => handleActivityPress('sleep')}
            />
            <ActivityButton
              type="pump"
              label={ACTIVITY_LABELS.pump}
              icon={ACTIVITY_ICONS.pump}
              timeAgo={timeAgoMap.pump}
              onPress={() => handleActivityPress('pump')}
            />
          </View>

          <View style={styles.lastRow}>
            <View style={styles.halfButton}>
              <ActivityButton
                type="growth"
                label={ACTIVITY_LABELS.growth}
                icon={ACTIVITY_ICONS.growth}
                timeAgo={timeAgoMap.growth}
                onPress={() => handleActivityPress('growth')}
              />
            </View>
          </View>
        </View>

        <QuickOptionsSheet
          activityType={selectedType}
          visible={selectedType !== null}
          onSelectOption={handleOptionSelect}
          onClose={handleSheetClose}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

function mapOptionToDetails(type: ActivityType, value: string): ActivityDetails {
  switch (type) {
    case 'feed': return { method: value as 'breast' | 'bottle' | 'both' };
    case 'diaper': return { type: value as 'wet' | 'dirty' | 'both' };
    case 'sleep': return { status: value as 'start' | 'end' };
    case 'pump': return { side: value as 'left' | 'right' | 'both' };
    case 'growth': return { weight: 0 };
    default:
      const _exhaustive: never = type;
      throw new Error(`Unhandled activity type: ${_exhaustive}`);
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  grid: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  lastRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  halfButton: {
    width: '50%',
  },
});
```

**Step 4: Run HomeScreen tests**

```bash
npx jest src/screens/__tests__/HomeScreen.test.tsx --no-coverage
```

Expected: All PASS

**Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx src/screens/__tests__/HomeScreen.test.tsx
git commit -m "feat: redesign HomeScreen with thumb-accessible flex layout"
```

---

### Task 3: Verify full test suite

**Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All PASS. If any unexpected failures appear in other test files, investigate and fix before proceeding.

**Step 2: Commit any fixes**

If any other tests needed fixing (e.g. snapshot tests):
```bash
git add -p
git commit -m "fix: update tests for HomeScreen layout refactor"
```
