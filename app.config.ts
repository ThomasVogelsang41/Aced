import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ACED',
  slug: 'aced',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'aced',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.aced.discgolf',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'ACED uses your location to find nearby courses and measure distances to the basket.',
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'ACED uses your location to track distances during a round.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#09090A',
    },
    package: 'com.aced.discgolf',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
    ],
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'ACED uses your location to find nearby courses and measure distances to the basket.',
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#09090A',
        image: './assets/splash.png',
        resizeMode: 'contain',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    tryDiscsApiKey: process.env.EXPO_PUBLIC_TRYDISCS_API_KEY,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
