import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from './src/constants/colors';

// DIAGNOSTIC MODE - Shows what's happening during initialization

let AuthStore: any;
let FamilyStore: any;
let authStoreError: any = null;
let familyStoreError: any = null;

try {
  AuthStore = require('./src/stores/authStore').useAuthStore;
} catch (err) {
  authStoreError = err;
}

try {
  FamilyStore = require('./src/stores/familyStore').useFamilyStore;
} catch (err) {
  familyStoreError = err;
}

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

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

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

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: '#0D0D1A',
          borderTopColor: 'rgba(255, 255, 255, 0.10)',
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

export default function App() {
  const [initializing, setInitializing] = useState(true);

  // Show immediate error if stores failed to load
  if (authStoreError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>❌ Auth Store Error</Text>
        <Text style={styles.error}>{String(authStoreError)}</Text>
      </View>
    );
  }

  if (familyStoreError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>❌ Family Store Error</Text>
        <Text style={styles.error}>{String(familyStoreError)}</Text>
      </View>
    );
  }

  let user, initializeAuth, families, babies, fetchFamilies;

  try {
    const authStore = AuthStore();
    user = authStore.user;
    initializeAuth = authStore.initializeAuth;
  } catch (err: any) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>❌ Auth Store Hook Error</Text>
        <Text style={styles.error}>{err.message}</Text>
      </View>
    );
  }

  try {
    const familyStore = FamilyStore();
    families = familyStore.families;
    babies = familyStore.babies;
    fetchFamilies = familyStore.fetchFamilies;
  } catch (err: any) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>❌ Family Store Hook Error</Text>
        <Text style={styles.error}>{err.message}</Text>
      </View>
    );
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setInitializing(false);
    }, 10000);

    initializeAuth()
      .then(() => {
        clearTimeout(timeout);
        setInitializing(false);
      })
      .catch((err: any) => {
        clearTimeout(timeout);
        console.error('Auth init failed:', err.message);
        setInitializing(false);
      });
  }, []);

  useEffect(() => {
    if (user) {
      fetchFamilies?.().catch((err: any) => console.error('Fetch families failed:', err.message));
    }
  }, [user]);

  if (initializing) {
    return <LoadingScreen />;
  }

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
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  log: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 4,
  },
  status: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});
