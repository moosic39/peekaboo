import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ActivityType } from '@/types';
import { activityColors } from '@/constants/colors';

export interface ActivityButtonProps {
  type: ActivityType;
  onPress: () => void;
  label: string;
  icon: string;
}

/**
 * Large, tappable button for logging activities
 * Optimized for one-handed use with clear visual distinction
 */
export const ActivityButton: React.FC<ActivityButtonProps> = ({
  type,
  onPress,
  label,
  icon,
}) => {
  const backgroundColor = activityColors[type];

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Log ${label} activity`}
      accessibilityHint={`Tap to record a ${label} activity`}
      accessibilityRole="button"
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 16,
    padding: 20,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
