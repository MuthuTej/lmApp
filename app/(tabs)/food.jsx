// CartScreen.jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { gql, useQuery, useMutation } from '@apollo/client';

const GET_CART = gql`
  query GetCart($userId: String!) {
    getCart(userId: $userId) {
      restaurantId
      items {
        dishId
        name
        price
        quantity
        imageUrl
      }
      status
      createdAt
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart(
    $userId: String!
    $restaurantId: String!
    $dishId: String!
    $name: String!
    $price: Float!
    $imageUrl: String!
    $quantity: Int!
  ) {
    addToCart(
      userId: $userId
      restaurantId: $restaurantId
      dishId: $dishId
      name: $name
      price: $price
      imageUrl: $imageUrl
      quantity: $quantity
    )
  }
`;

const ME = gql`
  query {
    me {
      id
      email
    }
  }
`;
export default function CartScreen() {
  const { data: meData, loading: meLoading } = useQuery(ME);
  const userId = meData?.me?.id || null;
   const [loadingItemId, setLoadingItemId] = useState(null); // track which item is updating

  const { data, loading, refetch } = useQuery(GET_CART, {
    variables: { userId },
    fetchPolicy: 'network-only'
  });

  const [addToCart] = useMutation(ADD_TO_CART, {
    onCompleted: () => {
      setLoadingItemId(null);
      refetch();
    }
  });

  const handleQuantityChange = (item, change) => {
    setLoadingItemId(item.dishId);
    addToCart({
      variables: {
        userId,
        restaurantId: data?.getCart?.restaurantId || '',
        dishId: item.dishId,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: change
      }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!data?.getCart?.items?.length) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-gray-600 text-lg">Your cart is empty</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data.getCart.items}
      keyExtractor={(item) => item.dishId}
      contentContainerStyle={{ paddingTop: 24, paddingHorizontal: 16, paddingBottom: 24 }}
      renderItem={({ item }) => (
        <View className="flex-row bg-white rounded-xl p-4 mb-3 shadow-sm">
          <Image source={{ uri: item.imageUrl }} className="w-20 h-20 rounded-lg" />
          <View className="flex-1 ml-3 justify-between">
            <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
            <Text className="text-sm text-gray-500">₹{item.price}</Text>
            <View className="flex-row items-center space-x-4 mt-2">
              <TouchableOpacity
                onPress={() => handleQuantityChange(item, -1)}
                className="bg-gray-200 rounded-full px-3 py-1"
                disabled={loadingItemId === item.dishId}
              >
                <Text className="text-lg font-bold text-gray-700">-</Text>
              </TouchableOpacity>

              {loadingItemId === item.dishId ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <Text className="text-lg font-medium text-gray-800">{item.quantity}</Text>
              )}

              <TouchableOpacity
                onPress={() => handleQuantityChange(item, 1)}
                className="bg-green-500 rounded-full px-3 py-1"
                disabled={loadingItemId === item.dishId}
              >
                <Text className="text-lg font-bold text-white">+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    />
  );
}
