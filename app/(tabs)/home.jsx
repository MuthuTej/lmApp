"use client";

import React from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  TextInput,
  Image,
} from "react-native";
import { useState, useRef } from "react";
import { gql, useQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import DishModal from "../../components/DishModal";
import { Link } from "expo-router";

const screenWidth = Dimensions.get("window").width;
const cardGap = 20;
const cardWidth = (screenWidth - 40 - cardGap) / 2;

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const restaurants = data?.getRestaurents || [];
  const trending = []; // Replace with your trending dishes data

  const foodCategories = [
    { id: 1, name: "Pizza", image: require("../../assets/pizza.png") },
    { id: 2, name: "Burgers", image: require("../../assets/burger.png") },
    { id: 3, name: "Desserts", image: require("../../assets/dessert.png") },
    { id: 4, name: "Milkshake", image: require("../../assets/milkshake.png") },
    { id: 5, name: "Pasta", image: require("../../assets/pasta.png") },
  ];

  const promoOffers = [
    {
      id: 1,
      title: "50% OFF",
      subtitle: "First Order",
      badge: "NEW USER",
      color: "bg-orange-500",
    },
    {
      id: 2,
      title: "Free",
      subtitle: "Delivery",
      badge: "NO FEES",
      color: "bg-yellow-500",
    },
    {
      id: 3,
      title: "Buy 1",
      subtitle: "Get 1 Free",
      badge: "COMBO",
      color: "bg-orange-600",
    },
    {
      id: 4,
      title: "Express",
      subtitle: "15 Mins",
      badge: "FAST",
      color: "bg-yellow-600",
    },
  ];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (loading) return <Loader text="Preparing your meals :)" />;
  if (error) return <Text>Error loading restaurants: {error.message}</Text>;

  const handleSelectFood = (item) => {
    setSelectedDish(item);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* App Name & Header */}
      <View className="bg-orange-500 pt-16 pb-8 px-6 rounded-b-3xl shadow-lg mb-6 z-10">
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <Text className="text-white text-lg font-medium opacity-90">Hello 👋</Text>
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-extrabold text-white tracking-tight">Grab</Text>
              <Text className="text-4xl font-extrabold text-yellow-300 tracking-tight italic">IT</Text>
            </View>
            <Text className="text-orange-100 text-sm mt-1 font-medium">Find your favorite meals</Text>
          </View>
          <View className="bg-white/20 p-2 rounded-full">
            <Ionicons name="notifications-outline" size={24} color="white" />
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-2xl px-4 py-3 flex-row items-center shadow-sm">
          <Ionicons name="search" size={22} color="#F97316" />
          <TextInput
            placeholder="Search for restaurants, dishes..."
            className="flex-1 ml-3 text-gray-800 font-medium"
            placeholderTextColor="#9CA3AF"
          />
          <View className="border-l border-gray-200 pl-3 ml-2">
            <Ionicons name="options-outline" size={22} color="gray" />
          </View>
        </View>
      </View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Categories */}
        <View className="mb-8">
          <View className="px-6 mb-4 flex-row justify-between items-end">
            <Text className="text-lg font-bold text-gray-800">What are you craving?</Text>
            <Text className="text-orange-500 text-xs font-bold">See All</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {foodCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                className="items-center mr-5"
                activeOpacity={0.7}
              >
                <View className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2 w-[72px] h-[72px] justify-center items-center">
                  <Image
                    source={category.image}
                    className="w-12 h-12"
                    resizeMode="contain"
                  />
                </View>
                <Text className="text-gray-700 text-xs font-semibold text-center">
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Restaurants */}
        <View className="px-6 mb-24">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800">Popular Restaurants</Text>
            <Link href="/(tabs)/food" asChild>
              <TouchableOpacity>
                <Text className="text-orange-500 text-xs font-bold">View All</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <FlatList
            data={restaurants}
            renderItem={({ item }) => (
              <Link href={`/restaurants/${item.name}`} asChild>
                <TouchableOpacity className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                  <View className="relative">
                    <Image
                      source={{ uri: item.imageUrl }}
                      className="h-48 w-full"
                      resizeMode="cover"
                    />
                    <View className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg flex-row items-center shadow-sm">
                      <Text className="text-xs font-bold text-gray-900">20-30 min</Text>
                    </View>
                  </View>

                  <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-xl font-bold text-gray-900 flex-1 mr-2">
                        {item.displayName}
                      </Text>
                      <View className="bg-green-50 px-2 py-1 rounded-lg border border-green-100 flex-row items-center">
                        <Text className="text-green-700 text-xs font-bold mr-1">4.3</Text>
                        <Ionicons name="star" size={10} color="#15803d" />
                      </View>
                    </View>

                    <View className="flex-row items-center mb-3">
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-xs ml-1 mr-3">1.2 km</Text>
                      <View className="w-1 h-1 rounded-full bg-gray-300 mr-3" />
                      <Text className="text-orange-500 text-xs font-medium">Free Delivery</Text>
                    </View>

                    <View className="h-[1px] bg-gray-50 mb-3" />

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md">
                        <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
                        <Text className="text-gray-500 text-[10px] ml-1 font-medium">
                          BURGER • PIZZA • FAST FOOD
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            )}
            keyExtractor={(item) =>
              item.id || `${item.name}-${item.displayName}`
            }
            scrollEnabled={false}
          />
        </View>
      </Animated.View>

      {selectedDish && (
        <DishModal
          dish={selectedDish}
          visible={!!selectedDish}
          onClose={() => setSelectedDish(null)}
        />
      )}
    </ScrollView>
  );
};

export default Home;
