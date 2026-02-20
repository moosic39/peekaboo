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
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/constants/activities';

// Activity types in display order
const ACTIVITY_TYPES: ActivityType[] = ['feed', 'diaper', 'sleep', 'pump', 'growth'];

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

  const handleActivityPress = useCallback((type: ActivityType) => {
    setSelectedType(type);
  }, []);

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

  const handleSheetClose = useCallback(() => {
    setSelectedType(null);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log Activity</Text>
            <Text style={styles.subtitle}>Tap to record</Text>
          </View>

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
          <Text style={styles.sectionTitle}>Recent</Text>

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
      return { weight: 0 };
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 28,
    marginTop: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 36,
  },
  buttonWrapper: {
    width: '50%',
    padding: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  cardsContainer: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textLight,
  },
});
