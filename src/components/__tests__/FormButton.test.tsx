import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FormButton } from '../FormButton';
import { colors } from '@/constants/colors';

describe('FormButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders with title', () => {
    const { getByText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
      />
    );

    expect(getByText('Submit')).toBeTruthy();
  });

  it('handles press events', () => {
    const { getByText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
      />
    );

    fireEvent.press(getByText('Submit'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { queryByText, getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
        loading={true}
      />
    );

    // Title should not be visible
    expect(queryByText('Submit')).toBeNull();

    // ActivityIndicator should be present
    const button = getByLabelText('Submit');
    expect(button.props.accessibilityState.busy).toBe(true);
  });

  it('does not call onPress when loading', () => {
    const { getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
        loading={true}
      />
    );

    const button = getByLabelText('Submit');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const { getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
        disabled={true}
      />
    );

    const button = getByLabelText('Submit');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('applies primary variant styling by default', () => {
    const { getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
      />
    );

    const button = getByLabelText('Submit');
    expect(button.props.style).toMatchObject({
      backgroundColor: colors.primary,
    });
  });

  it('applies secondary variant styling', () => {
    const { getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
        variant="secondary"
      />
    );

    const button = getByLabelText('Submit');
    expect(button.props.style).toMatchObject({
      backgroundColor: colors.surface,
    });
  });

  it('applies danger variant styling', () => {
    const { getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Delete"
        variant="danger"
      />
    );

    const button = getByLabelText('Delete');
    expect(button.props.style).toMatchObject({
      backgroundColor: colors.error,
    });
  });

  it('applies disabled styling when disabled', () => {
    const { getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
        disabled={true}
      />
    );

    const button = getByLabelText('Submit');
    expect(button.props.style).toMatchObject({
      backgroundColor: colors.textLight,
    });
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('applies disabled styling when loading', () => {
    const { getByLabelText } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
        loading={true}
      />
    );

    const button = getByLabelText('Submit');
    expect(button.props.style).toMatchObject({
      backgroundColor: colors.textLight,
    });
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it('has proper accessibility properties', () => {
    const { getByLabelText, getByRole } = render(
      <FormButton
        onPress={mockOnPress}
        title="Submit"
      />
    );

    const button = getByLabelText('Submit');
    expect(button).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });
});
