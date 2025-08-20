import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
    skip: !visible, // Only fetch when modal is visible
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
          restaurantId: restaurant.name, // Use actual ID from restaurant object
          dishId: dish.name,
          name: dish.name,
          price: Number(dish.price), // Ensure price is a Float
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
        <View className="flex-1 justify-end bg-black/25">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl p-6" style={{ height: '60%' }}>
              {/* Grab bar */}
              <View className="items-center">
                <View className="w-12 h-1.5 bg-gray-400 rounded-full mb-4" />
              </View>

              {/* Dish Image */}
              <Image source={{ uri: dish.imageUrl }} className="w-full h-72 rounded-xl" />

              {/* Dish Details */}
              <Text className="text-xl font-semibold mt-3">{dish.name}</Text>
              <Text className="text-gray-500">{dish.description}</Text>
              <Text className="text-lg font-bold mt-2">₹{dish.price}</Text>

              {/* Quantity Selector */}
              <View className="flex-row items-center mt-4 w-full justify-center">
                <View className="flex-row gap-x-5 items-center">
                  <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))}>
                    <Ionicons name="remove-circle" size={35} color="#9810fa" />
                  </TouchableOpacity>
                  <Text className="text-xl">{qty}</Text>
                  <TouchableOpacity onPress={() => setQty(qty + 1)}>
                    <Ionicons name="add-circle" size={35} color="#9810fa" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Add to Cart Button */}
              <TouchableOpacity
                onPress={handleAddToCart}
                disabled={loading || meLoading}
                className="bg-success rounded-xl py-3 mt-6"
              >
                <Text className="text-center text-white font-semibold">
                  {loading ? 'Adding...' : `Add ${qty} • ₹${dish.price * qty}`}
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity onPress={onClose} className="items-center mt-4">
                <Text className="text-error font-extrabold">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
