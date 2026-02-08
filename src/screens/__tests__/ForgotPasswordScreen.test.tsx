import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../ForgotPasswordScreen';
import { useAuthStore } from '@/stores/authStore';

// Mock the auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      resetPassword: jest.fn(),
      loading: false,
      error: null,
      clearError: jest.fn(),
    });
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    expect(getByText('Reset Password 🔑')).toBeTruthy();
    expect(getByText(/Enter your email and we'll send you instructions/)).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByTestId, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent(emailInput, 'blur');

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeTruthy();
    });
  });

  it('validates required email', async () => {
    const { getByTestId, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');

    fireEvent(emailInput, 'blur');

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
    });
  });

  it('calls resetPassword with valid email', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue(true);
    (useAuthStore as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const resetButton = getByTestId('reset-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@test.com');
    });
  });

  it('shows success screen after reset', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue(true);
    (useAuthStore as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId, getByText, findByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const resetButton = getByTestId('reset-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.press(resetButton);

    // Wait for async state update to show success view
    await findByText('Check Your Email');

    expect(getByText('test@test.com')).toBeTruthy();
    expect(getByText(/If you don't see the email, check your spam folder/)).toBeTruthy();
  });

  it('disables button when form is invalid', () => {
    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const resetButton = getByTestId('reset-button');
    expect(resetButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables button when form is valid', () => {
    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const resetButton = getByTestId('reset-button');

    fireEvent.changeText(emailInput, 'test@test.com');

    expect(resetButton.props.accessibilityState.disabled).toBe(false);
  });

  it('displays error message from auth store', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      resetPassword: jest.fn(),
      loading: false,
      error: 'Email not found',
      clearError: jest.fn(),
    });

    const { getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    expect(getByText('Email not found')).toBeTruthy();
  });

  it('shows loading state during reset', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      resetPassword: jest.fn(),
      loading: true,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const resetButton = getByTestId('reset-button');
    expect(resetButton.props.accessibilityState.busy).toBe(true);
  });

  it('navigates to sign in screen from initial view', () => {
    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const signInLink = getByTestId('sign-in-link');
    fireEvent.press(signInLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('navigates to sign in screen from success view', async () => {
    const mockResetPassword = jest.fn().mockResolvedValue(true);
    (useAuthStore as jest.Mock).mockReturnValue({
      resetPassword: mockResetPassword,
      loading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const resetButton = getByTestId('reset-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.press(resetButton);

    await waitFor(() => {
      expect(getByTestId('back-to-sign-in-button')).toBeTruthy();
    });

    const backButton = getByTestId('back-to-sign-in-button');
    fireEvent.press(backButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('clears error when navigating away', () => {
    const mockClearError = jest.fn();
    (useAuthStore as jest.Mock).mockReturnValue({
      resetPassword: jest.fn(),
      loading: false,
      error: 'Some error',
      clearError: mockClearError,
    });

    const { getByTestId } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    const signInLink = getByTestId('sign-in-link');
    fireEvent.press(signInLink);

    expect(mockClearError).toHaveBeenCalled();
  });
});
