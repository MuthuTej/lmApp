import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { gql, useMutation, useQuery } from '@apollo/client';

const ME = gql`
  query {
    me {
      id
      email
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
export default function DishModal({ visible, dish, onClose, restaurant }) {
  const { data: meData, loading: meLoading } = useQuery(ME, {
    skip: !visible,
  });
  const userId = meData?.me?.id || null;

  const [qty, setQty] = useState(1);
  const [addToCartMutation, { loading }] = useMutation(ADD_TO_CART, {
    refetchQueries: [
      { query: GET_CART, variables: { userId } } // re-fetch cart
    ],
    awaitRefetchQueries: true,
  });
  
  if (!dish) return null;

  const handleAddToCart = async () => {
    if (!userId) {
      alert('You must be logged in to add items to your cart.');
      return;
    }

    try {
      await addToCartMutation({
        variables: {
          userId,
          restaurantId: restaurant.name,
          dishId: dish.name,
          name: dish.name,
          price: Number(dish.price),
          imageUrl: dish.imageUrl,
          quantity: qty,
        },
      });
      setQty(1);
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/30">
          <TouchableWithoutFeedback>
            <SafeAreaView className="bg-white rounded-t-2xl p-4" style={{ maxHeight: '75%' }}>
              {/* Grab bar */}
              <View className="items-center">
                <View className="w-10 h-1 bg-gray-400 rounded-full mb-3" />
              </View>

              {/* Dish Image */}
              <Image source={{ uri: dish.imageUrl }} className="w-full h-48 rounded-lg" />

              {/* Dish Details */}
              <Text className="text-lg font-bold mt-2 text-black">{dish.name}</Text>
              <Text className="text-gray-600 text-sm">{dish.description}</Text>
              <Text className="text-base font-bold mt-1 text-green-600">₹{dish.price}</Text>

              {/* Quantity Selector */}
              <View className="flex-row items-center mt-3 justify-center">
                <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))}>
                  <Ionicons name="remove-circle" size={32} color="#F59E0B" />
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-black mx-4">{qty}</Text>
                <TouchableOpacity onPress={() => setQty(qty + 1)}>
                  <Ionicons name="add-circle" size={32} color="#F59E0B" />
                </TouchableOpacity>
              </View>

              {/* Add to Cart Button */}
              <TouchableOpacity
                onPress={handleAddToCart}
                disabled={loading || meLoading}
                className="bg-yellow-500 rounded-lg py-3 mt-5"
              >
                <Text className="text-center text-white font-bold">
                  {loading ? 'Adding...' : `Add ${qty} • ₹${dish.price * qty}`}
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity onPress={onClose} className="items-center mt-3">
                <Text className="text-red-600 font-bold">Cancel</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
