import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DishCard from "../../components/DishCard";
import DishModal from "../../components/DishModal";
import { SafeAreaView } from "react-native-safe-area-context";
import Loader from "../../components/Loader";
import { gql, useQuery } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
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
            cardWidth={screenWidth / 2.27}
            showRank={false}
            onPress={() => setSelectedDish(item)}
          />
        )}
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
    </SafeAreaView>
  );
}

const RestaurantHeader = ({ restaurant, searchQuery, setSearchQuery }) => (
  <View style={{ marginBottom: 20 }}>
    <LinearGradient
      colors={["#F5CB58", "#F5CB58"]} // solid warm yellow
      style={styles.headerContainer}
    >
      {/* Top Row: Arrow + Centered Name & Status */}
      <View style={styles.headerRow}>
        {/* Back Arrow */}
        <TouchableOpacity onPress={() => router.back()} style={styles.arrowBtn}>
          <Ionicons name="arrow-back" size={28} color="#f66c3a" />
        </TouchableOpacity>

        {/* Center: Restaurant Name and Status */}
        <View style={styles.centerContainer}>
          <Text style={styles.restaurantName}>{restaurant.name}</Text>
          <View
  style={[
    styles.statusBadge,
    {
      borderColor: restaurant.isOpen ? "limegreen" : "red",
      shadowColor: restaurant.isOpen ? "limegreen" : "red",
    },
  ]}
>
  <Text
    style={[
      styles.statusText,
      { color: restaurant.isOpen ? "limegreen" : "red" },
    ]}
  >
    {restaurant.isOpen ? "OPEN NOW" : "CLOSED"}
  </Text>
</View>

        </View>

        {/* Empty view to balance layout */}
        <View style={{ width: 28 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#aaa" />
        <TextInput
          placeholder="Search dishes..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: "#F5CB58",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  arrowBtn: {
    width: 28,
    alignItems: "flex-start",
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
  },

  restaurantName: {
    fontSize: 36,
    textTransform: "uppercase",
    fontWeight: "bold",
    color: "#f66c3a",
    fontFamily: "Helvetica",
    textShadowColor: "#000000",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  statusBadge: {
  alignSelf: "center",
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 25,
  backgroundColor: "#F5CB58",
  borderWidth: 2,
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.9,
  shadowRadius: 8,
  elevation: 8,
  marginTop:10,
},

statusText: {
  fontSize: 14,
  fontWeight: "bold",
  textAlign: "center",
},

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#000",
  },
});
