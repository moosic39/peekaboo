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

interface SignInScreenProps {
  navigation: any;
}

/**
 * SignInScreen - User authentication with email/password
 *
 * Features:
 * - Email and password validation
 * - Error display for auth failures
 * - Loading states during sign in
 * - Navigation to sign up and forgot password
 * - Email verification check
 */
export default function SignInScreen({ navigation }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const { signIn, loading, error, clearError } = useAuthStore();

  // Validation
  const emailError = touched.email && !email ? 'Email is required' :
                     touched.email && !isValidEmail(email) ? 'Invalid email format' : '';

  const passwordError = touched.password && !password ? 'Password is required' : '';

  const isFormValid = email && password && isValidEmail(email);

  const handleSignIn = async () => {
    // Mark all fields as touched
    setTouched({ email: true, password: true });

    if (!isFormValid) {
      return;
    }

    clearError();
    const success = await signIn(email, password);

    if (success) {
      // Navigation is handled by App.tsx based on auth state
      console.log('Sign in successful');
    }
  };

  const handleNavigateToSignUp = () => {
    clearError();
    navigation.navigate('SignUp');
  };

  const handleNavigateToForgotPassword = () => {
    clearError();
    navigation.navigate('ForgotPassword');
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
            <Text style={styles.title}>Welcome to Peekaboo 👶</Text>
            <Text style={styles.subtitle}>Sign in to track your baby's activities</Text>
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
              placeholder="Enter your password"
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

            <TouchableOpacity
              onPress={handleNavigateToForgotPassword}
              style={styles.forgotPassword}
              testID="forgot-password-link"
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <FormButton
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              disabled={!isFormValid}
              testID="sign-in-button"
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={handleNavigateToSignUp}
                testID="sign-up-link"
              >
                <Text style={styles.footerLink}>Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
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
