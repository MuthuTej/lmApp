import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // User already logged in → go to main tabs
        router.replace('/home');
      } else {
        // No token → Show Landing Page
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      {/* Background Image */}
      <ImageBackground
        source={require('../assets/logbg1.jpg')} // Using an existing asset as placeholder
        className="flex-1 justify-end"
        resizeMode="cover"
      >
        <View className="absolute inset-0 bg-black/40" />

        {/* Content Container with rounded top */}
        <View className="bg-white/90 rounded-t-3xl pt-8 pb-10 px-6 backdrop-blur-sm">


          {/* Logo / Icon Placeholder */}
          <View className="items-center mb-4">
            <View className="w-24 h-24 rounded-full overflow-hidden shadow-lg mb-2 bg-[#f66c3a]">
              <Image
                source={require('../assets/minilogo.png')} // or { uri: 'https://...' }
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          </View>



          <Text className="text-4xl font-black text-center text-neutral-900 mb-1 tracking-tight">
            GrabIt
          </Text>

          <Text className="text-lg text-center text-neutral-500 mb-8 font-light tracking-wide italic">
            Taste, share, and inspire
          </Text>


          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-up')}
            className="bg-[#f66c3a] rounded-full py-4 mb-4 shadow-xl items-center justify-center"
          >
            <Text className="text-white font-bold text-lg tracking-wide">
              Create account
            </Text>
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() => router.push('/(auth)/sign-in')}
            className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-full py-4 items-center justify-center shadow-lg border-2 border-[#f66c3a]"
          >
            <Text className="text-white font-bold text-lg tracking-wide">
              Log In
            </Text>
          </TouchableOpacity>





        </View>

      </ImageBackground >
    </View >
  );
}
