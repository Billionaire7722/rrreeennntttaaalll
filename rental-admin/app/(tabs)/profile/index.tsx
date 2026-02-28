import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  Plus,
  Trash2,
  RefreshCw,
  BedDouble,
  MapPin,
  User,
  Camera,
  Pencil,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import Colors from "@shared/constants/colors";
import { useProperties } from "@/contexts/PropertyContext";
import { useAuth } from "@/contexts/AuthContext";
import { Property } from "@shared/types/property";
import AddPropertyModal from "@/components/AddPropertyModal";
import EditPropertyModal from "@/components/EditPropertyModal";
import { useRouter } from "expo-router";
import { UPLOAD_IMAGE_URL } from "@shared/constants/api";

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { properties, addProperty, removeProperty, updateStatus, updateProperty } = useProperties();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Cần quyền truy cập ảnh!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploading(true);
      try {
        const asset = result.assets[0];
        const mimeType = asset.mimeType || 'image/jpeg';
        const fileName = asset.fileName || 'avatar.jpg';

        const formData = new FormData();
        if (Platform.OS === 'web') {
          // On web, ImagePicker returns blob: URLs — must fetch and wrap as File
          const blobRes = await fetch(asset.uri);
          const blob = await blobRes.blob();
          formData.append('file', new File([blob], fileName, { type: mimeType }));
        } else {
          formData.append('file', { uri: asset.uri, type: mimeType, name: fileName } as any);
        }

        const response = await fetch(UPLOAD_IMAGE_URL, {
          method: 'POST',
          body: formData,
          // No Content-Type header — fetch auto-adds it with the boundary
        });

        if (!response.ok) throw new Error("Upload failed");
        const data = await response.json();

        if (data.url) {
          setAvatarUrl(data.url);
        }
      } catch (err) {
        console.error("Upload error:", err);
        Alert.alert("Lỗi", "Không thể tải lên ảnh đại diện.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleEdit = useCallback((property: Property) => {
    setSelectedProperty(property);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(
    (property: Property) => {
      Alert.alert(
        "Xóa nhà",
        `Bạn có chắc muốn xóa "${property.title}"?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xóa",
            style: "destructive",
            onPress: () => {
              console.log("[Admin] Deleting property:", property.id);
              removeProperty(property.id);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
          },
        ]
      );
    },
    [removeProperty]
  );

  const handleToggleStatus = useCallback(
    (property: Property) => {
      const newStatus = property.status === "available" ? "rented" : "available";
      console.log("[Admin] Toggling status:", property.id, "->", newStatus);
      updateStatus(property.id, newStatus);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    [updateStatus]
  );

  const renderItem = useCallback(
    ({ item }: { item: Property }) => {
      const statusColor =
        item.status === "available" ? Colors.available : Colors.rented;
      const statusLabel =
        item.status === "available" ? "Cho thuê" : "Đã thuê";

      return (
        <Pressable
          style={styles.card}
          testID={`admin-card-${item.id}`}
          onPress={() => router.push(`/property/${item.id}` as any)}
        >
          <Image
            source={{ uri: item.images[0] }}
            style={styles.cardImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={styles.editBtn}
                  onPress={() => handleEdit(item)}
                  testID={`btn-edit-${item.id}`}
                >
                  <Pencil size={14} color={Colors.primary} />
                </Pressable>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item)}
                  testID={`btn-delete-${item.id}`}
                >
                  <Trash2 size={14} color={Colors.available} />
                </Pressable>
              </View>
            </View>

            <View style={styles.cardMeta}>
              <MapPin size={12} color={Colors.light.textSecondary} />
              <Text style={styles.cardAddress} numberOfLines={1}>
                {item.address}
              </Text>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardPrice}>
                  {(item.price / 1000000).toFixed(1)}tr
                </Text>
                <View style={styles.cardBedrooms}>
                  <BedDouble size={12} color={Colors.primary} />
                  <Text style={styles.bedroomText}>{item.bedrooms}</Text>
                </View>
              </View>

              <Pressable
                style={[styles.statusBtn, { backgroundColor: statusColor }]}
                onPress={() => handleToggleStatus(item)}
                testID={`btn-toggle-${item.id}`}
              >
                <RefreshCw size={12} color={Colors.white} />
                <Text style={styles.statusBtnText}>{statusLabel}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      );
    },
    [handleDelete, handleToggleStatus]
  );

  const keyExtractor = useCallback((item: Property) => item.id, []);

  const availableCount = properties.filter((p) => p.status === "available").length;
  const rentedCount = properties.filter((p) => p.status === "rented").length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={pickAvatar} disabled={isUploading} style={{ position: 'relative' }}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <User size={32} color={Colors.light.textSecondary} />
            )}
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.cameraIcon}>
            <Camera size={12} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={{ marginLeft: 16 }}>
          <Text style={styles.profileName}>{user?.name || 'Admin Davik'}</Text>
          {/* @ts-ignore */}
          <Text style={styles.profileEmail}>{(user as any)?.email || 'davik@admin.com'}</Text>
        </View>
      </View>

      <View style={styles.listHeader}>
        <View>
          <Text style={styles.headerTitle}>Quản lý nhà</Text>
          <Text style={styles.headerSub}>
            {availableCount} cho thuê · {rentedCount} đã thuê
          </Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddModal(true)}
          testID="btn-open-add"
        >
          <Plus size={16} color={Colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Thêm nhà mới</Text>
        </Pressable>
      </View>

      <FlatList
        data={properties}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        testID="admin-list"
      />

      <AddPropertyModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addProperty}
      />

      <EditPropertyModal
        visible={showEditModal}
        property={selectedProperty}
        onClose={() => { setShowEditModal(false); setSelectedProperty(null); }}
        onSave={updateProperty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  listHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: "700" as const,
    fontSize: 14,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    flexDirection: "row" as const,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: 100,
    height: 110,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between" as const,
  },
  cardHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  editBtn: {
    padding: 4,
    backgroundColor: '#EEF2F7',
    borderRadius: 6,
  },
  deleteBtn: {
    padding: 4,
  },
  cardMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 4,
  },
  cardAddress: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 6,
  },
  cardInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: Colors.accent,
  },
  cardBedrooms: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    backgroundColor: "#EEF2F7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bedroomText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  statusBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
