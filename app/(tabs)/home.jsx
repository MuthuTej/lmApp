import { View, Text, ScrollView, FlatList, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { gql, useQuery } from '@apollo/client';

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
    <Text className="text-2xl font-bold text-primary mb-2 mt-10">
      All Restaurants
    </Text>
  
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
    <Text className="text-2xl font-bold text-primary mt-8 mb-10">
      Trending Dishes
    </Text>
  </ScrollView>
  
  );
};

export default Home;
