import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Minimal test app to verify basic rendering works
 */
export default function App() {
  console.log('App rendering...');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ App is rendering!</Text>
      <Text style={styles.subtitle}>If you see this, React Native Web works</Text>
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
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
