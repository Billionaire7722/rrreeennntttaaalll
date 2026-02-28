import { Tabs, useRouter } from "expo-router";
import { Map, Shield, LogOut, Search, MapPin, Filter, User } from "lucide-react-native";
import React, { useState } from "react";
import Colors from "@shared/constants/colors";
import { View, Text, Pressable, Platform, TextInput, FlatList, Image } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProperties } from "@/contexts/PropertyContext";
import FilterModal from "@/components/FilterModal";

function CustomHeader() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { filteredProperties, setFilters } = useProperties();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

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
          <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.light.text }} numberOfLines={1}>
            hello {user?.isAdmin ? 'davik' : (user?.name?.split(' ')[0] || 'user')}
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
              placeholder="Tìm kiếm..."
              placeholderTextColor={Colors.light.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setFilters(p => ({ ...p, searchQuery: text }));
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
          <Pressable onPress={logout}>
            <LogOut size={20} color={Colors.light.textSecondary} />
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
            data={filteredProperties.slice(0, 10)} // limit results
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
                  router.push(`/property/${item.id}`);
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
        name="(map)"
        options={{
          title: "Bản đồ",
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
