// ... imports
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { gql, useMutation, useQuery } from '@apollo/client';
import VegIndicator from './VegIndicator';

// ... Queries (keeping them same)
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

export default function DishModal({ visible, dish, onClose, restaurant }) {
  const { data: meData, loading: meLoading } = useQuery(ME, {
    skip: !visible,
  });
  const userId = meData?.me?.id || null;
  const userName = meData?.me?.name || null;

  const [qty, setQty] = useState(1);
  const [addToCartMutation, { loading }] = useMutation(ADD_TO_CART, {
    refetchQueries: userId
      ? [{ query: GET_CART, variables: { userId } }]
      : [],
    awaitRefetchQueries: true,
  });

  if (!dish) return null;

  const handleAddToCart = async () => {
    if (!userId || !restaurant?.name || !dish?.name) {
      alert("Missing user, restaurant, or dish ID");
      return;
    }

    try {
      await addToCartMutation({
        variables: {
          userId,
          restaurantId: restaurant.name,
          dishId: dish.name,
          dishName: dish.name,
          userName: userName,
          price: Number(dish.price),
          imageUrl: dish.imageUrl,
          quantity: qty,
        },
      });
      setQty(1);
      onClose();
    } catch (err) {
      const message =
        err?.graphQLErrors?.[0]?.message ||
        err.message ||
        "Unable to add item";

      if (message.includes("not available")) {
        alert("This item is currently unavailable.");
      } else if (message.includes("not found")) {
        alert("This item is no longer on the menu.");
      } else {
        alert(message);
      }
    }
  };

  if (!visible || !dish) return null;

  const isClosed = restaurant?.isOpen === false;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/40 backdrop-blur-sm">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-[40px] p-6 shadow-2xl max-h-[85%]">
              {/* Grab bar */}
              <View className="items-center mb-6">
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>

              {/* Dish Image */}
              <View className="shadow-xl shadow-orange-500/20 rounded-[24px] bg-white mb-6 border-[4px] border-orange-500 overflow-hidden relative">
                <Image source={{ uri: dish.imageUrl }} className="w-full h-64 bg-gray-100" resizeMode="cover" />
                {isClosed && (
                  <View className="absolute inset-0" style={{ backgroundColor: 'rgba(100,100,100,0.8)' }} />
                )}
              </View>

              {/* Dish Details */}
              <View className="mb-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-2xl font-outfit-bold text-gray-900 mb-2">{dish.name}</Text>
                    {dish.isVeg !== undefined && dish.isVeg !== null && <VegIndicator isVeg={dish.isVeg} size="sm" />}
                  </View>
                  <Text className="text-2xl font-outfit-extrabold text-orange-600">₹{dish.price}</Text>
                </View>

                <Text className="text-gray-500 text-sm leading-5 mb-4 mt-3 font-outfit-medium">{dish.description}</Text>

                {/* Divider */}
                <View className="h-[1px] bg-gray-100 my-2" />
              </View>

              {/* Footer Actions */}
              <View className="pt-2">
                {/* Quantity Selector */}
                <View className={`flex-row items-center justify-center mb-8 bg-orange-50 self-center rounded-full p-1.5 border border-orange-100 shadow-sm ${isClosed ? 'opacity-50' : ''}`}>
                  <TouchableOpacity
                    onPress={() => !isClosed && setQty(Math.max(1, qty - 1))}
                    disabled={isClosed}
                    className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-orange-50"
                  >
                    <Ionicons name="remove" size={24} color="#EA580C" />
                  </TouchableOpacity>

                  <Text className="text-2xl font-outfit-bold text-gray-800 w-16 text-center">{qty}</Text>

                  <TouchableOpacity
                    onPress={() => !isClosed && setQty(qty + 1)}
                    disabled={isClosed}
                    className="w-12 h-12 bg-orange-500 rounded-full items-center justify-center shadow-lg shadow-orange-200"
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Buttons */}
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 items-center justify-center py-4 rounded-2xl bg-gray-100 border border-gray-200"
                  >
                    <Text className="text-gray-600 font-outfit-bold text-base">Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleAddToCart}
                    disabled={loading || meLoading || isClosed}
                    className={`flex-[2] rounded-2xl py-4 items-center justify-center shadow-lg border-2 ${isClosed ? 'bg-gray-400 border-gray-400 shadow-none' : 'bg-orange-500 border-orange-400 shadow-orange-200'}`}
                  >
                    <Text className="text-white font-outfit-bold text-lg tracking-wide">
                      {isClosed ? 'Restaurant Closed' : (loading ? 'Adding...' : `Add to Cart - ₹${dish.price * qty}`)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
