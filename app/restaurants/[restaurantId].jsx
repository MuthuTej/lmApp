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
import { gql, useQuery, useSubscription } from "@apollo/client";

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
        isVeg
      }
      isOpen
      logo
    }
  }
`;

const RESTAURANT_UPDATED_SUB = gql`
  subscription OnRestaurantUpdate($restaurantId: String!) {
    restaurantUpdated(restaurantId: $restaurantId) {
      name
      isOpen
      logo
      menu {
        name
        price
        isAvailable
        category
        description
        imageUrl
        isVeg
      }
    }
  }
`;

export default function RestaurantScreen() {
  const { restaurantId, dishName } = useLocalSearchParams();
  const [selectedDish, setSelectedDish] = useState(null);
  const [searchQuery, setSearchQuery] = useState(dishName || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'veg', 'non-veg'

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

  const { data: realtimeData } = useSubscription(RESTAURANT_UPDATED_SUB, {
    variables: { restaurantId: restaurantId },
  });
  const updateSuggestions = (text) => {
    setSearchQuery(text);
    if (text.length > 1 && data?.getMenuByRestaurantName?.menu) {
      const filtered = data.getMenuByRestaurantName.menu
        .filter(item => item.name.toLowerCase().includes(text.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  if (loading) return <Loader text="Loading menu..." />;
  if (error) return <Text>Error: {error.message}</Text>;

  const restaurant = realtimeData?.restaurantUpdated || data.getMenuByRestaurantName;

  const menu = restaurant.menu.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    const isVeg = item.isVeg === true || item.isVeg === "true";

    if (filterType === 'veg') {
      matchesFilter = isVeg;
    } else if (filterType === 'non-veg') {
      matchesFilter = !isVeg;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['left', 'right', 'bottom']}>
      <Animated.FlatList
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        ListHeaderComponent={
          <View>
            <RestaurantHeader
              restaurant={restaurant}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              updateSuggestions={updateSuggestions}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
            />
            <FilterRow filterType={filterType} setFilterType={setFilterType} />
          </View>
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
            isRestaurantOpen={restaurant.isOpen !== false} // Default to true if undefined
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

const FilterRow = ({ filterType, setFilterType }) => {
  return (
    <View className="flex-row px-6 pb-4 gap-3">
      <FilterChip
        label="Veg"
        type="veg"
        isActive={filterType === 'veg'}
        onToggle={() => setFilterType(filterType === 'veg' ? 'all' : 'veg')}
      />
      <FilterChip
        label="Non-veg"
        type="non-veg"
        isActive={filterType === 'non-veg'}
        onToggle={() => setFilterType(filterType === 'non-veg' ? 'all' : 'non-veg')}
      />
    </View>
  );
};

const FilterChip = ({ label, type, isActive, onToggle }) => {
  const isVeg = type === 'veg';
  const borderColor = isActive ? "border-red-200" : "border-gray-200";
  const bgColor = isActive ? "bg-red-50" : "bg-white";
  const textColor = "text-gray-800";

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      className={`flex-row items-center px-3 py-2 rounded-xl border ${borderColor} ${bgColor} shadow-sm`}
    >
      {/* Icon */}
      <View className={`mr-2 border ${isVeg ? 'border-green-600' : 'border-red-700'} w-4 h-4 items-center justify-center rounded-[4px]`}>
        {isVeg ? (
          <View className="w-2 h-2 rounded-full bg-green-600" />
        ) : (
          <View style={{
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderStyle: 'solid',
            borderLeftWidth: 3,
            borderRightWidth: 3,
            borderBottomWidth: 6,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#b91c1c',
            transform: [{ translateY: -0.5 }]
          }} />
        )}
      </View>

      <Text className={`font-outfit-medium text-sm ${textColor} mr-1`}>{label}</Text>

      {isActive && (
        <Ionicons name="close" size={14} color="#4B5563" style={{ marginLeft: 2 }} />
      )}
    </TouchableOpacity>
  );
};

const RestaurantHeader = ({
  restaurant,
  searchQuery,
  setSearchQuery,
  updateSuggestions,
  suggestions,
  showSuggestions,
  setShowSuggestions
}) => (
  <View className="mb-4 shadow-xl bg-orange-500 rounded-b-[40px] z-50">
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

      {/* Search Bar with Suggestions */}
      <View className="relative z-50">
        <View className="bg-white rounded-2xl px-4 py-3.5 flex-row items-center shadow-lg shadow-orange-900/20 border-2 border-orange-100">
          <Ionicons name="search" size={22} color="#F97316" />
          <TextInput
            placeholder="Search for dishes..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={updateSuggestions}
            onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
            className="flex-1 ml-3 text-gray-800 font-outfit-medium text-base"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery("");
              updateSuggestions("");
            }}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Suggestions List */}
        {showSuggestions && suggestions.length > 0 && (
          <View className="absolute top-[65px] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
            {suggestions.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSearchQuery(item.name);
                  setShowSuggestions(false);
                }}
                className={`flex-row items-center p-4 border-b border-gray-50 ${index === suggestions.length - 1 ? 'border-b-0' : ''}`}
              >
                <Ionicons name="fast-food-outline" size={18} color="#F97316" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-outfit-bold text-sm">{item.name}</Text>
                  <Text className="text-gray-400 font-outfit-medium text-[10px]">{item.category} • ₹{item.price}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#E5E7EB" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </LinearGradient>
  </View>
);
