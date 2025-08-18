import { View, Text, ScrollView, FlatList, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';

import HorizontalList from '../../components/HorizontalList';
import RestaurantCard from '../../components/RestaurantCard';
import DishCard from '../../components/DishCard';
import Loader from '../../components/Loader';
import DishModal from '../../components/DishModal';

const screenWidth = Dimensions.get("window").width;
const cardGap = 20;
const cardWidth = (screenWidth - 40 - cardGap) / 2;

// --- GraphQL Query ---
const GET_RESTAURANTS = gql`
  query {
    getRestaurents {
      displayName
      imageUrl
      name
    }
  }
`;

const Home = () => {
  const { loading, data, error } = useQuery(GET_RESTAURANTS);
  const [selectedDish, setSelectedDish] = useState(null);

  const restaurants = data?.getRestaurents || [];
  const trending = []; // Replace with your trending dishes data

  if (loading) return <Loader text='Preparing your meals :)' />;
  if (error) return <Text>Error loading restaurants</Text>;

  const handleSelectFood = (item) => {
    setSelectedDish(item);
  };

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-8 h-screen-safe-or-80">
    {/* All Restaurants */}
<View className="flex-row items-center mb-4 mt-10 bg-[#FFF3E0] px-4 py-2 rounded-xl">
  <Ionicons name="storefront" size={28} color="#FFD700" style={{ marginRight: 8 }} />
  <Text className="text-2xl text-[#E95322] font-bold">
    All Restaurants
  </Text>
</View>


    <FlatList
      data={restaurants}
      renderItem={({ item }) => (
        <RestaurantCard restaurant={item} />
      )}
      keyExtractor={(item) => item.id || `${item.name}-${item.displayName}`}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12 }} // spacing between items
    />
  
    {/* Trending Dishes */}
   <View className="flex-row items-center mb-6 mt-8 bg-[#FFF3E0] px-4 py-2 rounded-xl">
  <Ionicons name="restaurant-outline" size={28} color="#FFD700" style={{ marginRight: 8 }} />
  <Text className="text-2xl text-[#E95322] font-bold" style={{ fontFamily: 'PoppinsBold' }}>
    Trending Dishes
  </Text>
</View>

  </ScrollView>
  
  );
};

export default Home;
