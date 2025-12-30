// app/_layout.jsx

import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import client from '../apolloClient';
import { ApolloProvider } from '@apollo/client';
import "./globals.css";
import { LogBox, Platform } from 'react-native';

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/* -------------------- IGNORE WARNINGS -------------------- */

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

export default function Layout() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    console.log('📦 App mounted (_layout.jsx)');

    registerForPushNotificationsAsync();

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
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(
        responseListener.current
      );
    };
  }, []);

  return (
    <ApolloProvider client={client}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <Toast />
    </ApolloProvider>
  );
}
