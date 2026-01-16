# Peekaboo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a React Native baby activity tracker with dead-simple one-tap logging, partner sync, and activity insights.

**Architecture:** Expo-managed React Native app with Supabase backend for real-time sync and auth. Main screen has 5 large buttons (Feed, Diaper, Sleep, Pump, Growth) with bottom-sheet quick options. Timeline view shows history with simple stats.

**Tech Stack:** Expo (React Native), TypeScript, Supabase (auth, real-time DB, PostgreSQL), Zustand (local state), React Navigation

---

## Phase 1: Project Setup

### Task 1: Initialize Expo Project

**Files:**
- Create: `peekaboo/` (new directory)
- Create: `peekaboo/app.json`
- Create: `peekaboo/package.json`
- Create: `peekaboo/tsconfig.json`

**Step 1: Create new Expo project**

Run:
```bash
cd /Users/mickael/Documents/dev
npx create-expo-app@latest peekaboo --template expo-template-blank-typescript
```

Expected: New `peekaboo/` directory with Expo TypeScript template

**Step 2: Verify project runs**

Run:
```bash
cd peekaboo
npx expo start
```

Expected: Metro bundler starts, QR code displayed

**Step 3: Commit**

```bash
git init
git add .
git commit -m "chore: initialize expo project with typescript"
```

---

### Task 2: Install Core Dependencies

**Files:**
- Modify: `peekaboo/package.json`

**Step 1: Install navigation and UI libraries**

Run:
```bash
cd /Users/mickael/Documents/dev/peekaboo
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context
```

Expected: Dependencies added to package.json

**Step 2: Install Supabase client**

Run:
```bash
npx expo install @supabase/supabase-js react-native-url-polyfill
```

Expected: Supabase dependencies added

**Step 3: Install state management and utilities**

Run:
```bash
npx expo install zustand @react-native-async-storage/async-storage date-fns
```

Expected: Zustand and utilities added

**Step 4: Install bottom sheet library**

Run:
```bash
npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler
```

Expected: Bottom sheet dependencies added

**Step 5: Commit**

```bash
git add .
git commit -m "chore: install core dependencies"
```

---

### Task 3: Configure Babel and TypeScript

**Files:**
- Modify: `peekaboo/babel.config.js`
- Modify: `peekaboo/tsconfig.json`

**Step 1: Update babel.config.js for reanimated**

Replace `babel.config.js` contents:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

**Step 2: Update tsconfig.json with path aliases**

Replace `tsconfig.json` contents:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "chore: configure babel and typescript"
```

---

### Task 4: Create Project Structure

**Files:**
- Create: `peekaboo/src/components/.gitkeep`
- Create: `peekaboo/src/screens/.gitkeep`
- Create: `peekaboo/src/hooks/.gitkeep`
- Create: `peekaboo/src/stores/.gitkeep`
- Create: `peekaboo/src/types/index.ts`
- Create: `peekaboo/src/lib/supabase.ts`
- Create: `peekaboo/src/constants/colors.ts`

**Step 1: Create directory structure**

Run:
```bash
cd /Users/mickael/Documents/dev/peekaboo
mkdir -p src/{components,screens,hooks,stores,types,lib,constants}
touch src/components/.gitkeep src/screens/.gitkeep src/hooks/.gitkeep src/stores/.gitkeep
```

**Step 2: Create types file**

Create `src/types/index.ts`:
```typescript
export type ActivityType = 'feed' | 'diaper' | 'sleep' | 'pump' | 'growth';

export type FeedType = 'breast' | 'bottle' | 'both';
export type DiaperType = 'wet' | 'dirty' | 'both';
export type SleepStatus = 'started' | 'ended';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  baby_id: string;
  created_by: string;
  details: ActivityDetails;
}

export type ActivityDetails =
  | FeedDetails
  | DiaperDetails
  | SleepDetails
  | PumpDetails
  | GrowthDetails;

export interface FeedDetails {
  feed_type: FeedType;
  duration_minutes?: number;
  amount_ml?: number;
  notes?: string;
}

export interface DiaperDetails {
  diaper_type: DiaperType;
  notes?: string;
}

