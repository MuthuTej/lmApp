import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DishCard from '../../components/DishCard';
import DishModal from '../../components/DishModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Loader from '../../components/Loader';
const screenWidth = Dimensions.get("window").width;
const horizontalPadding = 40; // px-5 on both sides = 20 + 20
const cardGap = 20; // gap between cards
const cardsPerRow = 2;

const totalGap = cardGap * (cardsPerRow - 1);
const cardWidth = (screenWidth - horizontalPadding - totalGap) / cardsPerRow;
import { gql, useQuery } from "@apollo/client";

const GET_MENU_BY_RESTAURANT_NAME = gql`
  query GetMenuByRestaurantName($name: String!) {
    getMenuByRestaurantName(name: $name) {
    name
    menu {
      name
      freq
      category
      description
      imageUrl
      isAvailable
      price
    }
    admin
    isOpen
    logo
    }
  }
`;

export default function RestaurantScreen() {
  const { restaurantId } = useLocalSearchParams();

  const [selectedDish, setSelectedDish] = useState(null);

     
  const { data, loading, error } = useQuery(GET_MENU_BY_RESTAURANT_NAME, {
      variables: { name: restaurantId, limit: 3 },
    });
  
    if (loading) return <Loader text="Loading menu..." />;
    
    if (error) return <Text>Error: {error.message}</Text>;
  
    const restaurant = data.getMenuByRestaurantName;
    const menu = restaurant.menu;
  
  if (loading) return <Loader text='Loading restaurant details...' />;

  return (
    // <SafeAreaView>
    <SafeAreaView className='bg-white h-full'>
      <View className="flex-1 p-4">
        {/* header */}
        {restaurant &&
          <View className="flex-row items-center justify-between mb-4 px-2">
            <TouchableOpacity onPress={() => router.back()} className='w-32'>
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>

            <Text className="text-xl font-semibold text-white bg-[#E95322] px-3 py-1 rounded text-center">
  {restaurant.name}
</Text>


            <View className="w-32"></View>
          </View>
        }

        {/* food details */}
        <FlatList
          ListHeaderComponent={restaurant && <RestaurantHeader restaurant={restaurant} />}
          data={menu}
          keyExtractor={item => `${item.id}-${item.name.replace(/\s+/g, '_')}`}
          numColumns={2}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          className="mb-4 mt-3"
          renderItem={({ item, index }) => (
            <DishCard
              item={item}
              index={index}
              variant="grid"
              cardWidth={screenWidth / 2.27}
              showRank={false}
              onPress={() => setSelectedDish(item)}

            />)}
          columnWrapperStyle={{
            justifyContent: "flex-start",
            gap: cardGap,
            marginBottom: 10,
          }}
        />
        <DishModal
          visible={!!selectedDish}
          dish={selectedDish}
          restaurant={restaurant}
          onClose={() => setSelectedDish(null)}
        />
      </View>
    </SafeAreaView>
  );
}

const RestaurantHeader = ({ restaurant }) => (
  <View>

    <Image
      source={{ uri: restaurant.logo }}
      className="w-full h-60 rounded-xl mb-5"
      resizeMode="contain"
    />
  </View>
)
