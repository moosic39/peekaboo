import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function App() {
  console.log('=== MINIMAL APP RENDERING ===');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ React is working!</Text>
      <Text style={styles.text}>If you see this, the issue is in the main App.tsx</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
});
