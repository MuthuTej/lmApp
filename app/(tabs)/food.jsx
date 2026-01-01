// CartScreen.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { gql, useQuery, useMutation, useApolloClient } from "@apollo/client";
import { WebView } from "react-native-webview";
import { useRouter } from "expo-router";
import { TextInput } from "react-native";
import { useEffect, useRef } from "react";

// ------------------ GraphQL ------------------

const GET_CART = gql`
  query GetCart($userId: String!) {
    getCart(userId: $userId) {
      createdAt
      items {
        dishId
        dishName
        imageUrl
        price
        quantity
      }
      restaurantId
      status
      userName
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart(
    $userId: String!
    $restaurantId: String!
    $dishId: String!
    $dishName: String!
    $price: Float!
    $quantity: Int!
    $userName: String!
    $imageUrl: String
  ) {
    addToCart(
      userId: $userId
      restaurantId: $restaurantId
      dishId: $dishId
      dishName: $dishName
      price: $price
      quantity: $quantity
      userName: $userName
      imageUrl: $imageUrl
    )
  }
`;

const CLEAR_CART = gql`
  mutation ClearCart($userId: String!) {
    clearCart(userId: $userId)
  }
`;

const CHECKOUT_CART = gql`
  mutation CheckoutCart($userId: String!) {
    checkoutCart(userId: $userId) {
      success
      internalOrderId
      restaurantId
      total
    }
  }
`;

const CREATE_CASHFREE_ORDER = gql`
  mutation CreateCashfreeOrder(
    $restaurantId: String!
    $internalOrderId: String!
    $total: Float!
  ) {
    createCashfreeOrder(
      restaurantId: $restaurantId
      internalOrderId: $internalOrderId
      total: $total
    ) {
      paymentSessionId
      success
    }
  }
`;

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

const ME = gql`
  query GetMe {
    me {
      id
      name
      email
      mobileNumber
      registerNumber
    }
  }
`;

// ------------------ Component ------------------

