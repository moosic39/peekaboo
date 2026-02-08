import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

export interface ErrorMessageProps {
  message: string;
  visible?: boolean;
}

/**
 * Error display component with icon and styled container
 * Shows validation and server errors in a consistent format
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  visible = true,
}) => {
  if (!visible || !message) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>❌</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
});
