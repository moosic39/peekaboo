import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignInScreen from '../SignInScreen';
import { useAuthStore } from '@/stores/authStore';

// Mock the auth store
jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
};

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: null,
      clearError: jest.fn(),
    });
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    expect(getByText('Welcome to Peekaboo 👶')).toBeTruthy();
    expect(getByText("Sign in to track your baby's activities")).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('validates email format', async () => {
    const { getByTestId, getByText } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent(emailInput, 'blur');

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeTruthy();
    });
  });

  it('validates required fields', async () => {
    const { getByTestId, getByText } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');

    fireEvent(emailInput, 'blur');
    fireEvent(passwordInput, 'blur');

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('calls signIn with valid credentials', async () => {
    const mockSignIn = jest.fn().mockResolvedValue(true);
    (useAuthStore as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const signInButton = getByTestId('sign-in-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('disables button when form is invalid', () => {
    const { getByTestId } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const signInButton = getByTestId('sign-in-button');
    expect(signInButton.props.accessibilityState.disabled).toBe(true);
  });

  it('enables button when form is valid', () => {
    const { getByTestId } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const signInButton = getByTestId('sign-in-button');

    fireEvent.changeText(emailInput, 'test@test.com');
    fireEvent.changeText(passwordInput, 'password123');

    expect(signInButton.props.accessibilityState.disabled).toBe(false);
  });

  it('displays error message from auth store', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: 'Invalid credentials',
      clearError: jest.fn(),
    });

    const { getByText } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  it('shows loading state during sign in', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: true,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const signInButton = getByTestId('sign-in-button');
    expect(signInButton.props.accessibilityState.busy).toBe(true);
  });

  it('navigates to sign up screen', () => {
    const { getByTestId } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const signUpLink = getByTestId('sign-up-link');
    fireEvent.press(signUpLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });

  it('navigates to forgot password screen', () => {
    const { getByTestId } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const forgotPasswordLink = getByTestId('forgot-password-link');
    fireEvent.press(forgotPasswordLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('clears error when navigating away', () => {
    const mockClearError = jest.fn();
    (useAuthStore as jest.Mock).mockReturnValue({
      signIn: jest.fn(),
      loading: false,
      error: 'Some error',
      clearError: mockClearError,
    });

    const { getByTestId } = render(
      <SignInScreen navigation={mockNavigation} />
    );

    const signUpLink = getByTestId('sign-up-link');
    fireEvent.press(signUpLink);

    expect(mockClearError).toHaveBeenCalled();
  });
});
