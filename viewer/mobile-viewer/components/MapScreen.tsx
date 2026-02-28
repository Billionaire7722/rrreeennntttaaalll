import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Locate } from "lucide-react-native";
import Colors from "@shared/constants/colors";
import { useProperties } from "../contexts/PropertyContext";
import { Property } from "@shared/types/property";
import PropertyPopup from "./PropertyPopup";
import MapView, { Marker as MarkerComponent } from "react-native-maps";

const HANOI_REGION = {
    latitude: 21.0285,
    longitude: 105.8542,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
};

export default function NativeMapScreen() {
    const router = useRouter();
    const { filteredProperties: properties, isLoading } = useProperties();
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [popupVisible, setPopupVisible] = useState(false);
    const mapRef = useRef<any>(null);

    const handleMarkerPress = useCallback((property: Property) => {
        setSelectedProperty(property);
        setPopupVisible(true);
    }, []);

    const handleClosePopup = useCallback(() => {
        setPopupVisible(false);
        setSelectedProperty(null);
    }, []);

    const handleRecenter = useCallback(() => {
        mapRef.current?.animateToRegion(HANOI_REGION, 600);
    }, []);

    if (isLoading && properties.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={HANOI_REGION}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
            >
                {properties
                    .filter(p => p.latitude && p.longitude)
                    .map((property) => (
                        <MarkerComponent
                            key={property.id}
                            coordinate={{
                                latitude: Number(property.latitude),
                                longitude: Number(property.longitude),
                            }}
                            pinColor={
                                property.status === "available" ? Colors.available : Colors.rented
                            }
                            onPress={() => handleMarkerPress(property)}
                        />
                    ))}
            </MapView>

            <View style={[styles.topBar, { top: 10 }]}>
                <View style={styles.badge}>
                    <View style={[styles.badgeDot, { backgroundColor: Colors.available }]} />
                    <Text style={styles.badgeText}>Cho thuê</Text>
                </View>
                <View style={styles.badge}>
                    <View style={[styles.badgeDot, { backgroundColor: Colors.rented }]} />
                    <Text style={styles.badgeText}>Đã thuê</Text>
                </View>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{properties.length} nhà</Text>
                </View>
            </View>

            <View style={[styles.controls, { bottom: 90 }]}>
                <Pressable
                    style={styles.controlBtn}
                    onPress={handleRecenter}
                >
                    <Locate size={20} color={Colors.primary} />
                </Pressable>
            </View>

            <PropertyPopup
                property={selectedProperty}
                visible={popupVisible}
                onClose={handleClosePopup}
                onViewDetails={(prop) => {
                    handleClosePopup();
                    router.push(`/property/${prop.id}` as any);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    map: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.light.background,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.light.textSecondary,
    },
    topBar: {
        position: "absolute",
        left: 16,
        flexDirection: "row",
        gap: 8,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "rgba(255,255,255,0.95)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    badgeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.light.text,
    },
    countBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    countText: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.white,
    },
    controls: {
        position: "absolute",
        right: 16,
        gap: 10,
    },
    controlBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.95)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
});
