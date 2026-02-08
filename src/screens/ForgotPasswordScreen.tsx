import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FormInput } from '@/components/FormInput';
import { FormButton } from '@/components/FormButton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

interface ForgotPasswordScreenProps {
  navigation: any;
}

/**
 * ForgotPasswordScreen - Password reset request
 *
 * Features:
 * - Email validation
 * - Password reset email sending
 * - Success message display
 * - Navigation back to sign in
 */
export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { resetPassword, loading, error, clearError } = useAuthStore();

  // Validation
  const emailError = touched && !email ? 'Email is required' :
                     touched && !isValidEmail(email) ? 'Invalid email format' : '';

  const isFormValid = email && isValidEmail(email);

  const handleResetPassword = async () => {
    setTouched(true);

    if (!isFormValid) {
      return;
    }

    clearError();
    const success = await resetPassword(email);

    if (success) {
      setResetSent(true);
    }
  };

  const handleNavigateToSignIn = () => {
    clearError();
    navigation.navigate('SignIn');
  };

  if (resetSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successMessage}>
            We've sent password reset instructions to:
          </Text>
          <Text style={styles.successEmail}>{email}</Text>
          <Text style={styles.successNote}>
            If you don't see the email, check your spam folder.
          </Text>

          <FormButton
            title="Back to Sign In"
            onPress={handleNavigateToSignIn}
            testID="back-to-sign-in-button"
          />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.title}>Reset Password 🔑</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you instructions to reset your password
            </Text>
          </View>

          <View style={styles.form}>
            <ErrorMessage message={error || ''} visible={!!error} />

            <FormInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched(true)}
              error={emailError}
              touched={touched}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="email-input"
            />

            <FormButton
              title="Send Reset Link"
              onPress={handleResetPassword}
              loading={loading}
              disabled={!isFormValid}
              testID="reset-button"
            />

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleNavigateToSignIn}
                testID="sign-in-link"
              >
                <Text style={styles.footerLink}>← Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Email validation helper
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  successNote: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
});
