import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useFamilyStore } from '@/stores/familyStore';
import { colors } from '@/constants/colors';

/**
 * BabySelector - Web modal for selecting active baby
 *
 * Features:
 * - Shows current baby name
 * - Opens modal with list of babies
 * - Radio selection updates currentBabyId
 * - Auto-closes on selection
 * - Disabled if only one baby
 */
export const BabySelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { babies, currentBabyId, setCurrentBaby } = useFamilyStore();

  const currentBaby = babies.find((b) => b.id === currentBabyId);

  const handleOpen = () => {
    if (babies.length > 1) {
      setIsOpen(true);
    }
  };

  const handleSelectBaby = (babyId: string) => {
    setCurrentBaby(babyId);
    setIsOpen(false);
  };

  if (!currentBaby) {
    return null;
  }

  return (
    <View style={styles.container}>
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

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Select Baby</Text>

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

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
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
  cancelButton: {
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