export interface SleepDetails {
  status: SleepStatus;
  duration_minutes?: number;
  notes?: string;
}

export interface PumpDetails {
  duration_minutes?: number;
  amount_ml?: number;
  side?: 'left' | 'right' | 'both';
  notes?: string;
}

export interface GrowthDetails {
  weight_kg?: number;
  height_cm?: number;
  head_cm?: number;
  notes?: string;
}

export interface Baby {
  id: string;
  name: string;
  birth_date: string;
  family_id: string;
}

export interface Family {
  id: string;
  name: string;
  invite_code: string;
}
```

**Step 3: Create colors constants**

Create `src/constants/colors.ts`:
```typescript
export const colors = {
  feed: '#4A90D9',      // Blue
  diaper: '#F5C842',    // Yellow
  sleep: '#9B6BC2',     // Purple
  pump: '#E891B0',      // Pink
  growth: '#5CB85C',    // Green

  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',

  success: '#28A745',
  error: '#DC3545',
};
```

**Step 4: Create Supabase placeholder**

Create `src/lib/supabase.ts`:
```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Step 5: Commit**

```bash
git add .
git commit -m "chore: create project structure and types"
```

---

## Phase 2: Core UI Components

### Task 5: Create Activity Button Component

**Files:**
- Create: `peekaboo/src/components/ActivityButton.tsx`
- Create: `peekaboo/src/components/__tests__/ActivityButton.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/ActivityButton.test.tsx`:
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityButton } from '../ActivityButton';

