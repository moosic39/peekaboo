import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format } from 'date-fns';
import { Activity } from '@/types';
import { activityColors, colors } from '@/constants/colors';
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/constants/activities';
import type {
  FeedDetails,
  DiaperDetails,
  SleepDetails,
  PumpDetails,
  GrowthDetails,
} from '@/types';

export interface TimelineItemProps {
  activity: Activity;
  onLongPress?: () => void;
}

/**
 * Formats activity details into a human-readable string
 */
const formatActivityDetails = (activity: Activity): string => {
  const { type, details } = activity;

  switch (type) {
    case 'feed': {
      const feedDetails = details as FeedDetails;
      if (!feedDetails.method) return '';
      const method = feedDetails.method.charAt(0).toUpperCase() + feedDetails.method.slice(1);
      const parts = [method];

      if (feedDetails.side) {
        parts.push(feedDetails.side.charAt(0).toUpperCase() + feedDetails.side.slice(1));
      }
      if (feedDetails.amount) {
        parts.push(`${feedDetails.amount}ml`);
      }
      if (feedDetails.duration) {
        parts.push(`${feedDetails.duration}min`);
      }

      return parts.join(' • ');
    }

    case 'diaper': {
      const diaperDetails = details as DiaperDetails;
      if (!diaperDetails.type) return '';
      const type = diaperDetails.type.charAt(0).toUpperCase() + diaperDetails.type.slice(1);
      return diaperDetails.notes ? `${type} • ${diaperDetails.notes}` : type;
    }

    case 'sleep': {
      const sleepDetails = details as SleepDetails;
      if (!sleepDetails.status) return '';
      const status = sleepDetails.status === 'start' ? 'Started' : 'Ended';
      return sleepDetails.duration
        ? `${status} • ${sleepDetails.duration}min`
        : status;
    }

    case 'pump': {
      const pumpDetails = details as PumpDetails;
      if (!pumpDetails.side) return '';
      const side = pumpDetails.side.charAt(0).toUpperCase() + pumpDetails.side.slice(1);
      const parts = [side];

      if (pumpDetails.amount) {
        parts.push(`${pumpDetails.amount}ml`);
      }
      if (pumpDetails.duration) {
        parts.push(`${pumpDetails.duration}min`);
      }

      return parts.join(' • ');
    }

    case 'growth': {
      const growthDetails = details as GrowthDetails;
      const parts: string[] = [];

      if (growthDetails.weight) {
        parts.push(`${growthDetails.weight}kg`);
      }
      if (growthDetails.height) {
        parts.push(`${growthDetails.height}cm`);
      }
      if (growthDetails.headCircumference) {
        parts.push(`Head: ${growthDetails.headCircumference}cm`);
      }

      return parts.length > 0 ? parts.join(' • ') : 'Measured';
    }

    default:
      return '';
  }
};

/**
 * Timeline item showing a single activity log entry
 * Supports long press for deletion
 */
export const TimelineItem: React.FC<TimelineItemProps> = ({
  activity,
  onLongPress,
}) => {
  const accentColor = activityColors[activity.type];
  const icon = ACTIVITY_ICONS[activity.type];
  const label = ACTIVITY_LABELS[activity.type];
  const formattedTime = format(new Date(activity.timestamp), 'h:mm a');
  const detailsText = formatActivityDetails(activity);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onLongPress={onLongPress}
      delayLongPress={500}
      accessibilityLabel={`${label} activity at ${formattedTime}`}
      accessibilityHint={onLongPress ? 'Long press to delete' : undefined}
      accessibilityRole="button"
    >
      <View
        style={[styles.iconContainer, { backgroundColor: accentColor }]}
        testID="icon-container"
      >
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.time}>{formattedTime}</Text>
        </View>

        {detailsText && (
          <Text style={styles.details}>{detailsText}</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  time: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  details: {
    fontSize: 14,
    color: colors.textLight,
  },
});
