import 'react-native-gesture-handler';
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { DancingScript_400Regular } from '@expo-google-fonts/dancing-script';
import { GreatVibes_400Regular } from '@expo-google-fonts/great-vibes';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { Allura_400Regular } from '@expo-google-fonts/allura';
import { Sacramento_400Regular } from '@expo-google-fonts/sacramento';
import AppNavigator from './src/navigation/AppNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';
import { COLORS } from './src/utils/constants';

export default function App() {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded] = useFonts({
    DancingScript: DancingScript_400Regular,
    GreatVibes: GreatVibes_400Regular,
    Pacifico: Pacifico_400Regular,
    Allura: Allura_400Regular,
    Sacramento: Sacramento_400Regular,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        // Lazy load and initialize monetization services
        // This prevents crashes if native modules have issues
        const { initializePurchases } = await import('./src/services/purchaseService');
        const { initializeAds } = await import('./src/services/adService');

        // Initialize in parallel but don't fail if one fails
        await Promise.allSettled([
          initializePurchases(),
          initializeAds(),
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsReady(true);
      }
    };
    initialize();
  }, []);

  const handleSplashComplete = useCallback(() => {
    setAnimationComplete(true);
  }, []);

  // Determine if we should show splash
  const showSplash = !animationComplete || !fontsLoaded || !isReady;

  // Show animated splash while loading
  if (showSplash) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <AnimatedSplash
          onAnimationComplete={handleSplashComplete}
        />
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
});
