import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { X, Trash2, Image as ImageIcon, Video } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Asset } from "expo-asset";
import { Picker } from "@react-native-picker/picker";
import DistrictSearchInput from "./DistrictSearchInput";
import Colors from "@shared/constants/colors";
import { Property, PropertyStatus } from "@shared/types/property";
import { UPLOAD_IMAGE_URL, UPLOAD_VIDEO_URL } from "@shared/constants/api";
// @ts-ignore
import provinceData from "@shared/data/province.json";
// @ts-ignore
import wardData from "@shared/data/ward.json";

interface AddPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (property: Omit<Property, "id">) => void | Promise<unknown>;
}

const MAX_IMAGES = 8;
const MAX_VIDEOS = 2;

export default React.memo(function AddPropertyModal({
  visible,
  onClose,
  onAdd,
}: AddPropertyModalProps) {
  const provinces = useMemo(() => {
    return Object.values(provinceData).map((p: any) => ({
      label: p.name,
      value: p.code,
    }));
  }, []);

  const [title, setTitle] = useState("");
  const [selectedCityCode, setSelectedCityCode] = useState(provinces[0]?.value || "");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");

  const districts = useMemo(() => {
    if (!selectedCityCode) return [];
    return Object.values(wardData)
      .filter((w: any) => w.parent_code === selectedCityCode)
      .map((w: any) => ({ label: w.name, value: w.name }));
  }, [selectedCityCode]);

  React.useEffect(() => {
    if (districts.length > 0) {
      setSelectedDistrictName(districts[0].value);
    } else {
      setSelectedDistrictName("");
    }
  }, [districts]);

  const [price, setPrice] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [specificAddress, setSpecificAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setSelectedCityCode(provinces[0]?.value || "");
    setPrice("");
    setBedrooms("1");
    setArea("");
    setDescription("");
    setSpecificAddress("");
    setContactPhone("");
    setImages([]);
    setVideos([]);
  }, [provinces]);

  const handleAdd = useCallback(async () => {
    if (!title.trim() || !price.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ tiêu đề và giá.");
      return;
    }
    const parsedPrice = parseInt(price, 10);
    const parsedBedrooms = parseInt(bedrooms, 10);
    const parsedArea = parseInt(area, 10);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Lỗi giá", "Giá phải là số nguyên dương.");
      return;
    }
    if (isNaN(parsedBedrooms) || parsedBedrooms <= 0) {
      Alert.alert("Lỗi phòng ngủ", "Số phòng ngủ phải là số nguyên dương.");
      return;
    }
    if (area !== "" && (isNaN(parsedArea) || parsedArea <= 0)) {
      Alert.alert("Lỗi diện tích", "Diện tích phải là số nguyên dương.");
      return;
    }

    const cityName = provinces.find((p) => p.value === selectedCityCode)?.label || "";
    const addressString = [specificAddress.trim(), selectedDistrictName, cityName].filter(Boolean).join(", ");

    // If no images were uploaded, use defaultimage.jpg from assets
    let finalImages = images;
    if (finalImages.length === 0) {
      try {
        // Resolve the bundled asset to a usable URI
        const asset = Asset.fromModule(require("../assets/images/defaultimage.jpg"));
        await asset.downloadAsync();
        const uri = asset.localUri || asset.uri;

        // Upload it to Cloudinary so the URL is publicly accessible
        const formData = new FormData();
        if (Platform.OS === "web") {
          const blobRes = await fetch(uri);
          const blob = await blobRes.blob();
          formData.append("file", new File([blob], "defaultimage.jpg", { type: "image/jpeg" }));
        } else {
          formData.append("file", { uri, type: "image/jpeg", name: "defaultimage.jpg" } as any);
        }
        const res = await fetch(UPLOAD_IMAGE_URL, { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalImages = [data.url];
        }
        // If upload fails, fall back to the local URI (best-effort)
        if (finalImages.length === 0) finalImages = [uri];
      } catch (e) {
        console.warn("Default image upload failed, skipping:", e);
      }
    }

    try {
      setIsSubmitting(true);
      await onAdd({
        title: title.trim(),
        address: addressString,
        price: parsedPrice,
        bedrooms: parsedBedrooms,
        area: isNaN(parsedArea) ? undefined : parsedArea,
        description: description.trim(),
        contact_phone: contactPhone || undefined,
        hasPrivateBathroom: true,
        status: "available" as PropertyStatus,
        latitude: 0,
        longitude: 0,
        images: finalImages,
      } as any);
      Alert.alert("Thành công", "Đã thêm nhà mới.");
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert("Không thể thêm nhà", error?.message || "Vui lòng kiểm tra đăng nhập/API rồi thử lại.");
      console.error("Add house error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, price, bedrooms, area, description, specificAddress, contactPhone, images, selectedCityCode, selectedDistrictName, provinces, onAdd, onClose, resetForm]);

  /**
   * Platform-aware FormData builder.
   * Web: ImagePicker returns blob: URLs — must fetch + wrap as File.
   * Native: uses React Native { uri, type, name } object format.
   */
  const buildFormData = async (
    asset: ImagePicker.ImagePickerAsset,
    mediaType: "image" | "video"
  ): Promise<FormData> => {
    const ext = (asset.fileName || asset.uri).split(".").pop()?.toLowerCase() || (mediaType === "video" ? "mp4" : "jpg");
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", heic: "image/heic",
      heif: "image/heif", bmp: "image/bmp", tiff: "image/tiff",
      mp4: "video/mp4", mov: "video/quicktime", avi: "video/x-msvideo",
    };
    const mimeType = asset.mimeType || mimeMap[ext] || (mediaType === "video" ? "video/mp4" : "image/jpeg");
    const fileName = asset.fileName || `upload.${ext}`;

    const formData = new FormData();
    if (Platform.OS === "web") {
      const blobResponse = await fetch(asset.uri);
      const blob = await blobResponse.blob();
      formData.append("file", new File([blob], fileName, { type: mimeType }));
    } else {
      formData.append("file", { uri: asset.uri, type: mimeType, name: fileName } as any);
    }
    return formData;
  };

  const pickImage = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Giới hạn ảnh", `Tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cấp quyền", "Cần quyền truy cập thư viện ảnh.");
        return;
      }
    }
    const remaining = MAX_IMAGES - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploading(true);
      try {
        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          const formData = await buildFormData(asset, "image");
          const response = await fetch(UPLOAD_IMAGE_URL, {
            method: "POST",
            body: formData,
          });
          if (!response.ok) {
            const errorText = await response.text().catch(() => response.status.toString());
            throw new Error(`Upload failed (${response.status}): ${errorText}`);
          }
          const data = await response.json();
          if (data.url) uploadedUrls.push(data.url);
        }
        setImages((prev) => [...prev, ...uploadedUrls].slice(0, MAX_IMAGES));
      } catch (err: any) {
        Alert.alert("Lỗi tải ảnh", err?.message || "Tải ảnh thất bại. Vui lòng thử lại.");
        console.error("Image upload error:", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const pickVideo = async () => {
    if (videos.length >= MAX_VIDEOS) {
      Alert.alert("Giới hạn video", `Tối đa ${MAX_VIDEOS} video.`);
      return;
    }
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cấp quyền", "Cần quyền truy cập thư viện video.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploadingVideo(true);
      try {
        const formData = await buildFormData(result.assets[0], "video");
        const response = await fetch(UPLOAD_VIDEO_URL, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text().catch(() => response.status.toString());
          throw new Error(`Upload failed (${response.status}): ${errorText}`);
        }
        const data = await response.json();
        if (data.url) setVideos((prev) => [...prev, data.url]);
      } catch (err: any) {
        Alert.alert("Lỗi tải video", err?.message || "Tải video thất bại. Vui lòng thử lại.");
        console.error("Video upload error:", err);
      } finally {
        setIsUploadingVideo(false);
      }
    }
  };

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        {/* webWrapper constrains width on mobile browsers so it's never cut off */}
        <View style={styles.webWrapper}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Thêm nhà mới</Text>
              <Pressable onPress={onClose} style={styles.closeBtn} testID="add-modal-close">
                <X size={20} color={Colors.light.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Tên căn hộ / nhà"
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Tỉnh/Thành phố *</Text>
                  <View style={[styles.input, styles.pickerContainer]}>
                    <Picker
                      selectedValue={selectedCityCode}
                      onValueChange={(val) => setSelectedCityCode(val)}
                      style={styles.picker}
                    >
                      {provinces.map((prov) => (
                        <Picker.Item key={prov.value} label={prov.label} value={prov.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Phường/Xã *</Text>
                  <DistrictSearchInput
                    options={districts}
                    value={selectedDistrictName}
                    onChange={setSelectedDistrictName}
                    placeholder="Tìm phường/xã..."
                  />
                </View>
              </View>

              <Text style={styles.label}>Địa chỉ cụ thể (Số nhà, đường...)</Text>
              <TextInput
                style={styles.input}
                value={specificAddress}
                onChangeText={setSpecificAddress}
                placeholder="VD: Số 1 ngõ 2 Nguyễn Trãi"
                placeholderTextColor="#9CA3AF"
              />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Giá (VNĐ) *</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                    placeholder="VD: 3000000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    testID="input-price"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Phòng ngủ *</Text>
                  <TextInput
                    style={styles.input}
                    value={bedrooms}
                    onChangeText={(t) => setBedrooms(t.replace(/[^0-9]/g, ""))}
                    keyboardType="numeric"
                    testID="input-bedrooms"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>Diện tích (m²)</Text>
                  <TextInput
                    style={styles.input}
                    value={area}
                    onChangeText={(t) => setArea(t.replace(/[^0-9]/g, ""))}
                    placeholder="VD: 45"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* ── Ảnh & Video merged section ── */}
              <Text style={styles.label}>
                Ảnh & Video{" "}
                <Text style={styles.mediaCount}>
                  {images.length}/{MAX_IMAGES} ảnh · {videos.length}/{MAX_VIDEOS} video
                </Text>
              </Text>

              {images.map((url, idx) => (
                <View key={`img-${idx}`} style={styles.mediaRow}>
                  <ImageIcon size={13} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.mediaUrl} numberOfLines={1}>{url}</Text>
                  <Pressable onPress={() => removeImage(idx)}>
                    <Trash2 size={15} color={Colors.available} />
                  </Pressable>
                </View>
              ))}

              {videos.map((url, idx) => (
                <View key={`vid-${idx}`} style={styles.mediaRow}>
                  <Video size={13} color={Colors.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.mediaUrl} numberOfLines={1}>{url}</Text>
                  <Pressable onPress={() => setVideos((prev) => prev.filter((_, i) => i !== idx))}>
                    <Trash2 size={15} color={Colors.available} />
                  </Pressable>
                </View>
              ))}

              <View style={styles.uploadRow}>
                {/* Photo button */}
                <Pressable
                  style={[
                    styles.uploadHalf,
                    (isUploading || images.length >= MAX_IMAGES) && styles.uploadDisabled,
                  ]}
                  onPress={pickImage}
                  disabled={isUploading || images.length >= MAX_IMAGES}
                  testID="btn-pick-image"
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <ImageIcon size={18} color={images.length >= MAX_IMAGES ? "#9CA3AF" : Colors.primary} />
                  )}
                  <Text style={[styles.uploadHalfText, images.length >= MAX_IMAGES && { color: "#9CA3AF" }]}>
                    {isUploading ? "Đang tải..." : `Ảnh (${images.length}/${MAX_IMAGES})`}
                  </Text>
                </Pressable>

                {/* Video button */}
                <Pressable
                  style={[
                    styles.uploadHalf,
                    { borderColor: Colors.accent },
                    (isUploadingVideo || videos.length >= MAX_VIDEOS) && styles.uploadDisabled,
                  ]}
                  onPress={pickVideo}
                  disabled={isUploadingVideo || videos.length >= MAX_VIDEOS}
                  testID="btn-pick-video"
                >
                  {isUploadingVideo ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <Video size={18} color={videos.length >= MAX_VIDEOS ? "#9CA3AF" : Colors.accent} />
                  )}
                  <Text style={[styles.uploadHalfText, { color: videos.length >= MAX_VIDEOS ? "#9CA3AF" : Colors.accent }]}>
                    {isUploadingVideo ? "Đang tải..." : `Video (${videos.length}/${MAX_VIDEOS})`}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập mô tả cho căn nhà..."
                placeholderTextColor="#9CA3AF"
                multiline
                textAlignVertical="top"
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            <Pressable
              style={[
                styles.submitBtn,
                (isSubmitting || isUploading || isUploadingVideo) && styles.submitBtnDisabled,
              ]}
              onPress={handleAdd}
              disabled={isSubmitting || isUploading || isUploadingVideo}
              testID="btn-submit-add"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitText}>Thêm nhà</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
    alignItems: "center",       // center the modal horizontally
  },
  webWrapper: {
    width: "100%",
    maxWidth: 520,              // cap at 520px on wide screens
    alignSelf: "center",
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center",
  },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  label: {
    fontSize: 13, fontWeight: "600",
    color: Colors.light.textSecondary, marginBottom: 6, marginTop: 12,
  },
  mediaCount: {
    fontWeight: "400",
    color: "#9CA3AF",
  },
  input: {
    backgroundColor: "#F3F4F6", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.light.text,
  },
  pickerContainer: { paddingVertical: 0, paddingHorizontal: 0, overflow: "hidden" },
  picker: {
    width: "100%",
    height: Platform.OS === "android" ? 50 : 44,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  mediaRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F3F4F6", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, gap: 6,
  },
  mediaUrl: { flex: 1, fontSize: 12, color: Colors.light.textSecondary },
  uploadRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  uploadHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.background,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
  },
  uploadHalfText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  uploadDisabled: {
    opacity: 0.45,
    borderColor: "#D1D5DB",
  },
  submitBtn: {
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: Colors.accent, paddingVertical: 14,
    borderRadius: 14, alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