export default function CartScreen() {
  const router = useRouter();
  const client = useApolloClient();
  const { data: meData, loading: meLoading } = useQuery(ME);
  const userId = meData?.me?.id || null;
  const userName = meData?.me?.name || null;

  const [loadingItemId, setLoadingItemId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [showWebView, setShowWebView] = useState(false);

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [allRestaurantMenus, setAllRestaurantMenus] = useState([]);
  const [menusLoaded, setMenusLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: restaurantsData } = useQuery(GET_RESTAURANTS);

  const { data, loading, refetch } = useQuery(GET_CART, {
    variables: { userId },
    fetchPolicy: "network-only",
    skip: !userId,
  });

  const [addToCart] = useMutation(ADD_TO_CART, {
    onCompleted: () => {
      setLoadingItemId(null);
      refetch();
    },
    onError: (err) => {
      setLoadingItemId(null);

      const errorMessage = err.message || "";
      console.log("error", err.message);
      if (errorMessage.includes("not available")) {
        alert("This item is currently unavailable.");
      } else if (errorMessage.includes("not found")) {
        alert("This item is no longer on the menu.");
      } else {
        alert(err.message);
      }
    },
  });

  const [clearCart] = useMutation(CLEAR_CART, {
    onCompleted: () => refetch(),
  });

  const [checkoutCart, { loading: checkoutLoading }] =
    useMutation(CHECKOUT_CART);

  const [createCashfreeOrder] =
    useMutation(CREATE_CASHFREE_ORDER);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // ------------------ Background Fetch ------------------
  useEffect(() => {
    if (restaurantsData?.getRestaurents && !menusLoaded) {
      const fetchAllMenus = async () => {
        try {
          const restaurantList = restaurantsData.getRestaurents;
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
        } catch (err) {
          console.error("Error in background menu fetching:", err);
        }
      };
      fetchAllMenus();
    }
  }, [restaurantsData, menusLoaded]);

  // ------------------ Handlers ------------------

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
    if (text.length > 1) {
      const filtered = [];
      const seenItems = new Set();

      allRestaurantMenus.forEach(res => {
        res.menu.forEach(item => {
          const itemName = item.name.toLowerCase();
          const category = item.category.toLowerCase();
          const searchText = text.toLowerCase();

          if ((itemName.includes(searchText) || category.includes(searchText)) && !seenItems.has(item.name)) {
            filtered.push({
              name: item.name,
              type: 'dish',
              category: item.category
            });
            seenItems.add(item.name);
          }
        });

        if (res.name.toLowerCase().includes(text.toLowerCase()) && !seenItems.has(res.name)) {
          filtered.push({
            name: (restaurantsData?.getRestaurents?.find(r => r.name === res.name)?.displayName || res.name),
            originalName: res.name,
            type: 'restaurant'
          });
          seenItems.add(res.name);
        }
      });

      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleQuantityChange = (item, change) => {
    setLoadingItemId(item.dishId);
    addToCart({
      variables: {
        userId,
        restaurantId: data?.getCart?.restaurantId || "",
        dishId: item.dishId,
        dishName: item.dishName,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: change,
        userName,
      },
    });
  };

  const handleClearAll = () => {
    if (!userId) return alert("Please login first");
    clearCart({ variables: { userId } });
  };

  const handleCheckout = async () => {
    if (!userId) return alert("Please login first");

    setIsProcessingPayment(true);

    try {
      // ✅ Existing checkout logic
      const checkoutRes = await checkoutCart({
        variables: { userId },
      });

      const {
        internalOrderId,
        restaurantId,
        total,
      } = checkoutRes.data.checkoutCart;

      // ✅ Create Cashfree order
      const cfRes = await createCashfreeOrder({
        variables: {
          restaurantId,
          internalOrderId,
          total,
        },
      });

      const paymentSessionId =
        cfRes.data.createCashfreeOrder.paymentSessionId;

      // ✅ Open Cashfree Web Checkout
      const url = `https://sandbox.cashfree.com/pg/view/sessions/checkout/web/${paymentSessionId}`;

      setPaymentUrl(url);
      setShowWebView(true);

    } catch (err) {
      console.error(err);
      alert("Payment failed to start");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // ------------------ UI ------------------

  if (loading || meLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  if (!data?.getCart?.items?.length) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-gray-500 text-base">Your cart is empty</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-orange-500 pt-14 pb-8 px-6 rounded-b-[40px] shadow-xl mb-6 z-10">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-4xl font-outfit-extrabold text-white tracking-tight">My Cart</Text>
          <TouchableOpacity
            onPress={handleClearAll}
            activeOpacity={0.7}
            className="flex-row bg-white/20 px-3 py-2 rounded-full items-center border border-white/30"
          >
            <Ionicons name="trash-outline" size={16} color="white" />
            <Text className="text-white font-outfit-bold text-xs uppercase tracking-wide ml-2">Clear</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-orange-50 text-sm font-outfit-medium tracking-wide opacity-90 pl-1 mb-4">
          {data?.getCart?.items?.length || 0} items waiting for you
        </Text>

        {/* Search Bar */}
        <View className="relative">
          <View className="bg-white rounded-2xl px-4 py-2.5 flex-row items-center border-2 border-orange-100 shadow-sm">
            <Ionicons name="search" size={20} color="#F97316" />
            <TextInput
              placeholder="Search dishes, restaurants..."
              className="flex-1 ml-3 text-gray-800 font-outfit-bold text-sm"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={updateSuggestions}
              onSubmitEditing={() => handleSearch()}
              returnKeyType="search"
              onFocus={() => searchQuery.length > 1 && setShowSuggestions(true)}
            />
          </View>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <View className="absolute top-[55px] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    handleSearch(item.originalName || item.name);
                  }}
                  className={`flex-row items-center p-3 border-b border-gray-50 ${index === suggestions.length - 1 ? 'border-b-0' : ''}`}
                >
                  <Ionicons
                    name={item.type === 'dish' ? "fast-food-outline" : "restaurant-outline"}
                    size={16}
                    color="#F97316"
                  />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-800 font-outfit-bold text-sm">{item.name}</Text>
                    {item.type === 'dish' && (
                      <Text className="text-gray-400 font-outfit-medium text-[10px]">{item.category}</Text>
                    )}
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#E5E7EB" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Cart Items */}
      <FlatList
        data={data.getCart.items}
        keyExtractor={(item) => item.dishId}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="flex-row bg-white rounded-[24px] p-4 mb-5 items-center shadow-lg shadow-orange-500/10 border-2 border-orange-200">
            <Image
              source={{ uri: item.imageUrl }}
              className="w-20 h-20 rounded-xl bg-gray-200"
              resizeMode="cover"
            />

            <View className="flex-1 ml-4 justify-between h-20 py-1">
              <View>
                <Text className="text-base font-outfit-bold text-gray-800 leading-tight" numberOfLines={2}>
                  {item.dishName}
                </Text>
                <Text className="text-sm font-outfit-extrabold text-orange-600 mt-1">
                  ₹{item.price * item.quantity}
                </Text>
              </View>

              <Text className="text-[10px] text-gray-400 font-outfit-medium">
                ₹{item.price} / item
              </Text>
            </View>

            <View className="flex-col items-center justify-between h-20 py-0.5 ml-2">
              <TouchableOpacity
                onPress={() => handleQuantityChange(item, 1)}
                disabled={loadingItemId === item.dishId}
                className="bg-orange-500 w-7 h-7 rounded-full justify-center items-center shadow-sm"
              >
                <Text className="text-lg font-outfit-bold text-white leading-5">+</Text>
              </TouchableOpacity>

              {loadingItemId === item.dishId ? (
                <ActivityIndicator size="small" color="#f97316" />
              ) : (
                <Text className="text-base font-outfit-bold text-gray-800">
                  {item.quantity}
                </Text>
              )}

              <TouchableOpacity
                onPress={() => handleQuantityChange(item, -1)}
                disabled={loadingItemId === item.dishId}
                className="bg-gray-50 w-7 h-7 rounded-full justify-center items-center border border-gray-200"
              >
                <Text className="text-lg font-outfit-bold text-gray-600 leading-5">-</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Checkout Button */}
      {data?.getCart?.items?.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-gray-100">
          <View className="flex-row items-center justify-between">
            <View className="pl-2">
              <Text className="text-gray-400 font-outfit-medium text-sm">Total Bill</Text>
              <Text className="text-3xl font-outfit-extrabold text-gray-900">
                ₹{data.getCart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleCheckout}
              disabled={checkoutLoading}
              activeOpacity={0.8}
              className="flex-1 ml-6 bg-orange-500 py-4 rounded-2xl shadow-xl shadow-orange-500/30 flex-row justify-center items-center"
            >
              {checkoutLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text className="text-center text-white text-lg font-outfit-bold mr-2">
                    Checkout
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}


      {/* Cashfree WebView */}
      <Modal visible={showWebView} animationType="slide">
        <SafeAreaView className="flex-1 bg-white">
          <TouchableOpacity
            onPress={() => {
              setShowWebView(false)
              refetch()
            }}
            className="p-4 bg-red-500"
          >
            <Text className="text-white text-center font-semibold">
              Close Payment
            </Text>
          </TouchableOpacity>

          {paymentUrl && (
            <WebView source={{ uri: paymentUrl }} startInLoadingState />
          )}
        </SafeAreaView>
      </Modal>

      {/* Payment Processing Loading Modal */}
      <Modal visible={isProcessingPayment} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-2xl items-center shadow-xl">
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="text-gray-800 font-semibold mt-4 text-base">
              Processing Payment...
            </Text>
          </View>
        </View>
      </Modal>
    </View >
  );
}
