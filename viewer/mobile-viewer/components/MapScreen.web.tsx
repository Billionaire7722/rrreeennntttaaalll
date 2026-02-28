import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import Colors from "@shared/constants/colors";
import { useProperties } from "../contexts/PropertyContext";
import { Property } from "@shared/types/property";
import PropertyPopup from "./PropertyPopup";

const HANOI_REGION = {
    latitude: 21.0285,
    longitude: 105.8542,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
};

const Iframe = 'iframe' as any;

export default function WebMapFallback() {
    const router = useRouter();
    const { filteredProperties: properties, isLoading } = useProperties();
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [popupVisible, setPopupVisible] = useState(false);
    const iframeRef = useRef<any>(null);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'PROPERTY_CLICK' && data.propertyId) {
                    const property = properties.find(p => p.id === data.propertyId);
                    if (property) {
                        setSelectedProperty(property);
                        setPopupVisible(true);
                    }
                } else if (data.type === 'MAP_READY') {
                    setMapReady(true);
                }
            } catch (e) { }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [properties]);

    useEffect(() => {
        if (mapReady && iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage(
                JSON.stringify({ type: 'UPDATE_MARKERS', properties }),
                '*'
            );
        }
    }, [properties, mapReady]);

    const handleClosePopup = useCallback(() => {
        setPopupVisible(false);
        setSelectedProperty(null);
    }, []);

    const htmlContent = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #f8f9fa; }
        #map { width: 100vw; height: 100vh; }
        .custom-div-icon {
          background: transparent;
          border: none;
        }
        .marker-pin {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0,0,0,0.3);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false, attributionControl: false }).setView([${HANOI_REGION.latitude}, ${HANOI_REGION.longitude}], 13);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: ''
        }).addTo(map);

        let currentMarkers = [];

        window.addEventListener('message', function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'UPDATE_MARKERS') {
                    currentMarkers.forEach(m => map.removeLayer(m));
                    currentMarkers = [];
                    
                    data.properties.forEach(p => {
                        const isAvailable = p.status === 'available';
                        const color = isAvailable ? '${Colors.available}' : '${Colors.rented}';
                        
                        const iconHtml = '<div class="marker-pin" style="background-color: ' + color + ';"></div>';
                        
                        const customIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: iconHtml,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });

                        const marker = L.marker([p.latitude, p.longitude], { icon: customIcon }).addTo(map);
                        
                        marker.on('click', () => {
                            window.parent.postMessage(JSON.stringify({ type: 'PROPERTY_CLICK', propertyId: p.id }), '*');
                        });
                        
                        currentMarkers.push(marker);
                    });
                }
            } catch(e) {}
        });

        setTimeout(() => {
            window.parent.postMessage(JSON.stringify({ type: 'MAP_READY' }), '*');
        }, 100);
      </script>
    </body>
    </html>
  `, []);

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
            <Iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
                title="Web Map"
            />

            <View style={[styles.topBar, { top: 10 }]} pointerEvents="box-none">
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
});
