import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { Allura_400Regular } from '@expo-google-fonts/allura';
import { Sacramento_400Regular } from '@expo-google-fonts/sacramento';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/constants';
import { initializePurchases } from './src/services/purchaseService';
import { initializeAds } from './src/services/adService';

export default function App() {
  const [fontsLoaded] = useFonts({
    DancingScript: DancingScript_400Regular,
    GreatVibes: GreatVibes_400Regular,
    Pacifico: Pacifico_400Regular,
    Allura: Allura_400Regular,
    Sacramento: Sacramento_400Regular,
  });

  useEffect(() => {
    // Initialize monetization services
    const initializeMonetization = async () => {
      await Promise.all([
        initializePurchases(),
        initializeAds(),
      ]);
    };
    initializeMonetization();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.text,
    fontSize: 16,
  },
});
