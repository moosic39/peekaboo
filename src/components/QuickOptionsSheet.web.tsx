import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
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
    { label: 'Start', value: 'start' },
    { label: 'End', value: 'end' },
  ],
  pump: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
    { label: 'Both', value: 'both' },
  ],
  growth: [
    { label: 'Weight', value: 'weight' },
    { label: 'Height', value: 'height' },
    { label: 'Both', value: 'both' },
  ],
};

interface QuickOptionsSheetProps {
  activityType: ActivityType | null;
  visible: boolean;
  onSelectOption: (value: string) => void;
  onClose: () => void;
}

/**
 * Web-compatible version of QuickOptionsSheet using Modal instead of BottomSheet
 * Falls back to a simple modal dialog for web browsers
 */
export function QuickOptionsSheet({
  activityType,
  visible,
  onSelectOption,
  onClose,
}: QuickOptionsSheetProps) {
  if (!activityType) {
    return null;
  }

  const options = OPTIONS[activityType];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.sheet}>
            <Text style={styles.title}>
              {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
            </Text>
            <View style={styles.optionsRow}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, { backgroundColor: colors[activityType] }]}
                  onPress={() => onSelectOption(option.value)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
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
