"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { Bed, Square, MapPin, Locate } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { useAuth } from "@/context/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { getBestAvailableLocation } from "@/utils/location";
import { getPropertyStatusTranslationKey, getPropertyTypeTranslationKey } from "@/i18n";

const getMarkerIcon = (status?: string | null) => {
  const normalized = status?.toLowerCase();
  const color = normalized === "available" ? "#10b981" : normalized === "pending" ? "#f59e0b" : "#ef4444";
  const svgIcon =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>' +
    '<circle cx="12" cy="10" r="3" fill="white"/>' +
    "</svg>";

  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="width: 32px; height: 32px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.3));">${svgIcon}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const userIcon = L.divIcon({
  className: "custom-div-icon",
  html: '<div style="width: 20px; height: 20px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

interface Property {
  id: string;
  title: string;
  property_type?: string;
  price: number;
  latitude: number;
  longitude: number;
  image_url?: string;
  image_url_1?: string;
  image_url_2?: string;
  image_url_3?: string;
  images?: string[];
  status: string;
  bedrooms?: number;
  area?: number;
  square?: number;
  address?: string;
  city?: string;
  district?: string;
}

interface MapProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  onBoundsChange?: (bounds: string) => void;
}

function MapEvents({
  onBoundsChange,
  setUserLocation,
}: {
  onBoundsChange?: (bounds: string) => void;
  setUserLocation: (location: [number, number]) => void;
}) {
  const map = useMap();
  const onBoundsChangeRef = useRef(onBoundsChange);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    const resolveLocation = async () => {
      const location = await getBestAvailableLocation();
      setUserLocation([location.lat, location.lng]);
      map.setView([location.lat, location.lng], location.source === "gps" ? 15 : 12);
    };

    const handleLocationFound = (event: L.LocationEvent) => {
      setUserLocation([event.latlng.lat, event.latlng.lng]);
    };

    const handleMoveEnd = () => {
      const callback = onBoundsChangeRef.current;
      if (!callback) return;

      const bounds = map.getBounds();
      callback(`${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`);
    };

    resolveLocation();

    map.on("locationfound", handleLocationFound);
    map.on("locationerror", resolveLocation);
    map.on("moveend", handleMoveEnd);
    handleMoveEnd();

    return () => {
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", resolveLocation);
      map.off("moveend", handleMoveEnd);
    };
  }, [map, setUserLocation]);

  return null;
}

export default function InteractiveMap({
  properties,
  center = [21.0285, 105.8542],
  zoom = 12,
  onBoundsChange,
}: MapProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t, formatNumber } = useLanguage();
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const areaUnit = `m\u00B2`;

  const handleLocateClick = async () => {
    if (!mapInstance) return;

    const location = await getBestAvailableLocation();
    setUserLocation([location.lat, location.lng]);
    mapInstance.setView([location.lat, location.lng], location.source === "gps" ? 15 : 12);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="z-0 h-full w-full rounded-xl shadow-sm"
        ref={setMapInstance}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation ? <Marker position={userLocation} icon={userIcon} zIndexOffset={1000} /> : null}

        {properties.map((property) => {
          const latitude = Number(property.latitude);
          const longitude = Number(property.longitude);
          if (Number.isNaN(latitude) || Number.isNaN(longitude) || (latitude === 0 && longitude === 0)) return null;

          const statusKey = getPropertyStatusTranslationKey(property.status);
          const typeKey = getPropertyTypeTranslationKey(property.property_type);
          const statusLabel = statusKey ? t(statusKey) : property.status;
          const propertyTypeLabel = typeKey
            ? t(typeKey)
            : property.property_type?.trim() || t("property.form.houseTypeLabel");
          const statusColor =
            property.status?.toLowerCase() === "available"
              ? "bg-emerald-500"
              : property.status?.toLowerCase() === "pending"
                ? "bg-amber-500"
                : "bg-red-500";
          const images = (
            property.images?.length
              ? property.images
              : [property.image_url_1, property.image_url_2, property.image_url_3, property.image_url]
          ).filter(Boolean) as string[];
          const displayImages = images.length > 0 ? images : ["/images/defaultimage.jpg"];
          const rawAddress = property.address || `${property.district ? `${property.district}, ` : ""}${property.city}`;

          return (
            <Marker key={property.id} position={[latitude, longitude]} icon={getMarkerIcon(property.status)}>
              <Popup className="custom-popup" closeButton={false}>
                <div className="w-[260px] cursor-pointer overflow-hidden rounded-lg bg-white shadow-sm">
                  <div className="relative h-36 w-full">
                    <div className="flex h-full w-full snap-x snap-mandatory overflow-x-auto hide-scrollbar">
                      {displayImages.map((image, index) => (
                        <SafeImage
                          key={index}
                          src={image}
                          className="h-full w-full flex-shrink-0 snap-center object-cover"
                          alt={`${property.title} - ${index + 1}`}
                          fallbackSrc="/images/defaultimage.jpg"
                        />
                      ))}
                    </div>

                    <div className={`absolute left-2 top-2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md ${statusColor}`}>
                      {statusLabel}
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className="mb-1 truncate text-[15px] font-bold leading-tight text-gray-900">{property.title}</h4>
                    <p className="mb-1 truncate text-xs font-medium uppercase tracking-wide text-gray-500">{propertyTypeLabel}</p>
                    <p className="mb-2 text-sm font-extrabold text-blue-600">
                      {formatNumber(property.price || 0)} VND{t("property.units.monthAbbr")}
                    </p>

                    <div className="mb-2 flex flex-row items-center gap-3">
                      <div className="flex items-center rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">
                        <Square size={12} className="mr-1.5 text-gray-400" />
                        {property.area || property.square || 0} {areaUnit}
                      </div>
                      <div className="flex items-center rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">
                        <Bed size={12} className="mr-1.5 text-gray-400" />
                        {property.bedrooms || 1} {t("property.fields.bedrooms")}
                      </div>
                    </div>

                    <div className="mb-3 flex items-start truncate text-xs text-gray-500">
                      <MapPin size={12} className="mr-1 mt-0.5 flex-shrink-0" />
                      <span className="truncate">{rawAddress}</span>
                    </div>

                    <button
                      className="w-full rounded-lg border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!user) {
                          router.push("/login");
                          return;
                        }
                        router.push(`/properties/${property.id}`);
                      }}
                    >
                      {t("property.actions.viewDetails")}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapEvents onBoundsChange={onBoundsChange} setUserLocation={setUserLocation} />
      </MapContainer>

      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-3">
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-100 bg-white/95 shadow-lg backdrop-blur transition-colors hover:bg-gray-50"
          onClick={handleLocateClick}
        >
          <Locate size={20} className="text-blue-600" />
        </button>
      </div>
    </div>
  );
}
