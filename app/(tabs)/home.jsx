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
  if (error) return <Text>Error loading restaurants</Text>;

  const handleSelectFood = (item) => {
    setSelectedDish(item);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* App Name */}
      <View className="bg-orange-500 px-4 pt-12 pb-6 rounded-b-[40px] shadow-lg mb-6">
        <View className="items-center mb-4">
          <Text
            style={{
              fontSize: 42,
              fontWeight: "bold",
              fontStyle: "italic",
              textShadowColor: "rgba(0,0,0,0.3)",
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 4,
            }}
          >
            <Text style={{ color: "white" }}>Grab</Text>
            <Text style={{ color: "#FCD34D" }}>IT</Text>
          </Text>
        </View>

        {/* Greeting / Tagline */}
        <View className="flex-1 items-center justify-center mb-4">
          <View className="bg-black rounded-2xl px-6 py-3">
            <Text className="text-yellow-300 text-lg text-center">
              Hello! Find your favorite meals
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            placeholder="Search for restaurants, dishes..."
            className="flex-1 ml-3 text-gray-700"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View className="px-4 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            What are you craving?
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {foodCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  className="items-center mr-6"
                >
                  <Image
                    source={category.image}
                    className="w-20 h-20 mb-2"
                    resizeMode="contain"
                  />
                  <Text className="text-gray-700 text-sm font-medium">
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="px-4 mb-6">
          <Text className="text-xl font-bold text-gray-800 mb-4">
            Popular Restaurants
          </Text>
          <FlatList
            data={restaurants}
            renderItem={({ item }) => (
              <Link href={`/restaurants/${item.name}`} asChild>
                <TouchableOpacity className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
                  <View className="h-40 bg-gray-200 relative" />
                  <View className="p-4">
                    <Text className="text-xl font-bold text-gray-800 mb-1">
                      {item.displayName}
                    </Text>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="star" size={16} color="orange" />
                      <Text className="text-gray-600 ml-1">
                        4.3 • Fast delivery
                      </Text>
                    </View>
                    <Text className="text-gray-500">
                      Delicious food • Great prices
                    </Text>
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
