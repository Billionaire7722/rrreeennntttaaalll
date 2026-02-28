import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { X, BedDouble, Maximize, MapPin, ChevronRight } from "lucide-react-native";
import Colors from "@shared/constants/colors";
import { Property } from "@shared/types/property";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const POPUP_WIDTH = SCREEN_WIDTH - 48;
const IMAGE_HEIGHT = 180;

interface PropertyPopupProps {
  property: Property | null;
  visible: boolean;
  onClose: () => void;
  onViewDetails?: (property: Property) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} triệu`;
  }
  return price.toLocaleString("vi-VN");
}

export default React.memo(function PropertyPopup({
  property,
  visible,
  onClose,
  onViewDetails,
}: PropertyPopupProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  React.useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / POPUP_WIDTH);
      setActiveIndex(index);
    },
    []
  );

  if (!property) return null;

  const statusColor =
    property.status === "available" ? Colors.available : Colors.rented;
  const statusLabel =
    property.status === "available" ? "Đang cho thuê" : "Đã thuê";

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable onPress={() => { }} style={styles.card}>
            <View style={styles.imageContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={styles.imageScroller}
              >
                {property.images.map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                  />
                ))}
              </ScrollView>

              <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>

              <Pressable style={styles.closeBtn} onPress={onClose} testID="popup-close">
                <X size={18} color={Colors.light.text} />
              </Pressable>

              {property.images.length > 1 && (
                <View style={styles.dots}>
                  {property.images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === activeIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.info}>
              <Text style={styles.price}>
                {formatPrice(property.price)} VNĐ
                <Text style={styles.priceUnit}>/tháng</Text>
              </Text>

              <View style={styles.tags}>
                <View style={styles.tag}>
                  <BedDouble size={14} color={Colors.primary} />
                  <Text style={styles.tagText}>{property.bedrooms} PN</Text>
                </View>
                <View style={styles.tag}>
                  <Maximize size={14} color={Colors.primary} />
                  <Text style={styles.tagText}>
                    {property.area ? `${property.area} m²` : "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              <View style={styles.addressRow}>
                <MapPin size={13} color={Colors.light.textSecondary} />
                <Text style={styles.address} numberOfLines={1}>
                  {property.address}
                </Text>
              </View>

              {property.description ? (
                <Text style={styles.description} numberOfLines={2}>
                  {property.description}
                </Text>
              ) : null}

              <Pressable
                style={styles.detailBtn}
                onPress={() => onViewDetails?.(property)}
                testID="popup-view-details"
              >
                <Text style={styles.detailBtnText}>Xem chi tiết</Text>
                <ChevronRight size={16} color={Colors.white} />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: Colors.overlay,
    paddingBottom: 40,
  },
  container: {
    width: POPUP_WIDTH,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  imageContainer: {
    position: "relative" as const,
  },
  imageScroller: {
    width: POPUP_WIDTH,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: POPUP_WIDTH,
    height: IMAGE_HEIGHT,
  },
  statusBadge: {
    position: "absolute" as const,
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  closeBtn: {
    position: "absolute" as const,
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  dots: {
    position: "absolute" as const,
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row" as const,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 18,
  },
  info: {
    padding: 16,
  },
  price: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.accent,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: "400" as const,
    color: Colors.light.textSecondary,
  },
  tags: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 10,
  },
  tag: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    backgroundColor: "#EEF2F7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  addressRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 10,
  },
  address: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 8,
    lineHeight: 18,
  },
  detailBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    gap: 4,
  },
  detailBtnText: {
    color: Colors.white,
    fontWeight: "700" as const,
    fontSize: 14,
  },
});
