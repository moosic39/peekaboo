import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatDistanceToNow } from 'date-fns';
import { ActivityType } from '@/types';
import { activityColors, colors } from '@/constants/colors';
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/constants/activities';

export interface LastActivityCardProps {
  type: ActivityType;
  timestamp: string;
  details?: string;
}

/**
 * Displays the last occurrence of a specific activity type
 * Shows time elapsed since the activity in a human-readable format
 */
export const LastActivityCard: React.FC<LastActivityCardProps> = ({
  type,
  timestamp,
  details,
}) => {
  const accentColor = activityColors[type];
  const icon = ACTIVITY_ICONS[type];
  const label = ACTIVITY_LABELS[type];

  // Calculate time ago from timestamp
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </View>
      {details && <Text style={styles.details}>{details}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  details: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 8,
    marginLeft: 36,
  },
});
