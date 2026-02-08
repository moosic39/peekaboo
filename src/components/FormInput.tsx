import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '@/constants/colors';

export interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
}

/**
 * Reusable text input component with label and error display
 * Follows app design system with proper error states
 */
export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  touched,
  style,
  ...textInputProps
}) => {
  const hasError = touched && error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.textLight}
        {...textInputProps}
      />
      {hasError && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 56,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 6,
  },
});
