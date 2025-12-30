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
import { LinearGradient } from "expo-linear-gradient";
import { Animated } from "react-native";
import { useRef, useEffect } from "react";
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right', 'bottom']}>
      <Animated.FlatList
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
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
    </SafeAreaView>
  );
}

const RestaurantHeader = ({ restaurant, searchQuery, setSearchQuery }) => (
  <View className="mb-6 shadow-xl bg-orange-500 rounded-b-[40px]">
    <LinearGradient
      colors={['#F97316', '#EA580C']} // Orange-500 to Orange-600
      className="pt-14 pb-8 px-6 rounded-b-[40px]"
    >
      {/* Top Row: Back & Name */}
      <View className="flex-row justify-between items-center mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-white/20 p-2 rounded-full border border-white/30"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-4">
          <Text
            className="text-4xl font-outfit-black text-yellow-300 text-center tracking-tighter uppercase"
            numberOfLines={1}
            style={{
              textShadowColor: 'rgba(0, 0, 0, 0.4)',
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4
            }}
          >
            {restaurant.name}
          </Text>
          <View className="flex-row items-center mt-1 bg-orange-600/50 px-3 py-0.5 rounded-full">
            <View className={`w-2 h-2 rounded-full mr-1.5 ${restaurant.isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
            <Text className="text-white text-[10px] font-outfit-bold tracking-wide">
              {restaurant.isOpen ? "OPEN NOW" : "CLOSED"}
            </Text>
          </View>
        </View>

        <View className="w-10" />
      </View>

      {/* Search Bar */}
      <View className="bg-white rounded-2xl px-4 py-3.5 flex-row items-center shadow-lg shadow-orange-900/20 border-2 border-orange-100">
        <Ionicons name="search" size={22} color="#F97316" />
        <TextInput
          placeholder="Search for dishes..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 ml-3 text-gray-800 font-outfit-medium text-base"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  </View>
);
