import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function RestaurantCard({ restaurant }) {
  const { displayName, imageUrl, name } = restaurant;

  return (
    <Link href={`/restaurants/${name}`} asChild>
      <TouchableOpacity className="w-44 mr-4 border-2 border-orange-500 rounded-xl overflow-hidden">
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-28"
          resizeMode="cover"
        />

        <View className="mt-2 items-center mb-2">
          <Text className="text-base font-semibold text-center" numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
