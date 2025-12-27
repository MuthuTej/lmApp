import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DishCard from "../../components/DishCard";
import DishModal from "../../components/DishModal";
import { SafeAreaView } from "react-native-safe-area-context";
import Loader from "../../components/Loader";
import { gql, useQuery } from "@apollo/client";

const screenWidth = Dimensions.get("window").width;
const cardGap = 20;

const GET_MENU_BY_RESTAURANT_NAME = gql`
  query GetMenuByRestaurantName($name: String!) {
    getMenuByRestaurantName(name: $name) {
      name
      menu {
        name
        category
        description
        imageUrl
        isAvailable
        price
      }
      isOpen
      logo
    }
  }
`;

export default function RestaurantScreen() {
  const { restaurantId } = useLocalSearchParams();
  const [selectedDish, setSelectedDish] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, loading, error } = useQuery(GET_MENU_BY_RESTAURANT_NAME, {
    variables: { name: restaurantId },
  });

  if (loading) return <Loader text="Loading menu..." />;
  if (error) return <Text>Error: {error.message}</Text>;

  const restaurant = data.getMenuByRestaurantName;
  const menu = restaurant.menu.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        ListHeaderComponent={
          <RestaurantHeader
            restaurant={restaurant}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        }
        data={menu}
        keyExtractor={(item, index) => `${index}-${item.name}`}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <DishCard
            item={item}
            index={index}
            variant="grid"
            cardWidth={screenWidth / 2.22}
            showRank={false}
            onPress={() => setSelectedDish(item)}
          />
        )}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
        contentContainerStyle={{
          paddingBottom: 20,
          gap: 16,
        }}
      />

      <DishModal
        visible={!!selectedDish}
        dish={selectedDish}
        restaurant={restaurant}
        onClose={() => setSelectedDish(null)}
      />
    </View>
  );
}

const RestaurantHeader = ({ restaurant, searchQuery, setSearchQuery }) => (
  <View className="bg-orange-500 pt-14 pb-8 px-6 rounded-b-[32px] shadow-lg mb-6">
    {/* Top Row: Back & Name */}
    <View className="flex-row justify-between items-center mb-6">
      <TouchableOpacity
        onPress={() => router.back()}
        className="bg-white/20 p-2 rounded-full"
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <View className="items-center flex-1 mx-4">
        <Text className="text-2xl font-bold text-white text-center tracking-tight" numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View className="flex-row items-center mt-1 bg-orange-600/50 px-3 py-0.5 rounded-full">
          <View className={`w-2 h-2 rounded-full mr-1.5 ${restaurant.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
          <Text className="text-white text-[10px] font-bold tracking-wide">
            {restaurant.isOpen ? "OPEN NOW" : "CLOSED"}
          </Text>
        </View>
      </View>

      <View className="w-10" />
    </View>

    {/* Search Bar */}
    <View className="bg-white rounded-2xl px-4 py-3 flex-row items-center shadow-sm">
      <Ionicons name="search" size={20} color="#F97316" />
      <TextInput
        placeholder="Search for dishes..."
        placeholderTextColor="#9CA3AF"
        value={searchQuery}
        onChangeText={setSearchQuery}
        className="flex-1 ml-3 text-gray-800 font-medium"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery("")}>
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  </View>
);
