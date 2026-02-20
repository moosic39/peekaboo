import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityButton } from '@/components/ActivityButton';
import { LastActivityCard } from '@/components/LastActivityCard';
import { QuickOptionsSheet } from '@/components/QuickOptionsSheet';
import { useActivityStore } from '@/stores/activityStore';
import { useFamilyStore } from '@/stores/familyStore';
import { ActivityType, ActivityDetails } from '@/types';
import { colors } from '@/constants/colors';

// Activity types in display order
const ACTIVITY_TYPES: ActivityType[] = ['feed', 'diaper', 'sleep', 'pump', 'growth'];

// Activity labels for display
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  feed: 'Feed',
  diaper: 'Diaper',
  sleep: 'Sleep',
  pump: 'Pump',
  growth: 'Growth',
};

// Activity icons (emoji)
const ACTIVITY_ICONS: Record<ActivityType, string> = {
  feed: '🍼',
  diaper: '👶',
  sleep: '😴',
  pump: '🍼',
  growth: '📏',
};

/**
 * HomeScreen - Main activity logging interface
 *
 * Features:
 * - 5 activity buttons in 2x3 grid
 * - Quick options sheet for logging activities
 * - Last activity cards showing recent status
 * - Empty states for activities not yet logged
 */
export default function HomeScreen() {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const { activities, logActivity } = useActivityStore();
  const { currentBabyId } = useFamilyStore();

  /**
   * Compute last activities for each type, filtered to the selected baby
   * Memoized to prevent re-computation on every render
   */
  const lastActivities = useMemo(() => {
    const result: Record<ActivityType, typeof activities[0] | null> = {
      feed: null,
      diaper: null,
      sleep: null,
      pump: null,
      growth: null,
    };

    ACTIVITY_TYPES.forEach((type) => {
      const filtered = activities.filter(
        (a) => a.type === type && a.baby_id === currentBabyId
      );
      result[type] = filtered.length > 0 ? filtered[0] : null;
    });

    return result;
  }, [activities, currentBabyId]);

  /**
   * Handle activity button press - opens bottom sheet
   */
  const handleActivityPress = useCallback((type: ActivityType) => {
    setSelectedType(type);
  }, []);

  /**
   * Handle option selection from bottom sheet
   * Maps option value to typed details and logs activity
   */
  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!selectedType) return;

      try {
        const details = mapOptionToDetails(selectedType, value);
        logActivity(selectedType, details);
      } catch (err) {
        console.error('Failed to log activity:', err);
      } finally {
        setSelectedType(null);
      }
    },
    [selectedType, logActivity]
  );

  /**
   * Handle sheet close without selection
   */
  const handleSheetClose = useCallback(() => {
    setSelectedType(null);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <Text style={styles.title}>Log Activity</Text>

          {/* Activity Buttons Grid */}
          <View style={styles.buttonGrid}>
            {ACTIVITY_TYPES.map((type) => (
              <View key={type} style={styles.buttonWrapper}>
                <ActivityButton
                  type={type}
                  label={ACTIVITY_LABELS[type]}
                  icon={ACTIVITY_ICONS[type]}
                  onPress={() => handleActivityPress(type)}
                />
              </View>
            ))}
          </View>

          {/* Recent Activities Section */}
          <Text style={styles.sectionTitle}>Recent Activities</Text>

          {/* Last Activity Cards or Empty States */}
          <View style={styles.cardsContainer}>
            {ACTIVITY_TYPES.map((type) => {
              const lastActivity = lastActivities[type];

              if (lastActivity) {
                return (
                  <LastActivityCard
                    key={type}
                    type={lastActivity.type}
                    timestamp={lastActivity.timestamp}
                  />
                );
              }

              // Empty state
              return (
                <View key={type} style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>{ACTIVITY_ICONS[type]}</Text>
                  <Text style={styles.emptyText}>
                    No {ACTIVITY_LABELS[type].toLowerCase()} logged yet
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Quick Options Sheet */}
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

/**
 * Map option value to typed activity details
 * Ensures type safety for all activity types
 */
function mapOptionToDetails(type: ActivityType, value: string): ActivityDetails {
  switch (type) {
    case 'feed':
      return { method: value as 'breast' | 'bottle' | 'both' };
    case 'diaper':
      return { type: value as 'wet' | 'dirty' | 'both' };
    case 'sleep':
      return { status: value as 'start' | 'end' };
    case 'pump':
      return { side: value as 'left' | 'right' | 'both' };
    case 'growth':
      // TODO: Prompt for numeric input instead of placeholder
      return { weight: 0 };
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = type;
      throw new Error(`Unhandled activity type: ${_exhaustive}`);
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 32,
  },
  buttonWrapper: {
    width: '50%',
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  cardsContainer: {
    gap: 12,
  },
  emptyCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
