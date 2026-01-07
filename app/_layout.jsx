// app/_layout.jsx

import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import client from '../apolloClient';
import { ApolloProvider, useMutation, gql } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSegments, useRouter } from 'expo-router';
import "./globals.css";
import { LogBox, Platform } from 'react-native';

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/* -------------------- IGNORE WARNINGS -------------------- */

import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black
} from '@expo-google-fonts/outfit';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'Error: Unable to activate keep awake',
  'Unable to activate keep awake',
]);

/* -------------------- NOTIFICATION HANDLER -------------------- */

Notifications.setNotificationHandler({
  handleNotification: async () => {
    console.log('🟢 Notification handler triggered');
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

/* -------------------- GRAPHQL MUTATIONS -------------------- */

const SAVE_PUSH_TOKEN = gql`
  mutation SavePushToken($userId: String!, $token: String!) {
    savePushToken(userId: $userId, token: $token)
  }
`;

/* -------------------- REGISTER PUSH TOKEN -------------------- */

async function registerForPushNotificationsAsync() {
  console.log('🚀 Starting push notification registration');

  if (Platform.OS === 'android') {
    console.log('🤖 Setting Android notification channel');
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  if (!Device.isDevice) {
    console.log('❌ Not a physical device');
    return;
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  console.log('🔐 Existing permission status:', existingStatus);

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('🟡 Requesting notification permission');
    const { status } =
      await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('❌ Notification permission denied');
    return;
  }

  console.log('✅ Notification permission granted');

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.log('❌ Project ID not found');
    return;
  }

  console.log('🆔 Expo Project ID:', projectId);

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  console.log('📱 Expo Push Token:', token);

  // 👉 You can send this token to backend here
  return token;
}

/* -------------------- ROOT LAYOUT -------------------- */

function RootLayoutNav() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const lastSyncedUserId = useRef(null);
  const lastSyncedToken = useRef(null);

  const [savePushToken] = useMutation(SAVE_PUSH_TOKEN);

  const syncPushToken = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      const userId = await AsyncStorage.getItem('userId');

      if (token && userId) {
        // Only sync if userId or token has changed
        if (lastSyncedUserId.current === userId && lastSyncedToken.current === token) {
          console.log('ℹ️ Push token already synced for this user and token');
          return;
        }

        console.log(`🔄 Syncing push token for user: ${userId}`);
        await savePushToken({
          variables: {
            userId: userId,
            token: token,
          },
        });

        // Update refs after successful sync
        lastSyncedUserId.current = userId;
        lastSyncedToken.current = token;

        console.log('✅ Push token synced successfully');
      } else {
        console.log('⚠️ Skipping token sync: ', { hasToken: !!token, hasUserId: !!userId });
      }
    } catch (error) {
      console.error('❌ Error syncing push token:', error);
    }
  };

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');

        // Debugging logs to verify behavior
        console.log('Auth Check - Segments:', segments);
        console.log('Auth Check - User ID:', userId);

        // Check if we are inside the (auth) group
        const inAuthGroup = segments.includes('(auth)');

        // Define public routes
        const publicRoutes = ['index', 'forgot-password', 'reset-password'];
        const firstSegment = segments[0] || 'index';
        const isPublic = publicRoutes.includes(firstSegment);

        // If user is NOT signed in, not in auth group, and not on a public page
        if (!userId && !inAuthGroup && !isPublic) {
          console.log('⛔ Redirecting unauthenticated user to Sign In');
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };

    checkAuth();

    // Sync push token whenever segments change (e.g., navigating to /home after login)
    syncPushToken();
  }, [segments]);

  useEffect(() => {
    console.log('📦 App mounted (_layout.jsx)');

    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log('🔔 Notification received:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('👉 Notification tapped:', response);
      });

    return () => {
      console.log('🧹 Cleaning up notification listeners');
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Toast />
    </>
  );
}

export default function Layout() {
  useEffect(() => {
    console.log('📦 Root Layout loaded');
  }, []);

  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ApolloProvider client={client}>
      <RootLayoutNav />
    </ApolloProvider>
  );
}
