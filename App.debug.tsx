import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Debug App Component - Minimal test to diagnose blank screen
 */
export default function App() {
  const [status, setStatus] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApp = async () => {
      try {
        setStatus('Testing AsyncStorage...');
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        setStatus('AsyncStorage imported');

        await AsyncStorage.default.setItem('test', 'hello');
        const value = await AsyncStorage.default.getItem('test');
        setStatus(`AsyncStorage works: ${value}`);

        setStatus('Testing Supabase...');
        const { supabase } = await import('./src/lib/supabase');
        setStatus('Supabase imported');

        const { data: session } = await supabase.auth.getSession();
        setStatus(`Session check complete: ${session ? 'Has session' : 'No session'}`);

        setStatus('All systems OK - loading main app...');
      } catch (err: any) {
        console.error('Debug error:', err);
        setError(err.message || String(err));
        setStatus('ERROR');
      }
    };

    testApp();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Mode</Text>
      <Text style={styles.status}>Status: {status}</Text>
      {error && <Text style={styles.error}>Error: {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  error: {
    fontSize: 14,
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
});
