/**
 * DistrictSearchInput — searchable combobox for Phường/Xã (ward/commune).
 *
 * The dropdown renders inside a transparent Modal so it truly overlays all
 * content below it, regardless of ScrollView or parent overflow settings.
 * Position is determined by measuring the trigger button on screen.
 */

import React, { useState, useMemo, useRef, useCallback } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    Modal,
    ViewStyle,
    Dimensions,
} from "react-native";
import { ChevronDown, X as ClearIcon, Search } from "lucide-react-native";
import Colors from "@shared/constants/colors";

interface DistrictOption {
    label: string;
    value: string;
}

interface DistrictSearchInputProps {
    options: DistrictOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    containerStyle?: ViewStyle;
}

/** Max list items shown before vertical scroll inside the dropdown */
const MAX_VISIBLE = 6;
const ITEM_HEIGHT = 42;
const SCREEN = Dimensions.get("window");

export default function DistrictSearchInput({
    options,
    value,
    onChange,
    placeholder = "Tìm phường/xã...",
    containerStyle,
}: DistrictSearchInputProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    /** Measured position of the trigger on screen */
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0, width: 0 });
    const triggerRef = useRef<View>(null);
    const inputRef = useRef<TextInput>(null);

    const selectedLabel = useMemo(
        () => options.find((o) => o.value === value)?.label ?? "",
        [options, value]
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, query]);

    const dropdownHeight = Math.min(filtered.length || 1, MAX_VISIBLE) * ITEM_HEIGHT + 2;

    const handleOpen = () => {
        // Measure position of the trigger button so we can absolutely-place the dropdown
        triggerRef.current?.measureInWindow((x, y, width, height) => {
            setDropdownPos({ x, y: y + height, width });
            setQuery("");
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 80);
        });
    };

    const handleSelect = useCallback(
        (option: DistrictOption) => {
            onChange(option.value);
            setQuery("");
            setOpen(false);
        },
        [onChange]
    );

    const handleClose = () => {
        setQuery("");
        setOpen(false);
    };

    // Clamp dropdown so it doesn't fall off the bottom of the screen
    const dropdownTop = Math.min(
        dropdownPos.y,
        SCREEN.height - dropdownHeight - 20
    );

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {/* ── Trigger ── */}
            <Pressable ref={triggerRef as any} style={styles.trigger} onPress={handleOpen}>
                <Text
                    style={[styles.triggerText, !selectedLabel && styles.placeholder]}
                    numberOfLines={1}
                >
                    {selectedLabel || placeholder}
                </Text>
                <ChevronDown size={16} color="#9CA3AF" />
            </Pressable>

            {/* ── Overlay dropdown via transparent Modal ── */}
            <Modal
                visible={open}
                transparent
                animationType="none"
                onRequestClose={handleClose}
                statusBarTranslucent
            >
                {/* Full-screen backdrop — tap outside to close */}
                <Pressable style={styles.backdrop} onPress={handleClose}>
                    {/* Stop propagation so taps inside dropdown don't close it */}
                    <Pressable
                        style={[
                            styles.dropdown,
                            {
                                position: "absolute",
                                left: dropdownPos.x,
                                top: dropdownTop,
                                width: dropdownPos.width,
                                height: dropdownHeight,
                            },
                        ]}
                        onPress={() => { }}
                    >
                        {/* Search row */}
                        <View style={styles.searchRow}>
                            <Search size={14} color="#9CA3AF" />
                            <TextInput
                                ref={inputRef}
                                style={styles.searchInput}
                                value={query}
                                onChangeText={setQuery}
                                placeholder={placeholder}
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={handleClose}
                            />
                            {query.length > 0 && (
                                <Pressable onPress={() => setQuery("")}>
                                    <ClearIcon size={14} color="#9CA3AF" />
                                </Pressable>
                            )}
                        </View>

                        {/* Options list */}
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={filtered.length > MAX_VISIBLE}
                            bounces={false}
                        >
                            {filtered.length === 0 ? (
                                <View style={styles.emptyItem}>
                                    <Text style={styles.emptyText}>Không tìm thấy kết quả</Text>
                                </View>
                            ) : (
                                filtered.map((option) => (
                                    <Pressable
                                        key={option.value}
                                        style={[
                                            styles.item,
                                            option.value === value && styles.itemSelected,
                                        ]}
                                        onPress={() => handleSelect(option)}
                                    >
                                        <Text
                                            style={[
                                                styles.itemText,
                                                option.value === value && styles.itemTextSelected,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))
                            )}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {},
    trigger: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 6,
    },
    triggerText: {
        flex: 1,
        fontSize: 15,
        color: Colors.light.text,
    },
    placeholder: {
        color: "#9CA3AF",
    },
    backdrop: {
        flex: 1,
    },
    dropdown: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 12,
        elevation: 16,
        overflow: "hidden",
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.light.text,
        padding: 0,
        margin: 0,
    },
    item: {
        height: ITEM_HEIGHT,
        justifyContent: "center",
        paddingHorizontal: 14,
    },
    itemSelected: {
        backgroundColor: "#EEF2FF",
    },
    itemText: {
        fontSize: 14,
        color: Colors.light.text,
    },
    itemTextSelected: {
        color: Colors.primary,
        fontWeight: "600",
    },
    emptyItem: {
        height: ITEM_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 13,
        color: "#9CA3AF",
    },
});
