import React from 'react';
import { View, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/sign-in');
  };

  return (
    <View className="flex-1 items-center justify-center">
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}
