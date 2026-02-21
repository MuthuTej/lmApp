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
import { useState, useRef, useMemo } from "react";
import { gql, useQuery, useSubscription } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import DishModal from "../../components/DishModal";
import VegIndicator from "../../components/VegIndicator";
import { Link } from "expo-router";
import Fuse from "fuse.js";

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

const RESTAURANTS_LIST_SUB = gql`
  subscription OnRestaurantsListUpdate {
    restaurantsListUpdated {
      name
      displayName
      imageUrl
      login
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
        isVeg
      }
      isOpen
      logo
    }
  }
`;
const GET_FOOD_CATEGORIES = gql`
  query GetFoodCategories {
    getFoodCategories {
      foodCategories {
        id
        name
        image
      }
    }
  }
`;

import { useRouter } from "expo-router";
import { useApolloClient } from "@apollo/client";

const Home = () => {
  const router = useRouter();
  const client = useApolloClient();
  const { loading, data, error } = useQuery(GET_RESTAURANTS);
  const { data: realtimeList } = useSubscription(RESTAURANTS_LIST_SUB);
  const [selectedDish, setSelectedDish] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allRestaurantMenus, setAllRestaurantMenus] = useState([]);
  const [menusLoaded, setMenusLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const { data: catData, loading: catLoading } = useQuery(GET_FOOD_CATEGORIES);

  const foodCategories = catData?.getFoodCategories?.foodCategories || [];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const displayList = realtimeList?.restaurantsListUpdated || data?.getRestaurents || [];

  const restaurants = displayList.map((restaurant, index) => {
    const menuData = allRestaurantMenus.find((m) => m.name === restaurant.name);
    return {
      ...restaurant,
      isOpen: menuData ? menuData.isOpen : true,
    };
  });
  const topCategoryDishes = React.useMemo(() => {
    if (!activeCategory) return [];

    const q = activeCategory.toLowerCase();
    const dishes = [];

    allRestaurantMenus.forEach((res) => {
      res?.menu?.forEach((dish) => {
        const name = (dish.name || "").toLowerCase();
        const cat = (dish.category || "").toLowerCase();

        // ✅ match by dish name or category
        if (name.includes(q) || cat.includes(q)) {
          dishes.push({
            ...dish,
            restaurantName: res.name,
          });
        }
      });
    });

    // ✅ show available first
    dishes.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0));

    return dishes.slice(0, 6);
  }, [activeCategory, allRestaurantMenus]);

  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [fuse, setFuse] = useState(null);

  React.useEffect(() => {
    if (!allRestaurantMenus.length) return;

    const setCat = new Set();

    allRestaurantMenus.forEach((res) => {
      res?.menu?.forEach((dish) => {
        if (dish?.category) setCat.add(dish.category.trim());
      });
    });

    setCategorySuggestions([...setCat]);
  }, [allRestaurantMenus]);
  React.useEffect(() => {
    if (!data?.getRestaurents?.length || !allRestaurantMenus.length) return;

    const index = [];

    // ✅ restaurants
    data.getRestaurents.forEach((r) => {
      index.push({
        type: "restaurant",
        name: r.displayName || r.name,
        originalName: r.name,
      });
    });

    // ✅ dishes
    allRestaurantMenus.forEach((res) => {
      res?.menu?.forEach((dish) => {
        index.push({
          type: "dish",
          name: dish.name,
          category: dish.category || "",
        });
      });
    });

    // ✅ categories
    categorySuggestions.forEach((cat) => {
      index.push({
        type: "category",
        name: cat,
      });
    });

    const fuseInstance = new Fuse(index, {
      keys: ["name", "category"],
      threshold: 0.35,  // ✅ typo tolerance
      ignoreLocation: true,
    });

    setFuse(fuseInstance);
  }, [data, allRestaurantMenus, categorySuggestions]);

  // const foodCategories = [
  //   { id: 1, name: "Paratha", image: require("../../assets/porotto.png") },
  //   { id: 5, name: "Burgers", image: require("../../assets/burger.png") },
  //   { id: 3, name: "Desserts", image: require("../../assets/dessert.png") },
  //   { id: 4, name: "Milkshake", image: require("../../assets/milkshake.png") },
  //   { id: 2, name: "Biryani", image: require("../../assets/biryani.png") },
  // ];

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

  React.useEffect(() => {
    if (data?.getRestaurents && !menusLoaded) {
      const fetchAllMenus = async () => {
        try {
          const restaurantList = data.getRestaurents;
          const menuResults = await Promise.all(
            restaurantList.map(async (res) => {
              try {
                const { data: menuData } = await client.query({
                  query: GET_MENU_BY_RESTAURANT_NAME,
                  variables: { name: res.name },
                });
                return menuData?.getMenuByRestaurantName;
              } catch (err) {
                console.error(`Error fetching menu for ${res.name}:`, err);
                return null;
              }
            })
          );
          setAllRestaurantMenus(menuResults.filter(Boolean));
          setMenusLoaded(true);
          console.log("✅ All menus loaded in background");
        } catch (err) {
          console.error("Error in background menu fetching:", err);
        }
      };

      // Delay fetch slightly to ensure UI is interactive
      const timer = setTimeout(fetchAllMenus, 1000);
      return () => clearTimeout(timer);
    }
  }, [data, menusLoaded]);

  if (loading) return <Loader text="Preparing your meals :)" />;
  if (error) return <Text>Error loading restaurants: {error.message}</Text>;

  const handleSelectFood = (item) => {
    setSelectedDish(item);
  };

  const handleSearch = (query = searchQuery) => {
    const finalQuery = typeof query === 'string' ? query : searchQuery;
    if (finalQuery.trim()) {
      setShowSuggestions(false);
      router.push({
        pathname: "/search",
        params: { q: finalQuery.trim() }
      });
    }
  };

  const updateSuggestions = (text) => {
    setSearchQuery(text);

    if (!text || text.length < 2 || !fuse) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const results = fuse.search(text).slice(0, 8).map((r) => r.item);

    setSuggestions(results);
    setShowSuggestions(true);
  };



  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* App Name & Header */}
      <View className="bg-orange-500 pt-14 pb-8 px-6 rounded-b-[40px] shadow-xl mb-6 z-10">
        <View className="flex-row justify-between items-start mb-6">
          <View>
            <View className="flex-row items-baseline">
              <Image
                source={require("../../assets/logo_only.png")}
                className="w-16 h-16 mr-2"
              />
              <Text className="text-5xl font-outfit-extrabold text-white tracking-tighter">Grab</Text>
              <Text className="text-5xl font-outfit-extrabold text-yellow-300 tracking-tighter italic">IT</Text>
            </View>
            <Text className="text-orange-100 text-base mt-2 font-outfit-medium tracking-wide"> - Skip the line . Grab & Go - </Text>
          </View>
          <TouchableOpacity
            className="bg-white/20 p-3 rounded-full border border-white/30"
            activeOpacity={0.7}
            onPress={() => router.push("/(tabs)/food")}
          >
            <Ionicons name="cart-outline" size={26} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative z-50">
          <View className="bg-white rounded-2xl px-4 py-3.5 flex-row items-center shadow-lg shadow-orange-900/20 border-2 border-orange-100">
            <Ionicons name="search" size={24} color="#F97316" />
            <TextInput
              placeholder="Search for restaurants, dishes..."
              className="flex-1 ml-3 text-gray-800 font-outfit-bold text-base"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={updateSuggestions}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
              onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
            />
            <TouchableOpacity
              onPress={() => handleSearch()}
              className="border-l border-gray-200 pl-3 ml-2"
            >
              {/* <Ionicons name="options-outline" size={24} color="#F97316" /> */}
            </TouchableOpacity>
          </View>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View className="absolute top-[65px] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setShowSuggestions(false);

                    // ✅ if Restaurant -> open restaurant page directly
                    if (item.type === "restaurant") {
                      router.push(`/restaurants/${item.originalName}`);
                      return;
                    }

                    // ✅ if Dish or Category -> go to search page with only the name
                    router.push({
                      pathname: "/search",
                      params: { q: item.name },
                    });
                  }}

                  className={`flex-row items-center p-4 border-b border-gray-50 ${index === suggestions.length - 1 ? 'border-b-0' : ''}`}
                >
                  <Ionicons
                    name={
                      item.type === "dish"
                        ? "fast-food-outline"
                        : item.type === "restaurant"
                          ? "restaurant-outline"
                          : "grid-outline" // ✅ category icon
                    }

                    size={20}
                    color="#F97316"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-800 font-outfit-bold text-base">{item.name}</Text>
                    {item.type === 'dish' && (
                      <Text className="text-gray-400 font-outfit-medium text-xs">{item.category}</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={16} color="#E5E7EB" />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
            <Text className="text-2xl font-outfit-bold py-2 text-gray-800">What are you craving?</Text>
            <TouchableOpacity
              onPress={() => {
                if (activeCategory) {
                  router.push({ pathname: "/search", params: { q: activeCategory } });
                } else {
                  // default open search
                  router.push({ pathname: "/search", params: { q: "" } });
                }
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: "/search", params: { q: activeCategory } })
                }
                className="mt-4 bg-orange-500 py-2 px-6 rounded-2xl items-center"
              >
                <Text className="text-white font-outfit-bold">
                  Explore all {activeCategory}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }}>
            {foodCategories.map((category) => {
              const isActive = activeCategory === category.name;

              return (
                <TouchableOpacity
                  key={category.id}
                  className="items-center mr-3"
                  activeOpacity={0.85}
                  onPress={() => setActiveCategory(category.name)}
                >
                  <View
                    className={`mb-2 w-[88px] h-[88px] justify-center items-center rounded-2xl ${isActive ? "bg-orange-100 border-2 border-orange-500" : "bg-white"
                      } shadow-sm`}
                  >
                    <Image
                      source={{ uri: category.image }}
                      className="w-16 h-16"
                      resizeMode="contain"
                    />
                  </View>

                  <Text
                    className={`text-sm font-outfit-bold text-center tracking-wide ${isActive ? "text-orange-600" : "text-gray-800"
                      }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

          </ScrollView>
        </View>
        {activeCategory && (
          <View className="px-6 mt-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-outfit-bold text-gray-900">
                Top {activeCategory} picks
              </Text>

              <TouchableOpacity onPress={() => setActiveCategory(null)}>
                <Text className="text-gray-400 font-outfit-bold text-sm">Clear</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topCategoryDishes.map((dish, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/search",
                      params: { q: dish.name }, // ✅ dish name only
                    })
                  }
                  className="bg-white rounded-2xl w-44 mr-3 p-3 border border-gray-100 shadow-sm"
                >
                  <Image
                    source={{
                      uri:
                        dish.imageUrl ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                    }}
                    className="w-full h-24 rounded-xl bg-gray-100"
                    resizeMode="cover"
                  />

                  <Text
                    className="text-sm font-outfit-bold text-gray-900 mt-2"
                    numberOfLines={1}
                  >
                    {dish.name}
                  </Text>

                  <Text className="text-[11px] font-outfit-medium text-gray-400" numberOfLines={1}>
                    {dish.category}
                  </Text>

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-orange-500 font-outfit-black">
                      ₹{dish.price}
                    </Text>

                    <View
                      className={`px-2 py-1 rounded-lg ${dish.isAvailable ? "bg-green-50" : "bg-red-50"
                        }`}
                    >
                      <Text
                        className={`text-[10px] font-outfit-bold ${dish.isAvailable ? "text-green-700" : "text-red-700"
                          }`}
                      >
                        {dish.isAvailable ? "AVAILABLE" : "SOLD"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Restaurants */}
        <View className="px-6 mb-24">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-outfit-bold text-gray-800">Popular Restaurants</Text>
            <Link href="/(tabs)/food" asChild>
              <TouchableOpacity>
                {/* <Text className="text-orange-500 text-base font-outfit-bold">View All</Text> */}
              </TouchableOpacity>
            </Link>
          </View>

          <FlatList
            data={restaurants}
            renderItem={({ item }) => (
              <Link href={`/restaurants/${item.name}`} asChild>
                <TouchableOpacity
                  activeOpacity={0.85}
                  className={`rounded-[36px] mb-8 bg-white h-72 w-full shadow-2xl ${item.isOpen ? "shadow-orange-500/50 border-orange-500" : "shadow-gray-400/30 border-gray-400"
                    } border-[6px]`}
                >
                  <View className="relative w-full h-full rounded-[26px] overflow-hidden bg-white">
                    {/* Full Image */}
                    <Image
                      source={{ uri: item.imageUrl }}
                      className="absolute w-full h-full"
                      resizeMode="contain"
                      style={{
                        transform: [
                          { translateY: -30 },
                          {
                            scale: (() => {
                              const name = (item.displayName || '').toLowerCase();
                              if (name.includes('main canteen')) return 1.0;
                              if (name.includes('food zone') || name.includes('chill out')) return 1.35;
                              if (name.includes('c2c') || name.includes('aproova') || name.includes('apoorva')) return 1.85;
                              return 1.35; // Default fallback
                            })()
                          }
                        ]
                      }}
                    />

                    {/* Grayscale/Closed Overlay */}
                    {!item.isOpen && (
                      <View className="absolute inset-0 bg-gray-900/60 z-10 flex items-center justify-center">
                        <View className="bg-white/95 px-8 py-3 rounded-full border-2 border-gray-500 shadow-xl">
                          <Text className="text-gray-900 font-outfit-black text-2xl tracking-[4px] uppercase italic">
                            Closed
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Glass Bottom Panel - Bright & Clean */}
                    <View className="absolute bottom-4 left-4 right-4 bg-white/95 p-5 rounded-[20px] shadow-lg shadow-orange-500/20 backdrop-blur-md border-[2px] border-orange-200">
                      {/* Name - Deep Contrast */}
                      <Text className="text-2xl font-outfit-black text-gray-900 leading-tight tracking-tight uppercase">
                        {item.displayName}
                      </Text>

                      {/* Category - Vibrant Highlight */}
                      {/* <Text className="text-orange-600 text-[11px] font-outfit-black tracking-widest mt-1">
                        ITALIAN • COMFORT FOOD
                      </Text> */}
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
