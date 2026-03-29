import Constants from 'expo-constants';

const appEnv = Constants.expoConfig?.extra?.appEnv as string | undefined;

// Use test ads in dev builds, TestFlight/preview builds, or any non-production build
export const USE_TEST_ADS = __DEV__ || appEnv !== 'production';
