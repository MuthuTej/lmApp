import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native"
import { Link } from "expo-router"
import MaskedView from "@react-native-masked-view/masked-view"

export default function DishCard({ item, index = 0, cardWidth = 150, href, showRank, onPress }) {
  const title = item.name ?? item.dishName
  const imgSrc = item.imageUrl ?? item.image
  const description = item.description ?? ""
  const price = item.price ?? "—"
  const isAvailable = item.isAvailable ?? true

  const CardInner = (
    <TouchableOpacity
  activeOpacity={0.9}
  style={{
    width: cardWidth,
    height: 210,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,            
    borderColor: "#F5CB58",  
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginHorizontal: 6,       
    marginVertical: 8,         
  }}
  onPress={onPress}
>

      {/* IMAGE */}
      <Image source={{ uri: imgSrc }} style={{ width: "100%", height: 115 }} resizeMode="cover" />

      {/* Rank Badge */}
      {showRank && (
        <View style={{ position: "absolute", top: -5, left: -5, width: 30, height: 30, alignItems: "center", justifyContent: "center" }}>
          <MaskedView maskElement={<Text style={{ fontWeight: "bold", fontSize: 14, color: "white" }}>{index + 1}</Text>}>
            <Image source={rankingGradient} style={{ width: 30, height: 30 }} />
          </MaskedView>
        </View>
      )}

      {/* CONTENT */}
      <View style={{ padding: 8, flex: 1, justifyContent: "space-between" }}>
        <View>
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#1f2937" }} numberOfLines={1}>
            {title}
          </Text>
          {!!description && (
            <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={{ fontSize: 13, fontWeight: "bold", color: "#059669" }}>₹{price}</Text>
          {!isAvailable && <Text style={{ fontSize: 10, fontWeight: "600", color: "#dc2626" }}>Unavailable</Text>}
        </View>
      </View>
    </TouchableOpacity>
  )

  return href ? <Link href={href} asChild>{CardInner}</Link> : CardInner
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
