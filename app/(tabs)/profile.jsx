import React from 'react';
import { View, Text, Image, ImageBackground, TouchableOpacity, ScrollView , Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { gql, useQuery, useMutation } from "@apollo/client";

const ME = gql`
  query{
    me{
      id
      email
      name
    }
  }`;
export default function Profile() {
  const router = useRouter();
  const { data: meData, loading: meLoading } = useQuery(ME);
  const userId = meData?.me?.id || null;
  const userName = meData?.me?.name || null;

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    router.replace('/sign-in');
  };
  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header with Background Image */}
      <ImageBackground
        source={require("../../assets/college-bg.jpeg")}
        className="h-44 justify-end"
        resizeMode="cover"
      >
        <View className="bg-black/50 p-4">
          <Text className="text-white text-xl font-bold">Student Profile</Text>
        </View>
      </ImageBackground>

      {/* Profile Info Section */}
      <View className="m-4 p-4 bg-white rounded-2xl shadow-md border border-gray-200 items-center">

        {/* Profile Image First */}
        <Image
          source={require("../../assets/profile.jpeg")}
          style={{
            width: 128,     // same as w-32
            height: 128,    // same as h-32
            borderRadius: 64, // half of width/height to make it perfectly round
            borderWidth: 4,
            borderColor: "#fff",
            backgroundColor: "#e5e7eb", // light gray background so empty space looks clean
          }}
          resizeMode="contain"
        />


        {/* Student Details */}
        <Text className="text-lg font-bold text-gray-800 mt-4">{userName}</Text>
        <Text className="text-sm text-gray-500 mt-1">Register No: 24CS0777</Text>
        <Text className="text-sm text-gray-600 mt-2">
          Batch: <Text className="font-semibold text-gray-800">2021 - 2025</Text>
        </Text>
        <Text className="text-sm text-gray-600 mt-1">
          Department: <Text className="font-semibold text-gray-800">Computer Science & Engineering</Text>
        </Text>

        {/* Edit Button */}
        <TouchableOpacity className="mt-6 bg-orange-500 py-3 px-8 rounded-xl items-center">
          <Text className="text-white font-bold">Edit Profile</Text>

        </TouchableOpacity>
        <Button title="Logout" onPress={handleLogout} />

      </View>
    </ScrollView>
  );
}
