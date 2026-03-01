import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, BedDouble, Bath, Home, Share, Heart, Expand, X } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Colors from '@shared/constants/colors';
import { useProperties } from '../../contexts/PropertyContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 280;

function formatPrice(price: number): string {
    if (price >= 1000000) {
        const millions = price / 1000000;
        return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)} triá»‡u`;
    }
    return price.toLocaleString('vi-VN');
}

function getInitials(name: string): string {
    return (name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');
}

export default function PropertyDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { properties, isLoading } = useProperties();
    const insets = useSafeAreaInsets();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [fullScreenIndex, setFullScreenIndex] = useState(0);

    const property = properties.find((p) => p.id === id);

    const { user, token } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const checkFavorite = async () => {
            if (!token || !property) return;
            try {
                const response = await api.get('/users/favorites');
                const favorites = response.data;
                const isFav = favorites.some((f: any) => f.houseId === property.id);
                setIsFavorite(isFav);
            } catch (error) {
                console.error("Error checking favorite status", error);
            }
        };
        checkFavorite();
    }, [token, property]);

    const handleToggleFavorite = async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        try {
            setIsFavorite(!isFavorite);
            await api.post('/users/favorites/toggle', { houseId: property?.id });
        } catch (error) {
            setIsFavorite(isFavorite);
            console.error("Error toggling favorite", error);
        }
    };

    const scrollRef = useRef<ScrollView>(null);
    const fullScreenScrollRef = useRef<ScrollView>(null);

    const openFullScreen = (index: number) => {
        setFullScreenIndex(index);
        setIsFullScreen(true);
        setTimeout(() => {
            fullScreenScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false });
        }, 50);
    };

    const closeFullScreen = () => {
        setIsFullScreen(false);
        setActiveImageIndex(fullScreenIndex);
        scrollRef.current?.scrollTo({ x: fullScreenIndex * SCREEN_WIDTH, animated: false });
    };

    const handleFullScreenScroll = (e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setFullScreenIndex(index);
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Äang táº£i...</Text>
            </View>
        );
    }
    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ marginBottom: 14 }}>Please sign in to view property details.</Text>
                <Pressable onPress={() => router.replace('/login')} style={styles.backButtonFallback}>
                    <Text style={styles.backButtonText}>Go to login</Text>
                </Pressable>
            </View>
        );
    }
    if (!property) {
        return (
            <View style={styles.loadingContainer}>
                <Text>KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin nhÃ .</Text>
                <Pressable onPress={() => router.back()} style={styles.backButtonFallback}>
                    <Text style={styles.backButtonText}>Quay láº¡i</Text>
                </Pressable>
            </View>
        );
    }

    const handleScroll = (e: any) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveImageIndex(index);
    };

    const statusColor = property.status === 'available' ? Colors.available : Colors.rented;
    const statusLabel = property.status === 'available' ? 'Äang cho thuÃª' : 'ÄÃ£ thuÃª';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView bounces={false} style={styles.scrollView}>
                <View style={styles.imageContainer}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleScroll}
                        style={styles.imageScroller}
                    >
                        {property.images.map((uri, idx) => (
                            <Pressable key={idx} onPress={() => openFullScreen(idx)}>
                                <Image
                                    source={{ uri }}
                                    style={styles.image}
                                    contentFit="cover"
                                    transition={200}
                                />
                            </Pressable>
                        ))}
                    </ScrollView>

                    <View style={[styles.headerActions, { top: Math.max(insets.top, 20) }]}>
                        <Pressable style={styles.iconButton} onPress={() => router.back()}>
                            <ChevronLeft size={24} color={Colors.light.text} />
                        </Pressable>
                        <View style={styles.headerRightActions}>
                            <Pressable style={styles.iconButton}>
                                <Share size={20} color={Colors.light.text} />
                            </Pressable>
                            <Pressable style={styles.iconButton} onPress={handleToggleFavorite}>
                                <Heart size={20} color={isFavorite ? 'red' : Colors.light.text} fill={isFavorite ? 'red' : 'transparent'} />
                            </Pressable>
                        </View>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusText}>{statusLabel}</Text>
                    </View>

                    {property.images.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {property.images.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.dot,
                                        idx === activeImageIndex && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>
                            {formatPrice(property.price)} VNÄ<Text style={styles.priceUnit}>/thÃ¡ng</Text>
                        </Text>
                    </View>

                    <Text style={styles.title}>{property.title}</Text>

                    <View style={styles.addressRow}>
                        <MapPin size={16} color={Colors.light.textSecondary} />
                        <Text style={styles.address}>{property.address}</Text>
                    </View>

                    {!!property.postedByAdmins?.length && (
                        <View style={styles.postedBySection}>
                            <Text style={styles.postedByTitle}>Đăng bởi</Text>
                            <View style={styles.posterRow}>
                                {property.postedByAdmins.map((admin) => (
                                    <View key={admin.id} style={styles.posterChip}>
                                        {admin.avatarUrl ? (
                                            <Image source={{ uri: admin.avatarUrl }} style={styles.posterAvatar} contentFit="cover" />
                                        ) : (
                                            <View style={styles.posterAvatarFallback}>
                                                <Text style={styles.posterAvatarFallbackText}>{getInitials(admin.name)}</Text>
                                            </View>
                                        )}
                                        <Text style={styles.posterName}>{admin.name}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={styles.divider} />

                    <View style={styles.featuresRow}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <BedDouble size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.featureValue}>{property.bedrooms}</Text>
                            <Text style={styles.featureLabel}>PhÃ²ng ngá»§</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Bath size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.featureValue}>{property.hasPrivateBathroom ? 'KhÃ©p kÃ­n' : 'Chung'}</Text>
                            <Text style={styles.featureLabel}>PhÃ²ng táº¯m</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Home size={20} color={Colors.primary} />
                            </View>
                            <Text style={styles.featureValue}>Cáº­p nháº­t</Text>
                            <Text style={styles.featureLabel}>TÃ¬nh tráº¡ng</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>MÃ´ táº£ chi tiáº¿t</Text>
                    <Text style={styles.description}>
                        {property.description || "ChÆ°a cÃ³ mÃ´ táº£ chi tiáº¿t."}
                    </Text>
                </View>
                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <Pressable style={styles.contactButton}>
                    <Text style={styles.contactButtonText}>LiÃªn há»‡ ngay</Text>
                </Pressable>
            </View>

            <Modal visible={isFullScreen} transparent animationType="fade" onRequestClose={closeFullScreen}>
                <View style={styles.fullScreenContainer}>
                    <Pressable style={styles.fullScreenCloseButton} onPress={closeFullScreen}>
                        <X size={24} color={Colors.white} />
                    </Pressable>
                    <ScrollView
                        ref={fullScreenScrollRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleFullScreenScroll}
                        style={styles.fullScreenScroller}
                    >
                        {property.images.map((uri, idx) => (
                            <Pressable
                                key={idx}
                                style={styles.fullScreenImageWrapper}
                                onPress={closeFullScreen}
                            >
                                <Image
                                    source={{ uri }}
                                    style={styles.fullScreenImage}
                                    contentFit="contain"
                                    transition={200}
                                />
                            </Pressable>
                        ))}
                    </ScrollView>
                    {property.images.length > 1 && (
                        <View style={styles.fullScreenDotsContainer}>
                            {property.images.map((_, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.dot,
                                        idx === fullScreenIndex && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    imageContainer: { position: 'relative', height: IMAGE_HEIGHT },
    imageScroller: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
    image: { width: SCREEN_WIDTH, height: IMAGE_HEIGHT },
    headerActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerRightActions: { flexDirection: 'row', gap: 12 },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    statusBadge: { position: 'absolute', bottom: 20, left: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    statusText: { color: Colors.white, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
    dotsContainer: { position: 'absolute', bottom: 20, right: 16, flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
    dotActive: { backgroundColor: Colors.white, width: 14 },
    detailsContainer: { padding: 20 },
    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    price: { fontSize: 26, fontWeight: '800', color: Colors.accent },
    priceUnit: { fontSize: 14, fontWeight: '500', color: Colors.light.textSecondary },
    title: { fontSize: 22, fontWeight: '700', color: Colors.light.text, marginBottom: 12, lineHeight: 30 },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    address: { fontSize: 15, color: Colors.light.textSecondary, flex: 1, lineHeight: 22 },
    postedBySection: { marginTop: 14 },
    postedByTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
    posterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    posterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: '#F8FAFC',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    posterAvatar: { width: 24, height: 24, borderRadius: 12 },
    posterAvatarFallback: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
    posterAvatarFallbackText: { fontSize: 10, fontWeight: '700', color: '#1D4ED8' },
    posterName: { fontSize: 12, color: Colors.light.text, fontWeight: '600' },
    divider: { height: 1, backgroundColor: Colors.border, marginVertical: 24 },
    featuresRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
    featureItem: { alignItems: 'center', gap: 8 },
    featureIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#EEF2F7', justifyContent: 'center', alignItems: 'center' },
    featureValue: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
    featureLabel: { fontSize: 13, color: Colors.light.textSecondary },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
    description: { fontSize: 15, lineHeight: 24, color: Colors.light.textSecondary },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 8 },
    contactButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    contactButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
    backButtonFallback: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 8 },
    backButtonText: { color: Colors.white, fontWeight: '600' },
    fullScreenContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
    fullScreenScroller: { flex: 1 },
    fullScreenImageWrapper: { width: SCREEN_WIDTH, flex: 1, justifyContent: 'center', alignItems: 'center' },
    fullScreenImage: { width: '100%', height: '80%' },
    fullScreenCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    fullScreenDotsContainer: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
});

