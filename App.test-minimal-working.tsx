import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Minimal test - just shows text, no stores, no navigation
 * If this shows up, the issue is with stores or navigation
 * If this is also blank, the issue is with React Native setup
 */
export default function App() {
  console.log('=== MINIMAL APP RENDERING ===');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ App is working!</Text>
      <Text style={styles.subtext}>If you see this, React Native is rendering correctly</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});
