import { Tabs, useRouter } from "expo-router";
import { Map, Search, MapPin, Filter, Heart, MessageCircle, LogOut } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import Colors from "@shared/constants/colors";
import { View, Text, Pressable, Platform, TextInput, FlatList, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperties } from "../../contexts/PropertyContext";
import { useAuth } from "../../contexts/AuthContext";
import FilterModal from "../../components/FilterModal";

function CustomHeader() {
    const insets = useSafeAreaInsets();
    const { filteredProperties, setFilters } = useProperties();
    const { user, signOut } = useAuth();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    const handleLogout = async () => {
        await signOut();
        router.replace('/login');
    };

    return (
        <View style={{ zIndex: 50 }}>
            {/* Header Container */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10,
                paddingBottom: 12,
                backgroundColor: Colors.white,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
            }}>
                {/* Left: User Greeting */}
                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.light.text }} numberOfLines={1}>
                        👋 {user?.name?.split(' ')[0] || 'User'}
                    </Text>
                </View>

                {/* Center: Search Bar & Filter */}
                <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: 400 }}>
                    <View style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: Colors.light.background,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        height: 36,
                    }}>
                        <Search size={16} color={Colors.light.textSecondary} />
                        <TextInput
                            style={{ flex: 1, marginLeft: 8, fontSize: 14, color: Colors.light.text, height: '100%', outlineStyle: 'none' } as any}
                            placeholder="Tìm kiếm nhà thuê..."
                            placeholderTextColor={Colors.light.textSecondary}
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                setFilters((p: any) => ({ ...p, searchQuery: text }));
                                setShowDropdown(text.length > 0);
                            }}
                            onFocus={() => setShowDropdown(searchQuery.length > 0)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        />
                    </View>

                    <Pressable
                        style={{
                            backgroundColor: Colors.primary,
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Filter size={18} color={Colors.white} />
                    </Pressable>
                </View>

                {/* Right: Logout */}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Pressable onPress={handleLogout}>
                        <LogOut size={18} color={Colors.light.textSecondary} />
                    </Pressable>
                </View>
            </View>

            {/* Dropdown Results */}
            {showDropdown && filteredProperties.length > 0 && (
                <View style={{
                    position: 'absolute',
                    top: '100%',
                    left: 16,
                    right: 16,
                    backgroundColor: Colors.white,
                    borderRadius: 8,
                    maxHeight: 300,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 5,
                    zIndex: 100,
                    marginTop: 4,
                    borderWidth: 1,
                    borderColor: Colors.border,
                }}>
                    <FlatList
                        data={filteredProperties.slice(0, 10)}
                        keyExtractor={(item) => item.id}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                            <Pressable
                                style={{
                                    flexDirection: 'row',
                                    padding: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: Colors.light.background,
                                    alignItems: 'center',
                                    gap: 12,
                                }}
                                onPress={() => {
                                    setShowDropdown(false);
                                    setSearchQuery("");
                                    router.push(`/property/${item.id}` as any);
                                }}
                            >
                                <Image source={{ uri: item.images[0] }} style={{ width: 40, height: 40, borderRadius: 6 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text }} numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                                        <MapPin size={12} color={Colors.light.textSecondary} />
                                        <Text style={{ fontSize: 12, color: Colors.light.textSecondary, marginLeft: 4 }} numberOfLines={1}>
                                            {item.address}
                                        </Text>
                                    </View>
                                </View>
                            </Pressable>
                        )}
                    />
                </View>
            )}

            {/* Filter Modal Overlay */}
            <FilterModal visible={showFilterModal} onClose={() => setShowFilterModal(false)} />
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                header: () => <CustomHeader />,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.light.tabIconDefault,
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600" as const,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Bản đồ",
                    tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: "Yêu thích",
                    tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: "Tin nhắn",
                    tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
