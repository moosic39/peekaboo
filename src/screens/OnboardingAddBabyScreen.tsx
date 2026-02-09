import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FormInput } from '@/components/FormInput';
import { FormButton } from '@/components/FormButton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useFamilyStore } from '@/stores/familyStore';
import { colors } from '@/constants/colors';

interface OnboardingAddBabyScreenProps {
  navigation: any;
}

/**
 * OnboardingAddBabyScreen - Add baby profile
 *
 * Features:
 * - Baby name input
 * - Birthdate picker
 * - Optional gender selection
 * - Creates baby in current family
 * - Completes onboarding (navigates to main app via App.tsx)
 */
export default function OnboardingAddBabyScreen({ navigation }: OnboardingAddBabyScreenProps) {
  const [babyName, setBabyName] = useState('');
  const [birthdate, setBirthdate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say' | null>(null);
  const [touched, setTouched] = useState({ name: false });

  const { createBaby, currentFamilyId, loading, error } = useFamilyStore();

  const nameError = touched.name && !babyName ? 'Baby name is required' : '';
  const isFormValid = babyName.trim().length > 0;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthdate(selectedDate);
    }
  };

  const handleAddBaby = async () => {
    setTouched({ name: true });

    if (!isFormValid || !currentFamilyId) {
      return;
    }

    const baby = await createBaby(
      currentFamilyId,
      babyName.trim(),
      birthdate.toISOString().split('T')[0], // YYYY-MM-DD format
      gender || undefined
    );

    if (baby) {
      // Navigation to main app will be handled by App.tsx
      // when needsOnboarding becomes false
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>👶</Text>
            <Text style={styles.title}>Add Your Baby</Text>
            <Text style={styles.subtitle}>
              Tell us about your little one
            </Text>
          </View>

          <View style={styles.form}>
            <ErrorMessage message={error || ''} visible={!!error} />

            <FormInput
              label="Baby's Name"
              placeholder="e.g., Emma"
              value={babyName}
              onChangeText={setBabyName}
              onBlur={() => setTouched({ ...touched, name: true })}
              error={nameError}
              touched={touched.name}
              autoCapitalize="words"
              testID="baby-name-input"
            />

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Birthdate</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                testID="date-picker-button"
              >
                <Text style={styles.dateButtonText}>{formatDate(birthdate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={birthdate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  testID="date-picker"
                />
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Gender (Optional)</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender(gender === 'male' ? null : 'male')}
                  testID="gender-male"
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'male' && styles.genderButtonTextSelected,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'female' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender(gender === 'female' ? null : 'female')}
                  testID="gender-female"
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'female' && styles.genderButtonTextSelected,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'other' && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender(gender === 'other' ? null : 'other')}
                  testID="gender-other"
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'other' && styles.genderButtonTextSelected,
                    ]}
                  >
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <FormButton
              title="Add Baby"
              onPress={handleAddBaby}
              loading={loading}
              disabled={!isFormValid}
              testID="add-baby-button"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.background,
    minHeight: 56,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
});
