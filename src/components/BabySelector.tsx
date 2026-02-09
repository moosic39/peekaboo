import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFamilyStore } from '@/stores/familyStore';
import { colors } from '@/constants/colors';

/**
 * BabySelector - Native bottom sheet for selecting active baby
 *
 * Features:
 * - Shows current baby name
 * - Opens bottom sheet with list of babies
 * - Radio selection updates currentBabyId
 * - Auto-closes on selection
 * - Disabled if only one baby
 */
export const BabySelector: React.FC = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { babies, currentBabyId, setCurrentBaby } = useFamilyStore();

  const currentBaby = babies.find((b) => b.id === currentBabyId);
  const snapPoints = useMemo(() => ['50%'], []);

  const handleOpen = () => {
    if (babies.length > 1) {
      bottomSheetRef.current?.expand();
    }
  };

  const handleSelectBaby = (babyId: string) => {
    setCurrentBaby(babyId);
    bottomSheetRef.current?.close();
  };

  if (!currentBaby) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <TouchableOpacity
        style={[styles.selector, babies.length === 1 && styles.selectorDisabled]}
        onPress={handleOpen}
        disabled={babies.length === 1}
        testID="baby-selector"
      >
        <Text style={styles.emoji}>👶</Text>
        <Text style={styles.babyName}>{currentBaby.name}</Text>
        {babies.length > 1 && <Text style={styles.arrow}>▼</Text>}
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Select Baby</Text>

          {babies.map((baby) => {
            const isSelected = baby.id === currentBabyId;

            return (
              <TouchableOpacity
                key={baby.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelectBaby(baby.id)}
                testID={`baby-option-${baby.id}`}
              >
                <View style={styles.optionContent}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {baby.name}
                  </Text>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  babyName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  arrow: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sheetBackground: {
    backgroundColor: colors.background,
  },
  sheetContent: {
    padding: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  option: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  checkmark: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});
