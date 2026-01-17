import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QuickOptionsSheet } from '../QuickOptionsSheet';
import { activityColors } from '@/constants/colors';

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    __esModule: true,
    default: ({ children, index }: any) => {
      // Only render when index >= 0 (visible)
      if (index < 0) return null;
      return <View testID="bottom-sheet">{children}</View>;
    },
    BottomSheetBackdrop: ({ onPress }: any) => {
      const { TouchableOpacity } = require('react-native');
      return (
        <TouchableOpacity testID="backdrop" onPress={onPress}>
          <View />
        </TouchableOpacity>
      );
    },
  };
});

describe('QuickOptionsSheet', () => {
  const mockOnSelectOption = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnSelectOption.mockClear();
    mockOnClose.mockClear();
  });

  it('renders nothing when activityType is null', () => {
    const { queryByTestId } = render(
      <QuickOptionsSheet
        activityType={null}
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(queryByTestId('bottom-sheet')).toBeNull();
  });

  it('renders nothing when not visible', () => {
    const { queryByTestId } = render(
      <QuickOptionsSheet
        activityType="feed"
        visible={false}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(queryByTestId('bottom-sheet')).toBeNull();
  });

  it('renders when visible with activity type', () => {
    const { getByTestId } = render(
      <QuickOptionsSheet
        activityType="feed"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(getByTestId('bottom-sheet')).toBeTruthy();
  });

  it('displays correct title for feed activity', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="feed"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Feed')).toBeTruthy();
  });

  it('displays correct options for feed activity', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="feed"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Breast')).toBeTruthy();
    expect(getByText('Bottle')).toBeTruthy();
    expect(getByText('Both')).toBeTruthy();
  });

  it('displays correct options for diaper activity', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="diaper"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Wet')).toBeTruthy();
    expect(getByText('Dirty')).toBeTruthy();
    expect(getByText('Both')).toBeTruthy();
  });

  it('displays correct options for sleep activity', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="sleep"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Start')).toBeTruthy();
    expect(getByText('End')).toBeTruthy();
  });

  it('displays correct options for pump activity', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="pump"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Left')).toBeTruthy();
    expect(getByText('Right')).toBeTruthy();
    expect(getByText('Both')).toBeTruthy();
  });

  it('displays correct options for growth activity', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="growth"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Weight')).toBeTruthy();
    expect(getByText('Height')).toBeTruthy();
    expect(getByText('Both')).toBeTruthy();
  });

  it('calls onSelectOption when an option is pressed', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="feed"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByText('Breast'));
    expect(mockOnSelectOption).toHaveBeenCalledWith('breast');
    expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectOption with correct value for different options', () => {
    const { getByText } = render(
      <QuickOptionsSheet
        activityType="diaper"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    fireEvent.press(getByText('Dirty'));
    expect(mockOnSelectOption).toHaveBeenCalledWith('dirty');

    mockOnSelectOption.mockClear();

    fireEvent.press(getByText('Both'));
    expect(mockOnSelectOption).toHaveBeenCalledWith('both');
  });

  it('has proper accessibility properties on options', () => {
    const { getByLabelText } = render(
      <QuickOptionsSheet
        activityType="feed"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    const breastOption = getByLabelText('Select Breast');
    expect(breastOption).toBeTruthy();
    expect(breastOption.props.accessibilityHint).toBe('Tap to select Breast option');
  });

  it('applies correct activity color to feed options', () => {
    const { getByLabelText } = render(
      <QuickOptionsSheet
        activityType="feed"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    const option = getByLabelText('Select Breast');
    expect(option.props.style).toMatchObject({
      backgroundColor: activityColors.feed,
    });
  });

  it('applies correct activity color to diaper options', () => {
    const { getByLabelText } = render(
      <QuickOptionsSheet
        activityType="diaper"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    const option = getByLabelText('Select Wet');
    expect(option.props.style).toMatchObject({
      backgroundColor: activityColors.diaper,
    });
  });

  it('applies correct activity color to sleep options', () => {
    const { getByLabelText } = render(
      <QuickOptionsSheet
        activityType="sleep"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    const option = getByLabelText('Select Start');
    expect(option.props.style).toMatchObject({
      backgroundColor: activityColors.sleep,
    });
  });

  it('applies correct activity color to pump options', () => {
    const { getByLabelText } = render(
      <QuickOptionsSheet
        activityType="pump"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    const option = getByLabelText('Select Left');
    expect(option.props.style).toMatchObject({
      backgroundColor: activityColors.pump,
    });
  });

  it('applies correct activity color to growth options', () => {
    const { getByLabelText } = render(
      <QuickOptionsSheet
        activityType="growth"
        visible={true}
        onSelectOption={mockOnSelectOption}
        onClose={mockOnClose}
      />
    );

    const option = getByLabelText('Select Weight');
    expect(option.props.style).toMatchObject({
      backgroundColor: activityColors.growth,
    });
  });
});
