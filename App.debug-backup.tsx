import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, ScrollView } from 'react-native';
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

export default function App() {
  const [logs, setLogs] = useState<string[]>(['App starting...']);
  const [initializing, setInitializing] = useState(true);
  const [showDebug, setShowDebug] = useState(true);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  let user, initializeAuth, families, babies, fetchFamilies;
  let authStoreError = null;
  let familyStoreError = null;

  // Try to load auth store
  try {
    const authStore = useAuthStore();
    user = authStore.user;
    initializeAuth = authStore.initializeAuth;
    addLog('✅ Auth store loaded');
  } catch (err: any) {
    authStoreError = err;
    addLog('❌ Auth store failed: ' + err.message);
  }

  // Try to load family store
  try {
    const familyStore = useFamilyStore();
    families = familyStore.families;
    babies = familyStore.babies;
    fetchFamilies = familyStore.fetchFamilies;
    addLog('✅ Family store loaded');
  } catch (err: any) {
    familyStoreError = err;
    addLog('❌ Family store failed: ' + err.message);
  }

  useEffect(() => {
    if (authStoreError || familyStoreError) return;

    addLog('Starting auth initialization...');
    const timeout = setTimeout(() => {
      addLog('⚠️ Timeout after 10s');
      setInitializing(false);
    }, 10000);

    initializeAuth()
      .then(() => {
        clearTimeout(timeout);
        addLog('✅ Auth initialized');
        setInitializing(false);
        setTimeout(() => setShowDebug(false), 2000);
      })
      .catch((err: any) => {
        clearTimeout(timeout);
        addLog('❌ Auth init failed: ' + err.message);
        setInitializing(false);
      });
  }, []);

  useEffect(() => {
    if (user) {
      addLog('User authenticated, fetching families...');
      fetchFamilies?.().catch((err: any) => {
        addLog('❌ Fetch families failed: ' + err.message);
      });
    }
  }, [user]);

  if (showDebug || authStoreError || familyStoreError) {
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>🐛 Debug Mode</Text>
        <ScrollView style={styles.logContainer}>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logText}>{log}</Text>
          ))}
        </ScrollView>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Initializing: {initializing ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.statusText}>
            User: {user ? user.email : 'None'}
          </Text>
          <Text style={styles.statusText}>
            Families: {families?.length ?? 0}
          </Text>
          <Text style={styles.statusText}>
            Babies: {babies?.length ?? 0}
          </Text>
        </View>
      </View>
    );
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
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  debugTitle: {
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
  logText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  statusContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
});
