import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { Picker } from "@react-native-picker/picker";
import DistrictSearchInput from "./DistrictSearchInput";
import Colors from "@shared/constants/colors";
import { Property } from "@shared/types/property";
import { API_BASE_URL } from "@shared/constants/api";
// @ts-ignore
import provinceData from "@shared/data/province.json";
// @ts-ignore
import wardData from "@shared/data/ward.json";

interface EditPropertyModalProps {
    visible: boolean;
    property: Property | null;
    onClose: () => void;
    onSave: (id: string, updated: Partial<Property>) => void;
}

export default React.memo(function EditPropertyModal({
    visible,
    property,
    onClose,
    onSave,
}: EditPropertyModalProps) {
    const provinces = useMemo(() => {
        return Object.values(provinceData).map((p: any) => ({
            label: p.name,
            value: p.code,
        }));
    }, []);

    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [bedrooms, setBedrooms] = useState("1");
    const [area, setArea] = useState("");
    const [description, setDescription] = useState("");
    const [latitude, setLatitude] = useState("21.0285");
    const [longitude, setLongitude] = useState("105.8542");
    const [images, setImages] = useState<string[]>([]);
    const [selectedCityCode, setSelectedCityCode] = useState(provinces[0]?.value || "");
    const [selectedDistrictName, setSelectedDistrictName] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);

    const districts = useMemo(() => {
        if (!selectedCityCode) return [];
        return Object.values(wardData)
            .filter((w: any) => w.parent_code === selectedCityCode)
            .map((w: any) => ({ label: w.name, value: w.name }));
    }, [selectedCityCode]);

    // Pre-fill from property when modal opens
    useEffect(() => {
        if (property) {
            setTitle(property.title || "");
            setPrice(String(property.price || ""));
            setBedrooms(String(property.bedrooms || 1));
            setArea(String((property as any).area || ""));
            setDescription((property as any).description || "");
            setLatitude(String(property.latitude || "21.0285"));
            setLongitude(String(property.longitude || "105.8542"));
            setImages(property.images || []);
        }
    }, [property]);

    const uploadFile = async (
        asset: ImagePicker.ImagePickerAsset,
        type: "image" | "video"
    ): Promise<string | null> => {
        const ext = (asset.fileName || asset.uri).split('.').pop()?.toLowerCase() || (type === 'video' ? 'mp4' : 'jpg');
        const mimeMap: Record<string, string> = {
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            gif: 'image/gif', webp: 'image/webp', heic: 'image/heic',
            heif: 'image/heif', bmp: 'image/bmp', tiff: 'image/tiff',
            mp4: 'video/mp4', mov: 'video/quicktime',
        };
        const mimeType = asset.mimeType || mimeMap[ext] || (type === 'video' ? 'video/mp4' : 'image/jpeg');
        const fileName = asset.fileName || `upload.${ext}`;

        const formData = new FormData();
        if (Platform.OS === 'web') {
            // On web, ImagePicker returns blob: URLs — must fetch and wrap as File
            const blobRes = await fetch(asset.uri);
            const blob = await blobRes.blob();
            formData.append('file', new File([blob], fileName, { type: mimeType }));
        } else {
            formData.append('file', { uri: asset.uri, type: mimeType, name: fileName } as any);
        }

        const response = await fetch(`${API_BASE_URL}/upload/${type}`, {
            method: 'POST',
            body: formData,
            // No Content-Type header — fetch auto-adds it with the boundary
        });

        if (!response.ok) {
            const text = await response.text().catch(() => response.status.toString());
            throw new Error(`Upload failed (${response.status}): ${text}`);
        }
        const data = await response.json();
        return data.url || null;
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Cấp quyền", "Cần quyền truy cập thư viện ảnh.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setIsUploadingImage(true);
            try {
                const url = await uploadFile(result.assets[0], "image");
                if (url) setImages((prev) => [...prev, url]);
            } catch {
                Alert.alert("Lỗi", "Tải ảnh thất bại.");
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const pickVideo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Cấp quyền", "Cần quyền truy cập thư viện video.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            quality: 1,
        });

        if (!result.canceled && result.assets?.length > 0) {
            setIsUploadingVideo(true);
            try {
                const url = await uploadFile(result.assets[0], "video");
                if (url) setVideoUrl(url);
            } catch {
                Alert.alert("Lỗi", "Tải video thất bại.");
            } finally {
                setIsUploadingVideo(false);
            }
        }
    };

    const removeImage = useCallback((index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSave = useCallback(() => {
        if (!property || !title.trim() || !price.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ tiêu đề và giá.");
            return;
        }
        const parsedPrice = parseInt(price, 10);
        const parsedBedrooms = parseInt(bedrooms, 10);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            Alert.alert("Lỗi giá", "Giá phải là số nguyên dương.");
            return;
        }

        const cityName =
            provinces.find((p) => p.value === selectedCityCode)?.label || "";
        const addressString = [selectedDistrictName, cityName]
            .filter(Boolean)
            .join(", ");

        const updated: Partial<Property> = {
            title: title.trim(),
            address: addressString || property.address,
            price: parsedPrice,
            bedrooms: isNaN(parsedBedrooms) ? property.bedrooms : parsedBedrooms,
            images: images.length > 0 ? images : property.images,
            ...(description && { description } as any),
            ...(area && { area: parseInt(area, 10) } as any),
            ...(videoUrl && { videoUrl } as any),
        };

        onSave(property.id, updated);
        onClose();
    }, [property, title, price, bedrooms, area, description, images, videoUrl, selectedCityCode, selectedDistrictName, provinces]);

    if (!property) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.overlay}
            >
                <View style={styles.webWrapper}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Chỉnh sửa nhà</Text>
                            <Pressable onPress={onClose} style={styles.closeBtn}>
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
                                    <Text style={styles.label}>Giá (VNĐ) *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={price}
                                        onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ""))}
                                        keyboardType="numeric"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Số phòng ngủ</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={bedrooms}
                                        onChangeText={(t) => setBedrooms(t.replace(/[^0-9]/g, ""))}
                                        keyboardType="numeric"
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
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Tỉnh/Thành phố</Text>
                                    <View style={[styles.input, styles.pickerContainer]}>
                                        <Picker
                                            selectedValue={selectedCityCode}
                                            onValueChange={(val) => setSelectedCityCode(val)}
                                            style={styles.picker}
                                        >
                                            {provinces.map((p) => (
                                                <Picker.Item key={p.value} label={p.label} value={p.value} />
                                            ))}
                                        </Picker>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Phường/Xã</Text>
                                    <DistrictSearchInput
                                        options={districts}
                                        value={selectedDistrictName}
                                        onChange={setSelectedDistrictName}
                                        placeholder="Tìm phường/xã..."
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Vĩ độ</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={latitude}
                                        onChangeText={setLatitude}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Kinh độ</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={longitude}
                                        onChangeText={setLongitude}
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <Text style={styles.label}>Mô tả</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Nhập mô tả..."
                                placeholderTextColor="#9CA3AF"
                                multiline
                                textAlignVertical="top"
                            />

                            <Text style={styles.label}>Hình ảnh</Text>
                            {images.map((url, idx) => (
                                <View key={idx} style={styles.imageRow}>
                                    <Text style={styles.imageUrl} numberOfLines={1}>{url}</Text>
                                    <Pressable onPress={() => removeImage(idx)}>
                                        <Trash2 size={16} color={Colors.available} />
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable style={styles.uploadBtn} onPress={pickImage} disabled={isUploadingImage}>
                                {isUploadingImage ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <ImageIcon size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                                )}
                                <Text style={styles.uploadBtnText}>
                                    {isUploadingImage ? "Đang tải ảnh..." : "Thêm ảnh mới"}
                                </Text>
                            </Pressable>

                            <Text style={styles.label}>Video nhà</Text>
                            {videoUrl ? (
                                <View style={styles.imageRow}>
                                    <Text style={styles.imageUrl} numberOfLines={1}>{videoUrl}</Text>
                                    <Pressable onPress={() => setVideoUrl(null)}>
                                        <Trash2 size={16} color={Colors.available} />
                                    </Pressable>
                                </View>
                            ) : null}
                            <Pressable style={styles.uploadBtn} onPress={pickVideo} disabled={isUploadingVideo}>
                                {isUploadingVideo ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <Video size={20} color={Colors.primary} style={{ marginRight: 8 }} />
                                )}
                                <Text style={styles.uploadBtnText}>
                                    {isUploadingVideo ? "Đang tải video..." : "Tải video lên"}
                                </Text>
                            </Pressable>

                            <View style={{ height: 20 }} />
                        </ScrollView>

                        <Pressable style={styles.submitBtn} onPress={handleSave}>
                            <Text style={styles.submitText}>Lưu thay đổi</Text>
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
});

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: "flex-end", alignItems: "center" },
    webWrapper: { width: "100%", maxWidth: 520, alignSelf: "center" },
    container: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "92%",
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
    input: {
        backgroundColor: "#F3F4F6", borderRadius: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, color: Colors.light.text,
    },
    pickerContainer: { paddingVertical: 0, paddingHorizontal: 0, overflow: "hidden" },
    picker: {
        width: "100%",
        height: Platform.OS === "android" ? 50 : 44,
        backgroundColor: "transparent",
    },
    textArea: { minHeight: 100, paddingTop: 12 },
    row: { flexDirection: "row", gap: 12 },
    halfField: { flex: 1 },
    imageRow: {
        flexDirection: "row", alignItems: "center",
        backgroundColor: "#F3F4F6", borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6, gap: 8,
    },
    imageUrl: { flex: 1, fontSize: 12, color: Colors.light.textSecondary },
    uploadBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        backgroundColor: Colors.light.background,
        borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed",
        borderRadius: 12, paddingVertical: 14, marginTop: 8,
    },
    uploadBtnText: { color: Colors.primary, fontSize: 15, fontWeight: "600" },
    submitBtn: {
        marginHorizontal: 20, marginTop: 12,
        backgroundColor: Colors.primary, paddingVertical: 14,
        borderRadius: 14, alignItems: "center",
    },
    submitText: { color: Colors.white, fontSize: 16, fontWeight: "700" },
});
