import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { FormButton } from '@/components/FormButton';
import { colors } from '@/constants/colors';

interface OnboardingWelcomeScreenProps {
  navigation: any;
}

/**
 * OnboardingWelcomeScreen - First screen after sign up
 *
 * Features:
 * - Welcome message with emoji
 * - Two options: Create New Family or Join Existing Family
 * - Large, touch-friendly buttons
 */
export default function OnboardingWelcomeScreen({ navigation }: OnboardingWelcomeScreenProps) {
  const handleCreateFamily = () => {
    navigation.navigate('OnboardingCreateFamily');
  };

  const handleJoinFamily = () => {
    navigation.navigate('OnboardingJoinFamily');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>👶</Text>
          <Text style={styles.title}>Welcome to Peekaboo!</Text>
          <Text style={styles.subtitle}>Let's set up your family</Text>
        </View>

        <View style={styles.buttons}>
          <FormButton
            title="Create New Family"
            onPress={handleCreateFamily}
            testID="create-family-button"
          />

          <View style={styles.spacer} />

          <FormButton
            title="Join Existing Family"
            onPress={handleJoinFamily}
            variant="secondary"
            testID="join-family-button"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
  },
  spacer: {
    height: 16,
  },
});
