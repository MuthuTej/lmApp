import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

export default function RestaurantCard({ restaurant, index }) {
  const { displayName,
    imageUrl,
    name } = restaurant;

  return (
    <Link href={`/restaurants/${name}`} asChild>
      <TouchableOpacity className="w-44 mr-4">
        <Image
          source={{ uri: imageUrl }}
          className="w-44 h-28 rounded-xl"
          resizeMode="contain"
        />

        <View className="mt-2">
          <Text className="text-base font-semibold" numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}
