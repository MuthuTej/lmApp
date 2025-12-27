// app/_layout.jsx
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import client from '../apolloClient';
import { ApolloProvider } from '@apollo/client';
import "./globals.css"
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'Error: Unable to activate keep awake',
  'Unable to activate keep awake',
]);

export default function Layout() {
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
