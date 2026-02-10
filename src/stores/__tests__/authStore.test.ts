import { useAuthStore } from '../authStore';
import { supabase } from '@/lib/supabase';
import type { Session, User, AuthError } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

// Mock other stores
jest.mock('../activityStore', () => ({
  useActivityStore: {
    getState: () => ({
      reset: jest.fn(),
    }),
  },
}));

const mockUser: User = {
  id: 'user-123',
  email: 'test@test.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
};

const mockSession: Session = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  user: mockUser,
};

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      session: null,
      loading: false,
      error: null,
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await useAuthStore.getState().signUp('test@test.com', 'password123');

      expect(result).toBe(true);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
        options: {
          emailRedirectTo: undefined,
        },
      });
      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should handle sign up error', async () => {
      const mockError = {
        name: 'AuthError',
        message: 'Email already registered',
        status: 400,
        code: 'email_exists',
        __isAuthError: true,
      } as unknown as AuthError;

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await useAuthStore.getState().signUp('test@test.com', 'password123');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Email already registered');
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should handle missing user data', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await useAuthStore.getState().signUp('test@test.com', 'password123');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Failed to create account');
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with verified email', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await useAuthStore.getState().signIn('test@test.com', 'password123');

      expect(result).toBe(true);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should reject unverified email', async () => {
      const unverifiedUser = { ...mockUser, email_confirmed_at: null };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: unverifiedUser, session: mockSession },
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await useAuthStore.getState().signIn('test@test.com', 'password123');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Please check your email to verify your account');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign in error', async () => {
      const mockError = {
        name: 'AuthError',
        message: 'Invalid credentials',
        status: 400,
        code: 'invalid_credentials',
        __isAuthError: true,
      } as unknown as AuthError;

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const result = await useAuthStore.getState().signIn('test@test.com', 'wrong-password');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Invalid credentials');
    });

    it('should handle missing session', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      const result = await useAuthStore.getState().signIn('test@test.com', 'password123');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Failed to sign in');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      // Set initial state
      useAuthStore.setState({
        user: mockUser,
        session: mockSession,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await useAuthStore.getState().signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should handle sign out error', async () => {
      const mockError = new Error('Sign out failed');
      Object.assign(mockError, {
        name: 'AuthError',
        status: 500,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      try {
        await useAuthStore.getState().signOut();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBe(mockError);
      }

      expect(useAuthStore.getState().error).toBe('Sign out failed');
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should send reset email successfully', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      const result = await useAuthStore.getState().resetPassword('test@test.com');

      expect(result).toBe(true);
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@test.com',
        { redirectTo: undefined }
      );
      expect(useAuthStore.getState().loading).toBe(false);
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should handle reset password error', async () => {
      const mockError = {
        name: 'AuthError',
        message: 'Email not found',
        status: 400,
        code: 'email_not_found',
        __isAuthError: true,
      } as unknown as AuthError;

      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: mockError,
      });

      const result = await useAuthStore.getState().resetPassword('test@test.com');

      expect(result).toBe(false);
      expect(useAuthStore.getState().error).toBe('Email not found');
    });
  });

  describe('initializeAuth', () => {
    it('should initialize with existing session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().session).toEqual(mockSession);
      expect(useAuthStore.getState().loading).toBe(false);
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should initialize with no session', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      });

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });

    it('should handle initialization error', async () => {
      const mockError = {
        name: 'AuthError',
        message: 'Session error',
        status: 500,
        code: 'session_error',
        __isAuthError: true,
      } as unknown as AuthError;

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      await useAuthStore.getState().initializeAuth();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().loading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
