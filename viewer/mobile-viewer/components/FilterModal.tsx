import React, { useState, useEffect } from "react";
import { View, Text, Modal, StyleSheet, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { X, ChevronDown } from "lucide-react-native";
import Colors from "@shared/constants/colors";
import { useProperties, FilterOptions } from "../contexts/PropertyContext";
import { Picker } from "@react-native-picker/picker";

interface Props {
    visible: boolean;
    onClose: () => void;
}

const PROVINCES_DATA = require("@shared/data/province.json");
const WARDS_DATA = require("@shared/data/ward.json");

export default function FilterModal({ visible, onClose }: Props) {
    const { filters, setFilters, DEFAULT_FILTERS } = useProperties();
    const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

    // Convert object to array for easier mapping (preserve original order)
    const provincesList = Object.values(PROVINCES_DATA) as any[];

    // When the selected province changes, find its code to filter wards
    const selectedProvinceCode = provincesList.find(p => p.name === localFilters.province)?.code;
    const wardsList = (Object.values(WARDS_DATA) as any[])
        .filter(w => w.parent_code === selectedProvinceCode);

    useEffect(() => {
        if (visible) {
            setLocalFilters(filters);
        }
    }, [visible, filters]);

    const handleApply = () => {
        setFilters(localFilters);
        onClose();
    };

    const handleReset = () => {
        setLocalFilters(DEFAULT_FILTERS);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Bộ lọc nâng cao</Text>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={Colors.light.text} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.body} contentContainerStyle={{ padding: 16, gap: 24 }}>


                        {/* Price Range */}
                        <View>
                            <Text style={styles.sectionTitle}>Mức giá (VNĐ)</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Từ..."
                                    placeholderTextColor={Colors.light.textSecondary}
                                    keyboardType="numeric"
                                    value={localFilters.minPrice !== null ? localFilters.minPrice.toString() : ""}
                                    onChangeText={(val) => {
                                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                                        setLocalFilters(p => ({ ...p, minPrice: isNaN(parsed) ? null : parsed }));
                                    }}
                                />
                                <Text style={{ marginHorizontal: 8 }}>-</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Đến..."
                                    placeholderTextColor={Colors.light.textSecondary}
                                    keyboardType="numeric"
                                    value={localFilters.maxPrice !== null ? localFilters.maxPrice.toString() : ""}
                                    onChangeText={(val) => {
                                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                                        setLocalFilters(p => ({ ...p, maxPrice: isNaN(parsed) ? null : parsed }));
                                    }}
                                />
                            </View>
                        </View>

                        {/* Area (Provinces and Wards Dropdowns) */}
                        <View>
                            <Text style={styles.sectionTitle}>Khu vực</Text>
                            <View style={{ gap: 12 }}>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={localFilters.province || ""}
                                        onValueChange={(itemValue) =>
                                            setLocalFilters(prev => ({
                                                ...prev,
                                                province: itemValue || null,
                                                ward: null // reset ward when province changes
                                            }))
                                        }
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Tỉnh / Thành phố" value="" color={Colors.light.textSecondary} />
                                        {provincesList.map(p => (
                                            <Picker.Item key={p.code} label={p.name} value={p.name} />
                                        ))}
                                    </Picker>
                                </View>
                                <View style={styles.pickerContainer}>
                                    <Picker
                                        selectedValue={localFilters.ward || ""}
                                        onValueChange={(itemValue) =>
                                            setLocalFilters(prev => ({
                                                ...prev,
                                                ward: itemValue || null
                                            }))
                                        }
                                        style={styles.picker}
                                        enabled={!!localFilters.province} // disabled until a province is chosen
                                    >
                                        <Picker.Item label="Quận / Huyện" value="" color={Colors.light.textSecondary} />
                                        {wardsList.map(w => (
                                            <Picker.Item key={w.code} label={w.name} value={w.name} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>
                        </View>

                        {/* Bedrooms */}
                        <View>
                            <Text style={styles.sectionTitle}>Số phòng ngủ tối thiểu</Text>
                            <View style={styles.row}>
                                {[1, 2, 3, 4].map(n => (
                                    <Pressable
                                        key={n}
                                        style={[styles.chip, localFilters.minBedrooms === n && styles.chipActive]}
                                        onPress={() => setLocalFilters(p => ({ ...p, minBedrooms: p.minBedrooms === n ? null : n }))}
                                    >
                                        <Text style={[styles.chipText, localFilters.minBedrooms === n && styles.chipTextActive]}>{n}+</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Room Area */}
                        <View>
                            <Text style={styles.sectionTitle}>Diện tích phòng (m2)</Text>
                            <View style={styles.row}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Từ..."
                                    placeholderTextColor={Colors.light.textSecondary}
                                    keyboardType="numeric"
                                    value={localFilters.minArea !== null ? localFilters.minArea.toString() : ""}
                                    onChangeText={(val) => {
                                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                                        setLocalFilters(p => ({ ...p, minArea: isNaN(parsed) ? null : parsed }));
                                    }}
                                />
                                <Text style={{ marginHorizontal: 8 }}>-</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Đến..."
                                    placeholderTextColor={Colors.light.textSecondary}
                                    keyboardType="numeric"
                                    value={localFilters.maxArea !== null ? localFilters.maxArea.toString() : ""}
                                    onChangeText={(val) => {
                                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
                                        setLocalFilters(p => ({ ...p, maxArea: isNaN(parsed) ? null : parsed }));
                                    }}
                                />
                            </View>
                        </View>

                        {/* Bathroom */}
                        <View>
                            <Text style={styles.sectionTitle}>Loại phòng</Text>
                            <View style={styles.row}>
                                <Pressable
                                    style={[styles.chip, localFilters.bathroomType === "khép kín" && styles.chipActive]}
                                    onPress={() => setLocalFilters(p => ({ ...p, bathroomType: p.bathroomType === "khép kín" ? null : "khép kín" }))}
                                >
                                    <Text style={[styles.chipText, localFilters.bathroomType === "khép kín" && styles.chipTextActive]}>Khép kín</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.chip, localFilters.bathroomType === "chung" && styles.chipActive]}
                                    onPress={() => setLocalFilters(p => ({ ...p, bathroomType: p.bathroomType === "chung" ? null : "chung" }))}
                                >
                                    <Text style={[styles.chipText, localFilters.bathroomType === "chung" && styles.chipTextActive]}>Chung</Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Status */}
                        <View style={{ marginBottom: 40 }}>
                            <Text style={styles.sectionTitle}>Trạng thái</Text>
                            <View style={styles.row}>
                                <Pressable
                                    style={[styles.chip, localFilters.status === "available" && styles.chipActive]}
                                    onPress={() => setLocalFilters(p => ({ ...p, status: p.status === "available" ? null : "available" }))}
                                >
                                    <Text style={[styles.chipText, localFilters.status === "available" && styles.chipTextActive]}>Cho thuê</Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.chip, localFilters.status === "rented" && styles.chipActive]}
                                    onPress={() => setLocalFilters(p => ({ ...p, status: p.status === "rented" ? null : "rented" }))}
                                >
                                    <Text style={[styles.chipText, localFilters.status === "rented" && styles.chipTextActive]}>Đã thuê</Text>
                                </Pressable>
                            </View>
                        </View>
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable style={styles.resetBtn} onPress={handleReset}>
                            <Text style={styles.resetBtnText}>Đặt lại</Text>
                        </Pressable>
                        <Pressable style={styles.applyBtn} onPress={handleApply}>
                            <Text style={styles.applyBtnText}>Áp dụng</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    closeBtn: {
        padding: 4,
    },
    body: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.light.text,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    wrapRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.light.background,
    },
    chipActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    chipText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
        fontWeight: '500',
    },
    chipTextActive: {
        color: Colors.white,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: Colors.light.text,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: Colors.light.background,
    },
    picker: {
        height: 50,
        width: '100%',
        color: Colors.light.text,
    },
    footer: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: 12,
    },
    resetBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    resetBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.textSecondary,
    },
    applyBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: 'center',
    },
    applyBtnText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.white,
    },
});
