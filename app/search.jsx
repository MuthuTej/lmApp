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
            <View className="bg-orange-500 pt-14 pb-8 px-6 rounded-b-[40px] shadow-xl z-20">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 p-2 rounded-full border border-white/30 mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white text-sm font-outfit-medium opacity-80 uppercase tracking-widest">Searching for</Text>
                        <Text className="text-white text-3xl font-outfit-extrabold tracking-tight" numberOfLines={1}>
                            {q}
                        </Text>
                    </View>
                </View>
            </View>

            <Animated.View
                className="flex-1 px-6 pt-6"
                style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
            >
                <View className="flex-row items-center justify-between mb-6">
                    <View>
                        <Text className="text-2xl font-outfit-bold text-gray-900">
                            {results.length} Matches
                        </Text>
                        <Text className="text-gray-400 font-outfit-medium text-xs mt-1">Best value options found</Text>
                    </View>
                    <View className="bg-orange-500 px-4 py-2 rounded-2xl shadow-lg shadow-orange-500/30 flex-row items-center">
                        <Ionicons name="swap-vertical" size={14} color="white" className="mr-2" />
                        <Text className="text-white font-outfit-bold text-xs ml-1">Price: Low to High</Text>
                    </View>
                </View>

                {results.length === 0 ? (
                    <View className="flex-1 justify-center items-center pb-20">
                        <View className="bg-gray-100 p-10 rounded-full mb-6">
                            <Ionicons name="search-outline" size={80} color="#D1D5DB" />
                        </View>
                        <Text className="text-gray-900 font-outfit-black text-xl text-center">No Results Found</Text>
                        <Text className="text-gray-400 font-outfit-medium text-center mt-2 px-10">
                            We couldn't find any dishes matching "{q}". Try a different keyword!
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mt-8 bg-orange-500 px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/40"
                        >
                            <Text className="text-white font-outfit-bold text-base">Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => `${item.restaurantName}-${item.name}-${index}`}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: `/restaurants/${item.restaurantName}`,
                                    params: { dishName: item.name }
                                })}
                                activeOpacity={0.9}
                                className="bg-white rounded-[32px] p-4 mb-6 shadow-xl shadow-orange-500/10 border border-gray-100 flex-row items-center"
                            >
                                {/* Food Image with Shadow */}
                                <View className="shadow-lg shadow-black/10">
                                    <Image
                                        source={{ uri: item.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400" }}
                                        className="w-24 h-24 rounded-[24px]"
                                        resizeMode="cover"
                                    />
                                    <View className="absolute -top-2 -left-2 bg-orange-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white shadow-sm">
                                        <Text className="text-white text-[10px] font-outfit-bold">#{index + 1}</Text>
                                    </View>
                                </View>

                                {/* Details */}
                                <View className="flex-1 ml-4 py-1">
                                    <View className="flex-row justify-between items-start">
                                        <View className="flex-1">
                                            <Text className="text-lg font-outfit-black text-gray-900 leading-tight" numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <View className="flex-row items-center mt-1.5">
                                                <View className="bg-gray-100 p-1 rounded-full mr-2">
                                                    <Image
                                                        source={{ uri: item.restaurantLogo }}
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                </View>
                                                <Text className="text-gray-500 font-outfit-bold text-[11px] uppercase tracking-wider">
                                                    {item.restaurantDisplayName}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className="flex-row justify-between items-end mt-4">
                                        <View>
                                            <View className="flex-row items-baseline">
                                                <Text className="text-2xl font-outfit-black text-orange-600">₹{item.price}</Text>
                                                <Text className="text-gray-400 text-[10px] font-outfit-medium ml-1">Per item</Text>
                                            </View>
                                        </View>

                                        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${item.isOpen ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <View className={`w-1.5 h-1.5 rounded-full mr-1.5 ${item.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <Text className={`text-[9px] font-outfit-black tracking-widest ${item.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.isOpen ? 'OPEN' : 'CLOSED'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="bg-gray-50 p-2 rounded-full ml-2">
                                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
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
