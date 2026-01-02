"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    Animated,
    Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { gql, useQuery, useApolloClient } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import Loader from "../components/Loader";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const GET_RESTAURANTS = gql`
  query {
    getRestaurents {
      displayName
      imageUrl
      name
    }
  }
`;

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

const SearchResults = () => {
    const { q } = useLocalSearchParams();
    const router = useRouter();
    const client = useApolloClient();
    const { loading: restaurantsLoading, data: restaurantsData } = useQuery(GET_RESTAURANTS);

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        if (restaurantsData?.getRestaurents && q) {
            const filterResults = async () => {
                setLoading(true);
                const searchResults = [];

                try {
                    const restaurantList = restaurantsData.getRestaurents;

                    for (const res of restaurantList) {
                        const { data: menuData } = await client.query({
                            query: GET_MENU_BY_RESTAURANT_NAME,
                            variables: { name: res.name },
                            fetchPolicy: 'cache-first'
                        });

                        if (menuData?.getMenuByRestaurantName?.menu) {
                            const matchedItems = menuData.getMenuByRestaurantName.menu.filter(item =>
                                item.name.toLowerCase().includes(q.toLowerCase()) ||
                                item.category.toLowerCase().includes(q.toLowerCase())
                            );

                            matchedItems.forEach(item => {
                                searchResults.push({
                                    ...item,
                                    restaurantName: res.name,
                                    restaurantDisplayName: res.displayName,
                                    restaurantLogo: menuData.getMenuByRestaurantName.logo,
                                    isOpen: menuData.getMenuByRestaurantName.isOpen
                                });
                            });
                        }
                    }

                    searchResults.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                    setResults(searchResults);

                    Animated.parallel([
                        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
                    ]).start();

                } catch (error) {
                    console.error("Error filtering search results:", error);
                } finally {
                    setLoading(false);
                }
            };

            filterResults();
        }
    }, [restaurantsData, q]);

    if (loading || restaurantsLoading) {
        return <Loader text="Comparing prices for you..." />;
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Modern Gradient Header */}
            <View className="bg-orange-500 pt-16 pb-10 px-6 rounded-b-[50px] shadow-2xl z-20">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 p-2.5 rounded-full border border-white/30 mr-5"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-orange-100 text-sm font-outfit-medium uppercase tracking-widest mb-1">Results for</Text>
                        <Text className="text-white text-3xl font-outfit-extrabold tracking-tight" numberOfLines={1}>
                            "{q}"
                        </Text>
                    </View>
                </View>
            </View>

            <Animated.View
                className="flex-1 px-5 pt-8"
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                <View className="flex-row items-center justify-between mb-6 px-1">
                    <View>
                        <Text className="text-xl font-outfit-bold text-gray-900">
                            {results.length} Matches Found
                        </Text>
                    </View>
                    <View className="bg-white px-3 py-1.5 rounded-full border border-gray-200 flex-row items-center shadow-sm">
                        <Ionicons name="swap-vertical" size={12} color="#f97316" className="mr-1" />
                        <Text className="text-gray-600 font-outfit-bold text-xs">Price: Low to High</Text>
                    </View>
                </View>

                {results.length === 0 ? (
                    <View className="flex-1 justify-center items-center pb-20">
                        <View className="bg-gray-100 p-8 rounded-full mb-6">
                            <Ionicons name="search" size={60} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-900 font-outfit-bold text-xl text-center">No Results Found</Text>
                        <Text className="text-gray-500 font-outfit-medium text-center mt-2 px-10 leading-6">
                            We couldn't find any dishes matching "{q}". Try searching for something else!
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mt-8 bg-black px-8 py-4 rounded-2xl shadow-lg shadow-gray-400"
                        >
                            <Text className="text-white font-outfit-bold text-base">Search Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => `${item.restaurantName}-${item.name}-${index}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: `/restaurants/${item.restaurantName}`,
                                    params: { dishName: item.name }
                                })}
                                activeOpacity={0.8}
                                className="bg-white rounded-[28px] p-3.5 mb-5 shadow-sm border-2 border-yellow-400 flex-row items-center"
                            >
                                {/* Food Image */}
                                <View className="relative">
                                    <Image
                                        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" }}
                                        className="w-24 h-24 rounded-[20px] bg-gray-100"
                                        resizeMode="cover"
                                    />
                                    {/* Cleaner Badge */}
                                    <View className="absolute top-0 left-0 bg-white/90 px-2 py-0.5 rounded-br-xl rounded-tl-[20px] border-b border-r border-gray-100">
                                        <Text className="text-[10px] font-outfit-bold text-gray-900">#{index + 1}</Text>
                                    </View>
                                </View>

                                {/* Details */}
                                <View className="flex-1 ml-4 py-1 justify-between h-24">
                                    <View>
                                        <Text className="text-lg font-outfit-extrabold text-gray-900 leading-tight" numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <Text className="text-gray-400 font-outfit-medium text-xs truncate">
                                                by {item.restaurantDisplayName}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-end">
                                        <View className="flex-row items-baseline">
                                            <Text className="text-xl font-outfit-black text-orange-500">₹{item.price}</Text>
                                        </View>

                                        <View className={`flex-row items-center px-2 py-1 rounded-lg ${item.isOpen ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <Text className={`text-[10px] font-outfit-bold ${item.isOpen ? 'text-green-700' : 'text-red-700'}`}>
                                                {item.isOpen ? 'OPEN' : 'CLOSED'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </Animated.View>
        </View>
    );
};

export default SearchResults;
