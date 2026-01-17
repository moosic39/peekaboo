import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityButton } from '../ActivityButton';
import { activityColors } from '@/constants/colors';

describe('ActivityButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders with correct label', () => {
    const { getByText } = render(
      <ActivityButton
        type="feed"
        onPress={mockOnPress}
        label="Feeding"
        icon="🍼"
      />
    );

    expect(getByText('Feeding')).toBeTruthy();
  });

  it('renders with correct icon', () => {
    const { getByText } = render(
      <ActivityButton
        type="feed"
        onPress={mockOnPress}
        label="Feeding"
        icon="🍼"
      />
    );

    expect(getByText('🍼')).toBeTruthy();
  });

  it('handles press events', () => {
    const { getByText } = render(
      <ActivityButton
        type="feed"
        onPress={mockOnPress}
        label="Feeding"
        icon="🍼"
      />
    );

    fireEvent.press(getByText('Feeding'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('applies correct background color for feed type', () => {
    const { getByLabelText } = render(
      <ActivityButton
        type="feed"
        onPress={mockOnPress}
        label="Feeding"
        icon="🍼"
      />
    );

    const button = getByLabelText('Log Feeding activity');
    expect(button.props.style).toMatchObject({
      backgroundColor: activityColors.feed,
    });
  });

  it('applies correct background color for diaper type', () => {
    const { getByLabelText } = render(
      <ActivityButton
        type="diaper"
        onPress={mockOnPress}
        label="Diaper"
        icon="🍑"
      />
    );

    const button = getByLabelText('Log Diaper activity');
    expect(button.props.style).toMatchObject({
      backgroundColor: activityColors.diaper,
    });
  });

  it('applies correct background color for sleep type', () => {
    const { getByLabelText } = render(
      <ActivityButton
        type="sleep"
        onPress={mockOnPress}
        label="Sleep"
        icon="😴"
      />
    );

    const button = getByLabelText('Log Sleep activity');
    expect(button.props.style).toMatchObject({
      backgroundColor: activityColors.sleep,
    });
  });

  it('applies correct background color for pump type', () => {
    const { getByLabelText } = render(
      <ActivityButton
        type="pump"
        onPress={mockOnPress}
        label="Pump"
        icon="🍶"
      />
    );

    const button = getByLabelText('Log Pump activity');
    expect(button.props.style).toMatchObject({
      backgroundColor: activityColors.pump,
    });
  });

  it('applies correct background color for growth type', () => {
    const { getByLabelText } = render(
      <ActivityButton
        type="growth"
        onPress={mockOnPress}
        label="Growth"
        icon="📏"
      />
    );

    const button = getByLabelText('Log Growth activity');
    expect(button.props.style).toMatchObject({
      backgroundColor: activityColors.growth,
    });
  });

  it('has proper accessibility properties', () => {
    const { getByLabelText, getByRole } = render(
      <ActivityButton
        type="feed"
        onPress={mockOnPress}
        label="Feeding"
        icon="🍼"
      />
    );

    const button = getByLabelText('Log Feeding activity');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityHint).toBe('Tap to record a Feeding activity');
    expect(getByRole('button')).toBeTruthy();
  });
});
