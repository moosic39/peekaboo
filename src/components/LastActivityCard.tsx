import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { ActivityType } from '@/types';
import { activityColors, activityColorsBg, activityColorsBorder, colors } from '@/constants/colors';
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/constants/activities';

export interface LastActivityCardProps {
  type: ActivityType;
  timestamp: string;
  details?: string;
}

/**
 * Displays the last occurrence of a specific activity type
 * Glass card with colored icon circle and glow
 */
export const LastActivityCard: React.FC<LastActivityCardProps> = ({
  type,
  timestamp,
  details,
}) => {
  const accentColor = activityColors[type];
  const bgColor = activityColorsBg[type];
  const borderColor = activityColorsBorder[type];
  const icon = ACTIVITY_ICONS[type];
  const label = ACTIVITY_LABELS[type];

  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: bgColor, borderColor, shadowColor: accentColor },
        ]}
      >
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
        {details && <Text style={styles.details}>{details}</Text>}
      </View>

      <View style={[styles.dot, { backgroundColor: accentColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  details: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 8,
  },
});