describe('ActivityButton', () => {
  it('renders with correct label', () => {
    const { getByText } = render(
      <ActivityButton
        type="feed"
        label="Feed"
        icon="🍼"
        onPress={() => {}}
      />
    );
    expect(getByText('Feed')).toBeTruthy();
    expect(getByText('🍼')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ActivityButton
        type="feed"
        label="Feed"
        icon="🍼"
        onPress={onPress}
      />
    );
    fireEvent.press(getByTestId('activity-button-feed'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Install testing dependencies and run test**

Run:
```bash
cd /Users/mickael/Documents/dev/peekaboo
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native @types/jest
npx jest src/components/__tests__/ActivityButton.test.tsx
```

Expected: FAIL - ActivityButton not found

**Step 3: Write minimal implementation**

Create `src/components/ActivityButton.tsx`:
```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '@/constants/colors';
import { ActivityType } from '@/types';

interface ActivityButtonProps {
  type: ActivityType;
  label: string;
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function ActivityButton({
  type,
  label,
  icon,
  onPress,
  style,
}: ActivityButtonProps) {
  return (
    <TouchableOpacity
      testID={`activity-button-${type}`}
      style={[styles.button, { backgroundColor: colors[type] }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx jest src/components/__tests__/ActivityButton.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add ActivityButton component"
```

---

### Task 6: Create Quick Options Bottom Sheet

**Files:**
- Create: `peekaboo/src/components/QuickOptionsSheet.tsx`
- Create: `peekaboo/src/components/__tests__/QuickOptionsSheet.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/QuickOptionsSheet.test.tsx`:
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickOptionsSheet } from '../QuickOptionsSheet';

// Mock bottom sheet
jest.mock('@gorhom/bottom-sheet', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
  BottomSheetView: ({ children }: any) => children,
}));

describe('QuickOptionsSheet', () => {
  it('renders feed options when type is feed', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        type="feed"
        visible={true}
        onSelect={() => {}}
        onClose={() => {}}
      />
    );
    expect(getByText('Breast')).toBeTruthy();
    expect(getByText('Bottle')).toBeTruthy();
    expect(getByText('Both')).toBeTruthy();
  });

  it('calls onSelect with correct value when option tapped', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <QuickOptionsSheet
        type="feed"
        visible={true}
        onSelect={onSelect}
        onClose={() => {}}
      />
    );
    fireEvent.press(getByText('Breast'));
    expect(onSelect).toHaveBeenCalledWith('breast');
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx jest src/components/__tests__/QuickOptionsSheet.test.tsx
```

Expected: FAIL - QuickOptionsSheet not found

**Step 3: Write minimal implementation**

Create `src/components/QuickOptionsSheet.tsx`:
```typescript
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { colors } from '@/constants/colors';
import { ActivityType } from '@/types';

interface Option {
  label: string;
  value: string;
}

const OPTIONS: Record<ActivityType, Option[]> = {
  feed: [
    { label: 'Breast', value: 'breast' },
    { label: 'Bottle', value: 'bottle' },
    { label: 'Both', value: 'both' },
  ],
  diaper: [
    { label: 'Wet', value: 'wet' },
    { label: 'Dirty', value: 'dirty' },
    { label: 'Both', value: 'both' },
  ],
  sleep: [
    { label: 'Start Sleep', value: 'started' },
    { label: 'End Sleep', value: 'ended' },
  ],
  pump: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
    { label: 'Both', value: 'both' },
  ],
  growth: [
    { label: 'Weight', value: 'weight' },
    { label: 'Height', value: 'height' },
    { label: 'All Measurements', value: 'all' },
  ],
};

interface QuickOptionsSheetProps {
  type: ActivityType;
  visible: boolean;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function QuickOptionsSheet({
  type,
  visible,
  onSelect,
  onClose,
}: QuickOptionsSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%'], []);
  const options = OPTIONS[type];

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
        <View style={styles.optionsRow}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, { backgroundColor: colors[type] }]}
              onPress={() => handleSelect(option.value)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.text,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx jest src/components/__tests__/QuickOptionsSheet.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add QuickOptionsSheet component"
```

---

### Task 7: Create Last Activity Status Card

**Files:**
- Create: `peekaboo/src/components/LastActivityCard.tsx`
- Create: `peekaboo/src/components/__tests__/LastActivityCard.test.tsx`

**Step 1: Write the failing test**

Create `src/components/__tests__/LastActivityCard.test.tsx`:
```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { LastActivityCard } from '../LastActivityCard';

describe('LastActivityCard', () => {
  it('renders time ago text', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { getByText } = render(
      <LastActivityCard type="feed" timestamp={twoHoursAgo} />
    );
    expect(getByText(/Feed/)).toBeTruthy();
    expect(getByText(/2h ago/)).toBeTruthy();
  });

  it('shows never when no timestamp', () => {
    const { getByText } = render(
      <LastActivityCard type="feed" timestamp={null} />
    );
    expect(getByText(/never/i)).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx jest src/components/__tests__/LastActivityCard.test.tsx
```

Expected: FAIL - LastActivityCard not found

**Step 3: Write minimal implementation**

Create `src/components/LastActivityCard.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { colors } from '@/constants/colors';
import { ActivityType } from '@/types';

const ICONS: Record<ActivityType, string> = {
  feed: '🍼',
  diaper: '🧷',
  sleep: '😴',
  pump: '🍶',
  growth: '📏',
};

const LABELS: Record<ActivityType, string> = {
  feed: 'Feed',
  diaper: 'Diaper',
  sleep: 'Sleep',
  pump: 'Pump',
  growth: 'Growth',
};

interface LastActivityCardProps {
  type: ActivityType;
  timestamp: string | null;
}

export function LastActivityCard({ type, timestamp }: LastActivityCardProps) {
  const timeAgo = timestamp
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: false })
        .replace('about ', '')
        .replace(' minutes', 'm')
        .replace(' minute', 'm')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace('less than a minute', 'just now')
    : null;

  return (
    <View style={[styles.card, { borderLeftColor: colors[type] }]}>
      <Text style={styles.icon}>{ICONS[type]}</Text>
      <View style={styles.content}>
        <Text style={styles.label}>{LABELS[type]}</Text>
        <Text style={styles.time}>
          {timeAgo ? `${timeAgo} ago` : 'never'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx jest src/components/__tests__/LastActivityCard.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add LastActivityCard component"
```

---

## Phase 3: Home Screen

### Task 8: Create Activity Store with Zustand

**Files:**
- Create: `peekaboo/src/stores/activityStore.ts`
- Create: `peekaboo/src/stores/__tests__/activityStore.test.ts`

**Step 1: Write the failing test**

Create `src/stores/__tests__/activityStore.test.ts`:
```typescript
import { useActivityStore } from '../activityStore';

describe('activityStore', () => {
  beforeEach(() => {
    useActivityStore.getState().reset();
  });

  it('logs a new activity', () => {
    const { logActivity, activities } = useActivityStore.getState();

    logActivity({
      type: 'feed',
      details: { feed_type: 'breast' },
    });

    const updated = useActivityStore.getState().activities;
    expect(updated).toHaveLength(1);
    expect(updated[0].type).toBe('feed');
  });

  it('gets last activity by type', () => {
    const store = useActivityStore.getState();

    store.logActivity({
      type: 'feed',
      details: { feed_type: 'breast' },
    });

    const last = useActivityStore.getState().getLastActivity('feed');
    expect(last).toBeTruthy();
    expect(last?.type).toBe('feed');
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx jest src/stores/__tests__/activityStore.test.ts
```

Expected: FAIL - activityStore not found

**Step 3: Write minimal implementation**

Create `src/stores/activityStore.ts`:
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity, ActivityType, ActivityDetails } from '@/types';

interface ActivityState {
  activities: Activity[];
  currentBabyId: string | null;

  logActivity: (params: {
    type: ActivityType;
    details: ActivityDetails;
  }) => void;

  getLastActivity: (type: ActivityType) => Activity | null;

  getTodayActivities: () => Activity[];

  deleteActivity: (id: string) => void;

  reset: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      activities: [],
      currentBabyId: null,

      logActivity: ({ type, details }) => {
        const newActivity: Activity = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          timestamp: new Date().toISOString(),
          baby_id: get().currentBabyId || 'default',
          created_by: 'local',
          details,
        };

        set((state) => ({
          activities: [newActivity, ...state.activities],
        }));
      },

      getLastActivity: (type) => {
        const { activities } = get();
        return activities.find((a) => a.type === type) || null;
      },

      getTodayActivities: () => {
        const { activities } = get();
        const today = new Date().toDateString();
        return activities.filter(
          (a) => new Date(a.timestamp).toDateString() === today
        );
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        }));
      },

      reset: () => {
        set({ activities: [], currentBabyId: null });
      },
    }),
    {
      name: 'peekaboo-activities',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Step 4: Run test to verify it passes**

Run:
```bash
npx jest src/stores/__tests__/activityStore.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add activity store with zustand"
```

---

### Task 9: Create Home Screen

**Files:**
- Create: `peekaboo/src/screens/HomeScreen.tsx`

**Step 1: Create HomeScreen component**

Create `src/screens/HomeScreen.tsx`:
```typescript
import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Text,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityButton } from '@/components/ActivityButton';
import { QuickOptionsSheet } from '@/components/QuickOptionsSheet';
import { LastActivityCard } from '@/components/LastActivityCard';
import { useActivityStore } from '@/stores/activityStore';
import { colors } from '@/constants/colors';
import { ActivityType, FeedDetails, DiaperDetails, SleepDetails, PumpDetails, GrowthDetails } from '@/types';

const ACTIVITY_BUTTONS: { type: ActivityType; label: string; icon: string }[] = [
  { type: 'feed', label: 'Feed', icon: '🍼' },
  { type: 'diaper', label: 'Diaper', icon: '🧷' },
  { type: 'sleep', label: 'Sleep', icon: '😴' },
  { type: 'pump', label: 'Pump', icon: '🍶' },
  { type: 'growth', label: 'Growth', icon: '📏' },
];

export function HomeScreen() {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const { logActivity, getLastActivity } = useActivityStore();

  const handleActivityPress = useCallback((type: ActivityType) => {
    setSelectedType(type);
  }, []);

  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!selectedType) return;

      let details: FeedDetails | DiaperDetails | SleepDetails | PumpDetails | GrowthDetails;

      switch (selectedType) {
        case 'feed':
          details = { feed_type: value as FeedDetails['feed_type'] };
          break;
        case 'diaper':
          details = { diaper_type: value as DiaperDetails['diaper_type'] };
          break;
        case 'sleep':
          details = { status: value as SleepDetails['status'] };
          break;
        case 'pump':
          details = { side: value as PumpDetails['side'] };
          break;
        case 'growth':
          details = {};
          break;
        default:
          details = {};
      }

      logActivity({ type: selectedType, details });
      setSelectedType(null);
    },
    [selectedType, logActivity]
  );

  const handleSheetClose = useCallback(() => {
    setSelectedType(null);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Peekaboo 👶</Text>

          <View style={styles.buttonsContainer}>
            {ACTIVITY_BUTTONS.map((button) => (
              <ActivityButton
                key={button.type}
                type={button.type}
                label={button.label}
                icon={button.icon}
                onPress={() => handleActivityPress(button.type)}
              />
            ))}
          </View>

          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Last Activities</Text>
            {ACTIVITY_BUTTONS.map((button) => (
              <LastActivityCard
                key={button.type}
                type={button.type}
                timestamp={getLastActivity(button.type)?.timestamp || null}
              />
            ))}
          </View>
        </ScrollView>

        {selectedType && (
          <QuickOptionsSheet
            type={selectedType}
            visible={!!selectedType}
            onSelect={handleOptionSelect}
            onClose={handleSheetClose}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: colors.text,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
  },
  statusSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 8,
    color: colors.text,
  },
});
```

**Step 2: Update App.tsx**

Replace `App.tsx`:
```typescript
import React from 'react';
import { HomeScreen } from '@/screens/HomeScreen';

export default function App() {
  return <HomeScreen />;
}
```

**Step 3: Run app to verify it works**

Run:
```bash
npx expo start
```

Expected: App launches with 5 activity buttons and status cards

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add home screen with activity buttons"
```

---

## Phase 4: Timeline Screen

### Task 10: Create Timeline Item Component

**Files:**
- Create: `peekaboo/src/components/TimelineItem.tsx`

**Step 1: Create TimelineItem component**

Create `src/components/TimelineItem.tsx`:
```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { colors } from '@/constants/colors';
import { Activity, ActivityType } from '@/types';

const ICONS: Record<ActivityType, string> = {
  feed: '🍼',
  diaper: '🧷',
  sleep: '😴',
  pump: '🍶',
  growth: '📏',
};

function getActivityDescription(activity: Activity): string {
  const { type, details } = activity;

  switch (type) {
    case 'feed':
      return `Fed (${(details as any).feed_type})`;
    case 'diaper':
      return `Diaper (${(details as any).diaper_type})`;
    case 'sleep':
      return `Sleep ${(details as any).status}`;
    case 'pump':
      return `Pumped (${(details as any).side || 'recorded'})`;
    case 'growth':
      return 'Growth recorded';
    default:
      return 'Activity recorded';
  }
}

interface TimelineItemProps {
  activity: Activity;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function TimelineItem({ activity, onPress, onLongPress }: TimelineItemProps) {
  const time = format(new Date(activity.timestamp), 'h:mm a');
  const description = getActivityDescription(activity);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors[activity.type] }]}>
        <Text style={styles.icon}>{ICONS[activity.type]}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  time: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add TimelineItem component"
```

---

### Task 11: Create Timeline Screen

**Files:**
- Create: `peekaboo/src/screens/TimelineScreen.tsx`

**Step 1: Create TimelineScreen**

Create `src/screens/TimelineScreen.tsx`:
```typescript
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { format, isToday, isYesterday } from 'date-fns';
import { TimelineItem } from '@/components/TimelineItem';
import { useActivityStore } from '@/stores/activityStore';
import { colors } from '@/constants/colors';
import { Activity } from '@/types';

function groupActivitiesByDate(activities: Activity[]): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp).toDateString();
    const existing = groups.get(date) || [];
    groups.set(date, [...existing, activity]);
  });

  return groups;
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d');
}

export function TimelineScreen() {
  const { activities, deleteActivity } = useActivityStore();
  const groupedActivities = groupActivitiesByDate(activities);

  const sections = Array.from(groupedActivities.entries()).map(([date, items]) => ({
    title: formatDateHeader(date),
    data: items,
  }));

  if (activities.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No activities yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking on the Home tab
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.title}
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionHeader}>{section.title}</Text>
            {section.data.map((activity) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                onLongPress={() => {
                  // TODO: Add delete confirmation
                  deleteActivity(activity.id);
                }}
              />
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add timeline screen"
```

---

### Task 12: Add Tab Navigation

**Files:**
- Modify: `peekaboo/App.tsx`

**Step 1: Update App.tsx with tab navigation**

Replace `App.tsx`:
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '@/screens/HomeScreen';
import { TimelineScreen } from '@/screens/TimelineScreen';
import { colors } from '@/constants/colors';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

**Step 2: Test navigation works**

Run:
```bash
npx expo start
```

Expected: App has bottom tabs for Home and Timeline

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add tab navigation"
```

---

## Phase 5: Stats Screen

### Task 13: Create Stats Screen

**Files:**
- Create: `peekaboo/src/screens/StatsScreen.tsx`

**Step 1: Create StatsScreen**

Create `src/screens/StatsScreen.tsx`:
```typescript
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { format, startOfDay, subDays } from 'date-fns';
import { useActivityStore } from '@/stores/activityStore';
import { colors } from '@/constants/colors';
import { Activity, ActivityType } from '@/types';

function getActivityCountByType(
  activities: Activity[],
  type: ActivityType,
  days: number = 1
): number {
  const cutoff = startOfDay(subDays(new Date(), days - 1));
  return activities.filter(
    (a) => a.type === type && new Date(a.timestamp) >= cutoff
  ).length;
}

function getTotalSleepMinutes(activities: Activity[], days: number = 1): number {
  const cutoff = startOfDay(subDays(new Date(), days - 1));
  const sleepActivities = activities.filter(
    (a) => a.type === 'sleep' && new Date(a.timestamp) >= cutoff
  );

  // Simple calculation: count pairs of start/end
  let total = 0;
  let lastStart: Date | null = null;

  sleepActivities.reverse().forEach((activity) => {
    const details = activity.details as { status: string };
    if (details.status === 'started') {
      lastStart = new Date(activity.timestamp);
    } else if (details.status === 'ended' && lastStart) {
      total += (new Date(activity.timestamp).getTime() - lastStart.getTime()) / 60000;
      lastStart = null;
    }
  });

  return Math.round(total);
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  icon: string;
}

function StatCard({ title, value, subtitle, color, icon }: StatCardProps) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function StatsScreen() {
  const { activities } = useActivityStore();

  const todayFeeds = getActivityCountByType(activities, 'feed', 1);
  const todayDiapers = getActivityCountByType(activities, 'diaper', 1);
  const todaySleep = getTotalSleepMinutes(activities, 1);
  const todayPumps = getActivityCountByType(activities, 'pump', 1);

  const weekFeeds = getActivityCountByType(activities, 'feed', 7);
  const weekDiapers = getActivityCountByType(activities, 'diaper', 7);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Today's Stats</Text>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>

        <View style={styles.statsGrid}>
          <StatCard
            title="Feeds"
            value={todayFeeds}
            subtitle="today"
            color={colors.feed}
            icon="🍼"
          />
          <StatCard
            title="Diapers"
            value={todayDiapers}
            subtitle="today"
            color={colors.diaper}
            icon="🧷"
          />
          <StatCard
            title="Sleep"
            value={formatMinutes(todaySleep)}
            subtitle="total today"
            color={colors.sleep}
            icon="😴"
          />
          <StatCard
            title="Pumps"
            value={todayPumps}
            subtitle="today"
            color={colors.pump}
            icon="🍶"
          />
        </View>

        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekStats}>
          <View style={styles.weekStat}>
            <Text style={styles.weekValue}>{weekFeeds}</Text>
            <Text style={styles.weekLabel}>feeds</Text>
          </View>
          <View style={styles.weekStat}>
            <Text style={styles.weekValue}>{weekDiapers}</Text>
            <Text style={styles.weekLabel}>diapers</Text>
          </View>
          <View style={styles.weekStat}>
            <Text style={styles.weekValue}>
              {Math.round(weekFeeds / 7)}
            </Text>
            <Text style={styles.weekLabel}>avg feeds/day</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  weekStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
  },
  weekStat: {
    alignItems: 'center',
  },
  weekValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  weekLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
```

**Step 2: Add Stats tab to navigation**

Update `App.tsx` to add Stats tab:
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { HomeScreen } from '@/screens/HomeScreen';
import { TimelineScreen } from '@/screens/TimelineScreen';
import { StatsScreen } from '@/screens/StatsScreen';
import { colors } from '@/constants/colors';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add stats screen with daily and weekly insights"
```

---

## Phase 6: Supabase Integration (Partner Sync)

### Task 14: Set Up Supabase Project

**Manual steps (not automated):**

1. Go to https://supabase.com and create a new project
2. Note the project URL and anon key
3. Create `.env` file in project root:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Step 1: Create database schema via Supabase dashboard**

Run this SQL in Supabase SQL Editor:
```sql
-- Families table
CREATE TABLE families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Babies table
CREATE TABLE babies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('feed', 'diaper', 'sleep', 'pump', 'growth')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-family membership
CREATE TABLE family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their families" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view babies in their families" ON babies
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert activities for their babies" ON activities
  FOR INSERT WITH CHECK (
    baby_id IN (
      SELECT b.id FROM babies b
      JOIN family_members fm ON fm.family_id = b.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view activities for their babies" ON activities
  FOR SELECT USING (
    baby_id IN (
      SELECT b.id FROM babies b
      JOIN family_members fm ON fm.family_id = b.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
```

**Step 2: Commit env example**

Create `.env.example`:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

```bash
git add .env.example
git commit -m "chore: add supabase env example"
```

---

### Task 15: Create Sync Service

**Files:**
- Create: `peekaboo/src/lib/sync.ts`

**Step 1: Create sync service**

Create `src/lib/sync.ts`:
```typescript
import { supabase } from './supabase';
import { Activity, ActivityType, ActivityDetails } from '@/types';

export async function syncActivity(activity: {
  type: ActivityType;
  details: ActivityDetails;
  baby_id: string;
}): Promise<Activity | null> {
  const { data, error } = await supabase
    .from('activities')
    .insert({
      type: activity.type,
      details: activity.details,
      baby_id: activity.baby_id,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error syncing activity:', error);
    return null;
  }

  return data as Activity;
}

export async function fetchActivities(babyId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('baby_id', babyId)
    .order('timestamp', { ascending: false })
    .limit(500);

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  return data as Activity[];
}

export function subscribeToActivities(
  babyId: string,
  onActivity: (activity: Activity) => void
) {
  const subscription = supabase
    .channel(`activities:${babyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'activities',
        filter: `baby_id=eq.${babyId}`,
      },
      (payload) => {
        onActivity(payload.new as Activity);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

export async function joinFamilyByCode(inviteCode: string): Promise<string | null> {
  // Find family by invite code
  const { data: family, error: familyError } = await supabase
    .from('families')
    .select('id')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();

  if (familyError || !family) {
    console.error('Family not found:', familyError);
    return null;
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Add user to family
  const { error: memberError } = await supabase
    .from('family_members')
    .insert({
      family_id: family.id,
      user_id: user.id,
    });

  if (memberError) {
    console.error('Error joining family:', memberError);
    return null;
  }

  return family.id;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
```

**Step 2: Commit**

```bash
git add .
git commit -m "feat: add supabase sync service"
```

---

## Verification

### Manual Testing Checklist

1. **App Launch**
   - Run `npx expo start`
   - Open in Expo Go or simulator
   - Verify Home screen loads with 5 activity buttons

2. **Activity Logging**
   - Tap Feed button → bottom sheet appears
   - Select "Breast" → sheet closes, activity logged
   - Verify "Last Activities" section updates

3. **Timeline**
   - Navigate to Timeline tab
   - Verify logged activity appears
   - Long press to delete

4. **Stats**
   - Navigate to Stats tab
   - Verify counts match logged activities

5. **Persistence**
   - Close app completely
   - Reopen → verify activities persist

---

## Future Tasks (Not in MVP)

- [ ] Auth screens (sign up, sign in)
- [ ] Family/baby setup flow
- [ ] Real-time sync with Supabase
- [ ] Settings screen
- [ ] Push notifications
- [ ] Widgets (iOS/Android)
- [ ] Export data to CSV
- [ ] Multiple babies support
