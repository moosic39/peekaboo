import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { activityColors, colors } from '@/constants/colors';
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
  onSelectOption: (option: string) => void;
  onClose: () => void;
}

/**
 * Native QuickOptionsSheet using @gorhom/bottom-sheet v5
 *
 * v5 requires the sheet to be always mounted (starting at index -1),
 * controlled via a ref rather than mount/unmount cycles.
 */
export function QuickOptionsSheet({
  activityType,
  visible,
  onSelectOption,
  onClose,
}: QuickOptionsSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%'], []);

  // Open/close the sheet imperatively when visibility changes
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  const options = activityType ? OPTIONS[activityType] : [];
  const activityColor = activityType ? activityColors[activityType] : colors.primary;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
    >
      <BottomSheetView style={styles.content}>
        {activityType && (
          <>
            <Text style={styles.title}>
              {activityType.charAt(0).toUpperCase() + activityType.slice(1)}
            </Text>
            <View style={styles.optionsContainer}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.option, { backgroundColor: activityColor }]}
                  onPress={() => onSelectOption(option.value)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${option.label}`}
                  accessibilityHint={`Tap to select ${option.label} option`}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
