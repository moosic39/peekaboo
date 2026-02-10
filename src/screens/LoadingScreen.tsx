import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/constants/colors';

/**
 * LoadingScreen - Shown while checking authentication state
 * Displays during app initialization
 */
export default function LoadingScreen() {
  console.log('LoadingScreen: Rendering...');
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👶</Text>
      <Text style={styles.title}>Peekaboo</Text>
      <Text style={styles.subtitle}>Loading...</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  loader: {
    marginTop: 16,
  },
});
