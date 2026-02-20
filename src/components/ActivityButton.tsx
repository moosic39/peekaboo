import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ActivityType } from '@/types';
import { activityColors, activityColorsBg, activityColorsBorder } from '@/constants/colors';

export interface ActivityButtonProps {
  type: ActivityType;
  onPress: () => void;
  label: string;
  icon: string;
}

/**
 * Large, tappable button for logging activities
 * Dark glass design with color-matched glow border
 */
export const ActivityButton: React.FC<ActivityButtonProps> = ({
  type,
  onPress,
  label,
  icon,
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
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    padding: 20,
    minHeight: 110,
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
});
