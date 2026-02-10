import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { FormInput } from '@/components/FormInput';
import { FormButton } from '@/components/FormButton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useFamilyStore } from '@/stores/familyStore';
import { colors } from '@/constants/colors';

interface OnboardingCreateFamilyScreenProps {
  navigation: any;
}

/**
 * OnboardingCreateFamilyScreen - Create a new family
 *
 * Features:
 * - Family name input
 * - Creates family with generated invite code
 * - Shows invite code in modal/alert with copy button
 * - Navigates to add baby screen after creation
 */
export default function OnboardingCreateFamilyScreen({ navigation }: OnboardingCreateFamilyScreenProps) {
  const [familyName, setFamilyName] = useState('');
  const [touched, setTouched] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const { createFamily, loading, error } = useFamilyStore();

  const nameError = touched && !familyName ? 'Family name is required' : '';
  const isFormValid = familyName.trim().length > 0;

  const handleCreateFamily = async () => {
    setTouched(true);

    if (!isFormValid) {
      return;
    }

    const family = await createFamily(familyName.trim());

    if (family) {
      // Show invite code
      setInviteCode(family.invite_code);
    }
  };

  const handleCopyCode = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    }
  };

  const handleContinue = () => {
    navigation.navigate('OnboardingAddBaby');
  };

  // Success view with invite code
  if (inviteCode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>Family Created!</Text>

          <Text style={styles.codeLabel}>Your invite code:</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{inviteCode}</Text>
          </View>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
            testID="copy-code-button"
          >
            <Text style={styles.copyButtonText}>📋 Copy Code</Text>
          </TouchableOpacity>

          <Text style={styles.successMessage}>
            Share this code with your partner so they can join your family and track activities together!
          </Text>

          <FormButton
            title="Continue"
            onPress={handleContinue}
            testID="continue-button"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Form view
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
            <Text style={styles.title}>Create Your Family</Text>
            <Text style={styles.subtitle}>
              Choose a name for your family (you can change this later)
            </Text>
          </View>

          <View style={styles.form}>
            <ErrorMessage message={error || ''} visible={!!error} />

            <FormInput
              label="Family Name"
              placeholder="e.g., The Smiths"
              value={familyName}
              onChangeText={setFamilyName}
              onBlur={() => setTouched(true)}
              error={nameError}
              touched={touched}
              autoCapitalize="words"
              testID="family-name-input"
            />

            <FormButton
              title="Create Family"
              onPress={handleCreateFamily}
              loading={loading}
              disabled={!isFormValid}
              testID="create-button"
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
    marginBottom: 32,
    alignItems: 'center',
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
  successContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  codeLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  codeContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
    textAlign: 'center',
  },
  copyButton: {
    padding: 12,
    marginBottom: 24,
  },
  copyButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
});
