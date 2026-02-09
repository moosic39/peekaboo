import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
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
 * Auth Navigator - Unauthenticated user flow
 * Screens: SignIn, SignUp, ForgotPassword
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Onboarding Navigator - New user setup flow
 * Screens: Welcome, CreateFamily, JoinFamily, AddBaby
 */
function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <OnboardingStack.Screen
        name="OnboardingWelcome"
        component={OnboardingWelcomeScreen}
      />
      <OnboardingStack.Screen
        name="OnboardingCreateFamily"
        component={OnboardingCreateFamilyScreen}
      />
      <OnboardingStack.Screen
        name="OnboardingJoinFamily"
        component={OnboardingJoinFamilyScreen}
      />
      <OnboardingStack.Screen
        name="OnboardingAddBaby"
        component={OnboardingAddBabyScreen}
      />
    </OnboardingStack.Navigator>
  );
}

/**
 * Main Navigator - Authenticated user flow
 * Bottom tabs: Home, Timeline, Stats, Settings (Week 3)
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
      {/* TODO: Week 3 - Add Settings tab */}
    </Tab.Navigator>
  );
}

/**
 * Root App Component
 *
 * Auth-aware navigation logic:
 * 1. Show loading screen while initializing auth
 * 2. If not authenticated → AuthNavigator
 * 3. If authenticated but needs onboarding → OnboardingNavigator
 * 4. If authenticated and onboarded → MainNavigator
 *
 * Onboarding check:
 * - needsOnboarding = user && (families.length === 0 || babies.length === 0)
 * - Automatically fetches families when user is authenticated
 */
export default function App() {
  const [initializing, setInitializing] = useState(true);
  const { user, initializeAuth } = useAuthStore();
  const { families, babies, fetchFamilies } = useFamilyStore();

  useEffect(() => {
    // Initialize auth state on app startup
    initializeAuth().finally(() => {
      setInitializing(false);
    });
  }, [initializeAuth]);

  useEffect(() => {
    // Fetch families when user is authenticated
    if (user) {
      fetchFamilies();
    }
  }, [user, fetchFamilies]);

  // Show loading screen while checking auth state
  if (initializing) {
    return <LoadingScreen />;
  }

  // Determine which navigator to show
  // User needs onboarding if they have no families or no babies
  const needsOnboarding = user && (families.length === 0 || babies.length === 0);

  return (
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
  );
}
