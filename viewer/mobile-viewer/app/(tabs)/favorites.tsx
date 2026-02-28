import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Colors from '@shared/constants/colors';
import { MapPin, Trash2, Heart, User, Camera } from 'lucide-react-native';
import * as ImagePicker from "expo-image-picker";
import { useRouter } from 'expo-router';

export default function FavoritesScreen() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fetchFavorites = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const response = await api.get('/users/favorites');
            setFavorites(response.data);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, [token]);

    if (!user) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-6">
                <Text className="text-xl font-bold text-gray-800 mb-4 text-center">Login Required</Text>
                <Text className="text-gray-500 text-center mb-8">Please login to view your saved properties.</Text>
                <TouchableOpacity
                    className="bg-blue-600 px-8 py-3 rounded-lg"
                    onPress={() => router.push('/login')}
                >
                    <Text className="text-white font-bold">Sign In</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const removeFavorite = async (houseId: string) => {
        try {
            await api.post('/users/favorites/toggle', { houseId });
            setFavorites(prev => prev.filter(f => f.houseId !== houseId));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

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
                const formData = new FormData();
                formData.append('file', {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: asset.fileName || 'avatar.jpg',
                } as any);

                const response = await fetch('http://localhost:3000/upload/image', {
                    method: 'POST',
                    body: formData,
                    // Do NOT set Content-Type manually — fetch must auto-add boundary
                });

                if (!response.ok) throw new Error("Upload failed");
                const data = await response.json();

                if (data.url) {
                    setAvatarUrl(data.url);
                }
            } catch (err) {
                console.error("Upload error:", err);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const h = item.house;
        const prop = {
            id: h.id,
            title: h.name,
            address: `${h.address}, ${h.district}, ${h.city}`,
            price: h.price,
            bedrooms: h.bedrooms,
            area: h.square,
            images: [h.image_url_1, h.image_url_2, h.image_url_3].filter(Boolean)
        };

        return (
            <TouchableOpacity
                className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100 overflow-hidden"
                onPress={() => router.push(`/property/${prop.id}` as any)}
            >
                <Image source={{ uri: prop.images[0] }} className="w-full h-48" />
                <View className="p-4">
                    <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-xl font-bold text-blue-600">
                            {(prop.price / 1000000).toLocaleString('vi-VN')} triệu/tháng
                        </Text>
                        <TouchableOpacity onPress={(e) => {
                            e.stopPropagation();
                            removeFavorite(prop.id);
                        }}>
                            <Trash2 size={20} color="red" />
                        </TouchableOpacity>
                    </View>
                    <Text className="text-lg font-bold text-gray-800 mb-2 truncate" numberOfLines={1}>{prop.title}</Text>
                    <View className="flex-row items-center mb-2">
                        <MapPin size={14} color={Colors.light.textSecondary} />
                        <Text className="text-sm text-gray-500 ml-1 flex-1" numberOfLines={1}>{prop.address}</Text>
                    </View>
                    <View className="flex-row items-center pt-2 border-t border-gray-100 mt-2">
                        <View className="flex-row items-center mr-4">
                            <Text className="font-medium text-gray-700">{prop.bedrooms} N.ngủ</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Text className="font-medium text-gray-700">{prop.area} m²</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Profile Header */}
            <View className="bg-white px-6 py-6 border-b border-gray-200 flex-row items-center space-x-4 mb-4">
                <TouchableOpacity onPress={pickAvatar} disabled={isUploading} className="relative">
                    <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center overflow-hidden border-2 border-gray-100">
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                        ) : (
                            <User size={32} color={Colors.light.textSecondary} />
                        )}
                        {isUploading && (
                            <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        )}
                    </View>
                    <View className="absolute bottom-0 right-0 bg-blue-600 w-6 h-6 rounded-full items-center justify-center border-2 border-white">
                        <Camera size={12} color="#fff" />
                    </View>
                </TouchableOpacity>
                <View>
                    <Text className="text-lg font-bold text-gray-900">{user?.name || 'Người dùng'}</Text>
                    <Text className="text-gray-500 text-sm">{user?.email}</Text>
                </View>
            </View>

            <View className="flex-1 px-4">
                {favorites.length === 0 ? (
                    <View className="flex-1 items-center justify-center pb-20">
                        <Heart size={64} color={Colors.border} />
                        <Text className="text-xl font-medium text-gray-500 mt-4 text-center">No favorites yet</Text>
                        <Text className="text-gray-400 mt-2 text-center">Properties you save will appear here.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={favorites}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </View>
    );
}
