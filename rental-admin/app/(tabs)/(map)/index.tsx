import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Pressable,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Locate, MapPin, BedDouble, Bath, Home } from "lucide-react-native";
import Colors from "@shared/constants/colors";
import { useProperties } from "@/contexts/PropertyContext";
import { Property } from "@shared/types/property";
import PropertyPopup from "@/components/PropertyPopup";
import { useRouter } from "expo-router";
const HANOI_REGION = {
  latitude: 21.0285,
  longitude: 105.8542,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

function formatPrice(price: number) {
  return price.toLocaleString("vi-VN") + " VNĐ";
}

const Iframe = 'iframe' as any;

function WebMapFallback() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filteredProperties: properties, isLoading } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const iframeRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
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
        } catch (e) {
          // ignore parsing errors
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [properties]);

  useEffect(() => {
    if (mapReady && Platform.OS === 'web' && iframeRef.current) {
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
                        // Allow missing or string coordinates for Leaflet grace mapping
                        if (!p.latitude || !p.longitude) return;

                        const isAvailable = p.status === 'available';
                        const color = isAvailable ? '${Colors.available}' : '${Colors.rented}';
                        
                        const iconHtml = '<div class="marker-pin" style="background-color: ' + color + ';"></div>';
                        
                        const customIcon = L.divIcon({
                            className: 'custom-div-icon',
                            html: iconHtml,
                            iconSize: [20, 20],
                            iconAnchor: [10, 10]
                        });

                        const marker = L.marker([Number(p.latitude), Number(p.longitude)], { icon: customIcon }).addTo(map);
                        
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <Iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          style={{ width: '100%', height: '100%', border: 'none', position: 'absolute', top: 0, left: 0 }}
          title="Web Map"
        />
      )}

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

function NativeMapScreen() {
  const MapViewComponent = require("react-native-maps").default;
  const MarkerComponent = require("react-native-maps").Marker;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { filteredProperties: properties, isLoading } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const mapRef = useRef<any>(null);

  const handleMarkerPress = useCallback((property: Property) => {
    console.log("[MapScreen] Marker pressed:", property.id, property.title);
    setSelectedProperty(property);
    setPopupVisible(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    console.log("[MapScreen] Closing popup");
    setPopupVisible(false);
    setSelectedProperty(null);
  }, []);

  const handleRecenter = useCallback(() => {
    console.log("[MapScreen] Recentering map");
    mapRef.current?.animateToRegion(HANOI_REGION, 600);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapViewComponent
        ref={mapRef}
        style={styles.map}
        initialRegion={HANOI_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        testID="map-view"
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
              testID={`marker-${property.id}`}
            />
          ))}
      </MapViewComponent>

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

      <View style={[styles.controls, { bottom: insets.bottom + 90 }]}>
        <Pressable
          style={styles.controlBtn}
          onPress={handleRecenter}
          testID="btn-recenter"
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

export default function MapScreen() {
  if (Platform.OS === "web") {
    return <WebMapFallback />;
  }
  return <NativeMapScreen />;
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
    position: "absolute" as const,
    left: 16,
    flexDirection: "row" as const,
    gap: 8,
  },
  badge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
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
    fontWeight: "600" as const,
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
    fontWeight: "700" as const,
    color: Colors.white,
  },
  controls: {
    position: "absolute" as const,
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
  webHeader: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webHeaderTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  webList: {
    flex: 1,
  },
  webListContent: {
    padding: 16,
    gap: 14,
  },
  webCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    overflow: "hidden" as const,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  webCardImage: {
    width: "100%" as const,
    height: 180,
  },
  webCardBody: {
    padding: 14,
    gap: 6,
  },
  webCardTopRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  webCardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  statusTag: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600" as const,
  },
  webCardPrice: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.accent,
  },
  webCardDetails: {
    flexDirection: "row" as const,
    gap: 16,
    marginTop: 2,
  },
  webCardDetail: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  webCardDetailText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  webCardAddress: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 2,
  },
  webCardAddressText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
});
