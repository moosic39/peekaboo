import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  const [tick, setTick] = useState(0);
  const { activities, logActivity } = useActivityStore();
  const { currentBabyId } = useFamilyStore();

  // Refresh time labels every minute so "2 minutes ago" doesn't go stale
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

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
  }, [lastActivities, tick]);

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

          {/* Growth is centered at half-width: the wrapper constrains width,
              lastRow's flex:1 gives it equal height with the other rows */}
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
