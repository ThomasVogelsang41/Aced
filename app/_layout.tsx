import React, { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Location from 'expo-location';
import { useAuthStore } from '../store/authStore';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { DiscSpinner } from '../components/ui/DiscSpinner';
import { getNearbyCourses } from '../lib/discgolfapi';

// Keep splash screen until fonts + auth + GPS course preloading are ready
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 15 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { isLoading: isAuthLoading, session, initialize } = useAuthStore();

  // Initialize Auth
  useEffect(() => {
    const cleanup = initialize();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  // Pre-load user GPS location & nearest courses in non-blocking background task
  useEffect(() => {
    async function preloadCourses() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const lat = loc.coords.latitude;
          const lng = loc.coords.longitude;

          // Non-blocking pre-fetch into cache
          queryClient.prefetchQuery({
            queryKey: ['nearestCourses', lat.toFixed(3), lng.toFixed(3)],
            queryFn: () => getNearbyCourses(lat, lng, 100),
          });
        }
      } catch (err) {
        console.warn('GPS course pre-load warning:', err);
      }
    }

    preloadCourses();
  }, []);

  const isReady = (fontsLoaded || fontError) && !isAuthLoading;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  // Redirect based on auth state
  useEffect(() => {
    if (!isReady) return;
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  }, [session, isReady]);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <View style={styles.footerCircleLogoBadge}>
          <Ionicons name="disc" size={38} color={Colors.white} />
        </View>
        <DiscSpinner label="Finding courses near you..." size={32} color={Colors.primaryBlack} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="round/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="round/scorecard"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="course/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'modal',
            gestureEnabled: true,
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCircleLogoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primaryBlack,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.primaryBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
