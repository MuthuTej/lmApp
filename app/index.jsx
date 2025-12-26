import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useRootNavigationState } from 'expo-router';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // ⛔ Wait until root layout is mounted
    if (!rootNavigationState?.key) return;

    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');

      if (token) {
       router.replace("/(tabs)/home");

      } else {
        router.replace("/(auth)/sign-in");

      }

      setLoading(false);
    };

    checkAuth();
  }, [rootNavigationState]);

  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <ActivityIndicator size="large" />
    </View>
  );
}
