import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FormInput } from '@/components/FormInput';
import { FormButton } from '@/components/FormButton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useFamilyStore } from '@/stores/familyStore';
import { colors } from '@/constants/colors';

interface OnboardingJoinFamilyScreenProps {
  navigation: any;
}

/**
 * OnboardingJoinFamilyScreen - Join existing family with invite code
 *
 * Features:
 * - 6-character invite code input (auto-uppercase)
 * - Validates code format
 * - Joins family via familyStore
 * - Navigates to add baby or main app based on baby count
 */
export default function OnboardingJoinFamilyScreen({ navigation }: OnboardingJoinFamilyScreenProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [touched, setTouched] = useState(false);

  const { joinFamily, loading, error, babies } = useFamilyStore();

  const codeError = touched && !inviteCode
    ? 'Invite code is required'
    : touched && inviteCode.length !== 6
    ? 'Invite code must be 6 characters'
    : '';

  const isFormValid = inviteCode.length === 6;

  const handleCodeChange = (text: string) => {
    // Auto-uppercase and limit to 6 characters
    const upperText = text.toUpperCase().substring(0, 6);
    setInviteCode(upperText);
  };

  const handleJoinFamily = async () => {
    setTouched(true);

    if (!isFormValid) {
      return;
    }

    const family = await joinFamily(inviteCode);

    if (family) {
      // Check if family has babies
      if (babies.length > 0) {
        // Family has babies, go to main app
        // Navigation will be handled by App.tsx when needsOnboarding becomes false
      } else {
        // No babies, need to add one
        navigation.navigate('OnboardingAddBaby');
      }
    }
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
            <Text style={styles.emoji}>🔗</Text>
            <Text style={styles.title}>Join Your Family</Text>
            <Text style={styles.subtitle}>
              Enter the 6-character invite code your partner shared with you
            </Text>
          </View>

          <View style={styles.form}>
            <ErrorMessage message={error || ''} visible={!!error} />

            <FormInput
              label="Invite Code"
              placeholder="ABC123"
              value={inviteCode}
              onChangeText={handleCodeChange}
              onBlur={() => setTouched(true)}
              error={codeError}
              touched={touched}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              testID="invite-code-input"
            />

            <View style={styles.hint}>
              <Text style={styles.hintText}>
                💡 The invite code is case-insensitive and exactly 6 characters long
              </Text>
            </View>

            <FormButton
              title="Join Family"
              onPress={handleJoinFamily}
              loading={loading}
              disabled={!isFormValid}
              testID="join-button"
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
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  hint: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  hintText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
