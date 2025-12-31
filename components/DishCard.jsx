import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native"
import { Link } from "expo-router"

export default function DishCard({ item, index = 0, cardWidth = 160, href, showRank, onPress }) {
  const title = item.name ?? item.dishName;
  const imgSrc = item.imageUrl ?? item.image;
  const description = item.description ?? "";
  const price = item.price ?? "—";
  const isAvailable = item.isAvailable ?? true;

  const CardInner = (
    <TouchableOpacity
      activeOpacity={0.8}
      className="bg-white rounded-2xl shadow-sm border-2 border-yellow-400 overflow-hidden mb-3"
      style={{ width: cardWidth }}
      onPress={onPress}
    >
      {/* IMAGE */}
      <View className="relative">
        <Image
          source={{ uri: imgSrc }}
          className="w-full h-36 bg-gray-200"
          resizeMode="cover"
        />
        {!isAvailable && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <View className="bg-red-500 px-2 py-1 rounded-md transform -rotate-12">
              <Text className="text-white text-[10px] font-outfit-bold uppercase">Sold Out</Text>
            </View>
          </View>
        )}
      </View>

      {/* Rank Badge */}
      {showRank && (
        <View className="absolute top-2 left-2 bg-yellow-400 w-6 h-6 rounded-full items-center justify-center shadow-sm z-10">
          <Text className="text-xs font-outfit-bold text-yellow-900">{index + 1}</Text>
        </View>
      )}

      {/* CONTENT */}
      <View className="p-3">
        <View className="h-10 justify-center">
          <Text className="text-sm font-outfit-bold text-gray-800 leading-4" numberOfLines={2}>
            {title}
          </Text>



          
        </View>

        {!!description && (
          <Text className="text-[10px] text-gray-500 mt-1 mb-2 leading-3" numberOfLines={1}>
            {description}
          </Text>
        )}

        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-sm font-outfit-extrabold text-orange-600">₹{price}</Text>
          {/* <TouchableOpacity className="bg-orange-50 p-1.5 rounded-full">
            <Text className="text-orange-500 text-[10px] font-bold">+</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </TouchableOpacity>
  );

  return href ? <Link href={href} asChild>{CardInner}</Link> : CardInner;
}

/* ---------- Example usage ---------- */
export function DishGrid({ data }) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 14 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {data.map((item, idx) => (
          <DishCard key={idx} item={item} index={idx} showRank={false} />
        ))}
      </View>
    </ScrollView>
  )
}
