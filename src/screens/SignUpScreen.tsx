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
  Alert,
} from 'react-native';
import { FormInput } from '@/components/FormInput';
import { FormButton } from '@/components/FormButton';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';

interface SignUpScreenProps {
  navigation: any;
}

/**
 * SignUpScreen - New user registration
 *
 * Features:
 * - Email and password validation
 * - Password confirmation matching
 * - Minimum password length requirement (8 characters)
 * - Success message after sign up
 * - Email verification notice
 * - Navigation back to sign in
 */
export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const { signUp, loading, error, clearError } = useAuthStore();

  // Validation
  const emailError = touched.email && !email ? 'Email is required' :
                     touched.email && !isValidEmail(email) ? 'Invalid email format' : '';

  const passwordError = touched.password && !password ? 'Password is required' :
                        touched.password && password.length < 8 ? 'Password must be at least 8 characters' : '';

  const confirmPasswordError = touched.confirmPassword && !confirmPassword ? 'Please confirm password' :
                               touched.confirmPassword && password !== confirmPassword ? 'Passwords do not match' : '';

  const isFormValid = email &&
                      password &&
                      confirmPassword &&
                      isValidEmail(email) &&
                      password.length >= 8 &&
                      password === confirmPassword;

  const handleSignUp = async () => {
    // Mark all fields as touched
    setTouched({ email: true, password: true, confirmPassword: true });

    if (!isFormValid) {
      return;
    }

    clearError();
    const success = await signUp(email, password);

    if (success) {
      // Show success message and navigate to sign in
      Alert.alert(
        'Success! 🎉',
        'Check your email to verify your account. Once verified, you can sign in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    }
  };

  const handleNavigateToSignIn = () => {
    clearError();
    navigation.navigate('SignIn');
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
            <Text style={styles.title}>Create Account 👶</Text>
            <Text style={styles.subtitle}>Start tracking your baby's activities</Text>
          </View>

          <View style={styles.form}>
            <ErrorMessage message={error || ''} visible={!!error} />

            <FormInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setTouched({ ...touched, email: true })}
              error={emailError}
              touched={touched.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="email-input"
            />

            <FormInput
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setTouched({ ...touched, password: true })}
              error={passwordError}
              touched={touched.password}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              testID="password-input"
            />

            <FormInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              error={confirmPasswordError}
              touched={touched.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              testID="confirm-password-input"
            />

            <FormButton
              title="Sign Up"
              onPress={handleSignUp}
              loading={loading}
              disabled={!isFormValid}
              testID="sign-up-button"
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={handleNavigateToSignIn}
                testID="sign-in-link"
              >
                <Text style={styles.footerLink}>Sign In</Text>
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
  },
  form: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});
