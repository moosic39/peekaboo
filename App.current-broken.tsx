import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from './src/constants/colors';
import { useAuthStore } from './src/stores/authStore';
import { useFamilyStore } from './src/stores/familyStore';

// Main screens
import HomeScreen from './src/screens/HomeScreen';
import TimelineScreen from './src/screens/TimelineScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Auth screens
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Loading screen
import LoadingScreen from './src/screens/LoadingScreen';

// Onboarding screens
import OnboardingWelcomeScreen from './src/screens/OnboardingWelcomeScreen';
import OnboardingCreateFamilyScreen from './src/screens/OnboardingCreateFamilyScreen';
import OnboardingJoinFamilyScreen from './src/screens/OnboardingJoinFamilyScreen';
import OnboardingAddBabyScreen from './src/screens/OnboardingAddBabyScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();

interface TabIconProps {
  emoji: string;
  focused: boolean;
}

function TabIcon({ emoji, focused }: TabIconProps) {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

/**
 * Error Boundary Component
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>❌ Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message}</Text>
          <Text style={styles.errorStack}>{this.state.error?.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Auth Navigator - Unauthenticated user flow
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Onboarding Navigator - New user setup flow
 */
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <OnboardingStack.Screen name="OnboardingCreateFamily" component={OnboardingCreateFamilyScreen} />
      <OnboardingStack.Screen name="OnboardingJoinFamily" component={OnboardingJoinFamilyScreen} />
      <OnboardingStack.Screen name="OnboardingAddBaby" component={OnboardingAddBabyScreen} />
    </OnboardingStack.Navigator>
  );
}

/**
 * Main Navigator - Authenticated user flow
 */
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root App Component with Error Handling
 */
export default function App() {
  console.log('=== APP RENDERING ===');
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  let user, initializeAuth, families, babies, fetchFamilies;

  try {
    const authStore = useAuthStore();
    user = authStore.user;
    initializeAuth = authStore.initializeAuth;
    console.log('Auth store loaded successfully');
  } catch (err) {
    console.error('FATAL: Auth store failed to load:', err);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>❌ Auth Store Error</Text>
        <Text style={styles.errorText}>{String(err)}</Text>
      </View>
    );
  }

  try {
    const familyStore = useFamilyStore();
    families = familyStore.families;
    babies = familyStore.babies;
    fetchFamilies = familyStore.fetchFamilies;
    console.log('Family store loaded successfully');
  } catch (err) {
    console.error('FATAL: Family store failed to load:', err);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>❌ Family Store Error</Text>
        <Text style={styles.errorText}>{String(err)}</Text>
      </View>
    );
  }

  useEffect(() => {
    console.log('App: Starting initialization...');

    // Add a timeout to detect if we're stuck
    const timeout = setTimeout(() => {
      console.error('App: Initialization timeout after 10 seconds');
      setError('Initialization timed out. Please refresh.');
      setInitializing(false);
    }, 10000);

    // Initialize auth state on app startup
    initializeAuth()
      .then(() => {
        clearTimeout(timeout);
        console.log('App: Auth initialized successfully');
        setInitializing(false);
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('App: Auth initialization failed:', err);
        setError(err?.message || 'Failed to initialize');
        setInitializing(false);
      });
  }, [initializeAuth]);

  useEffect(() => {
    console.log('App: User state changed:', { hasUser: !!user, userId: user?.id });
    // Fetch families when user is authenticated
    if (user) {
      console.log('App: Fetching families...');
      fetchFamilies().catch((err) => {
        console.error('App: Failed to fetch families:', err);
      });
    }
  }, [user, fetchFamilies]);

  console.log('App: Rendering with state:', {
    initializing,
    hasUser: !!user,
    familiesCount: families.length,
    babiesCount: babies.length,
    error,
  });

  // Show error if initialization failed
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Show loading screen while checking auth state
  if (initializing) {
    console.log('App: Showing loading screen');
    return <LoadingScreen />;
  }

  // Determine which navigator to show
  const needsOnboarding = user && (families.length === 0 || babies.length === 0);
  console.log('App: Navigation decision:', { hasUser: !!user, needsOnboarding });

  return (
    <ErrorBoundary>
      <NavigationContainer>
        {!user ? (
          <AuthNavigator />
        ) : needsOnboarding ? (
          <OnboardingNavigator />
        ) : (
          <MainNavigator />
        )}
        <StatusBar style="auto" />
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#dc3545',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorStack: {
    fontSize: 12,
    color: '#999',
    textAlign: 'left',
    fontFamily: 'monospace',
  },
});
