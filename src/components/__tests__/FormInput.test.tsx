import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FormInput } from '../FormInput';
import { colors } from '@/constants/colors';

describe('FormInput', () => {
  it('renders with label', () => {
    const { getByText } = render(
      <FormInput
        label="Email"
        value=""
        onChangeText={() => {}}
      />
    );

    expect(getByText('Email')).toBeTruthy();
  });

  it('renders with placeholder', () => {
    const { getByPlaceholderText } = render(
      <FormInput
        label="Email"
        placeholder="Enter your email"
        value=""
        onChangeText={() => {}}
      />
    );

    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
  });

  it('handles text change', () => {
    const mockOnChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <FormInput
        label="Email"
        placeholder="Enter your email"
        value=""
        onChangeText={mockOnChangeText}
      />
    );

    const input = getByPlaceholderText('Enter your email');
    fireEvent.changeText(input, 'test@test.com');

    expect(mockOnChangeText).toHaveBeenCalledWith('test@test.com');
  });

  it('does not show error when not touched', () => {
    const { queryByText } = render(
      <FormInput
        label="Email"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
        touched={false}
      />
    );

    expect(queryByText('Invalid email')).toBeNull();
  });

  it('shows error when touched and error exists', () => {
    const { getByText } = render(
      <FormInput
        label="Email"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
        touched={true}
      />
    );

    expect(getByText('Invalid email')).toBeTruthy();
  });

  it('applies error styling when touched and error exists', () => {
    const { getByPlaceholderText } = render(
      <FormInput
        label="Email"
        placeholder="Enter your email"
        value=""
        onChangeText={() => {}}
        error="Invalid email"
        touched={true}
      />
    );

    const input = getByPlaceholderText('Enter your email');
    const styles = Array.isArray(input.props.style)
      ? input.props.style
      : [input.props.style];

    // Check that error style is applied in the array
    const hasErrorStyle = styles.some((style: any) =>
      style?.borderColor === colors.error && style?.borderWidth === 2
    );
    expect(hasErrorStyle).toBe(true);
  });

  it('handles secure text entry for passwords', () => {
    const { getByPlaceholderText } = render(
      <FormInput
        label="Password"
        placeholder="Enter password"
        value=""
        onChangeText={() => {}}
        secureTextEntry={true}
      />
    );

    const input = getByPlaceholderText('Enter password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('handles different keyboard types', () => {
    const { getByPlaceholderText } = render(
      <FormInput
        label="Email"
        placeholder="Enter email"
        value=""
        onChangeText={() => {}}
        keyboardType="email-address"
      />
    );

    const input = getByPlaceholderText('Enter email');
    expect(input.props.keyboardType).toBe('email-address');
  });

  it('handles auto capitalization', () => {
    const { getByPlaceholderText } = render(
      <FormInput
        label="Name"
        placeholder="Enter name"
        value=""
        onChangeText={() => {}}
        autoCapitalize="words"
      />
    );

    const input = getByPlaceholderText('Enter name');
    expect(input.props.autoCapitalize).toBe('words');
  });
});
