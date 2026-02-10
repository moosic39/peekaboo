import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpScreen from '../SignUpScreen';
import { useAuthStore } from '@/stores/authStore';

// Mock the auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      error: null,
      clearError: jest.fn(),
    } as any);
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    expect(getByText('Create Account 👶')).toBeTruthy();
    expect(getByText("Start tracking your baby's activities")).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('At least 8 characters')).toBeTruthy();
    expect(getByPlaceholderText('Re-enter your password')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByTestId, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent(emailInput, 'blur');

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeTruthy();
    });
  });

  it('validates password length', async () => {
    const { getByTestId, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(passwordInput, 'short');
    fireEvent(passwordInput, 'blur');

    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters')).toBeTruthy();
    });
  });

  it('validates password confirmation', async () => {
    const { getByTestId, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const passwordInput = getByTestId('password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'different');
    fireEvent(confirmPasswordInput, 'blur');

    await waitFor(() => {
      expect(getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('validates all required fields', async () => {
    const { getByTestId, getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');

    fireEvent(emailInput, 'blur');
    fireEvent(passwordInput, 'blur');
    fireEvent(confirmPasswordInput, 'blur');

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
      expect(getByText('Please confirm password')).toBeTruthy();
    });
  });

  it('calls signUp with valid data', async () => {
    const mockSignUp = jest.fn().mockResolvedValue(true);
    mockUseAuthStore.mockReturnValue({
      signUp: mockSignUp,
      loading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const signUpButton = getByTestId('sign-up-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('shows success alert after sign up', async () => {
    const mockSignUp = jest.fn().mockResolvedValue(true);
    mockUseAuthStore.mockReturnValue({
      signUp: mockSignUp,
      loading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const signUpButton = getByTestId('sign-up-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');
    fireEvent.press(signUpButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success! 🎉',
        'Check your email to verify your account. Once verified, you can sign in.',
        expect.any(Array)
      );
    });
  });

  it('disables button when form is invalid', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const signUpButton = getByTestId('sign-up-button');
    expect(signUpButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables button when form is valid', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const signUpButton = getByTestId('sign-up-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');

    expect(signUpButton.props.accessibilityState.disabled).toBe(false);
  });

  it('displays error message from auth store', () => {
    mockUseAuthStore.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      error: 'Email already in use',
      clearError: jest.fn(),
    });

    const { getByText } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    expect(getByText('Email already in use')).toBeTruthy();
  });

  it('shows loading state during sign up', () => {
    mockUseAuthStore.mockReturnValue({
      signUp: jest.fn(),
      loading: true,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const signUpButton = getByTestId('sign-up-button');
    expect(signUpButton.props.accessibilityState.busy).toBe(true);
  });

  it('navigates to sign in screen', () => {
    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const signInLink = getByTestId('sign-in-link');
    fireEvent.press(signInLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
  });

  it('clears error when navigating away', () => {
    const mockClearError = jest.fn();
    mockUseAuthStore.mockReturnValue({
      signUp: jest.fn(),
      loading: false,
      error: 'Some error',
      clearError: mockClearError,
    });

    const { getByTestId } = render(
      <SignUpScreen navigation={mockNavigation} />
    );

    const signInLink = getByTestId('sign-in-link');
    fireEvent.press(signInLink);

    expect(mockClearError).toHaveBeenCalled();
  });
});
