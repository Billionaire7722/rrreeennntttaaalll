export type LocationSource = 'gps' | 'ip' | 'default';

export interface LocationResult {
    lat: number;
    lng: number;
    source: LocationSource;
}

const DEFAULT_LOCATION: LocationResult = {
    lat: 21.0285,
    lng: 105.8542,
    source: 'default'
};

async function fetchLocationFromIP(): Promise<LocationResult> {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) return DEFAULT_LOCATION;
        const data = await response.json();
        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            return { lat: data.latitude, lng: data.longitude, source: 'ip' };
        }
    } catch (error) {
        console.warn('IP-based location failed:', error);
    }
    return DEFAULT_LOCATION;
}

export async function getBestAvailableLocation(timeoutMs = 10000): Promise<LocationResult> {
    if (typeof window === 'undefined') {
        return DEFAULT_LOCATION;
    }

    const hasGeolocation = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    const isSecureContext = window.isSecureContext !== false;

    if (!hasGeolocation || !isSecureContext) {
        return fetchLocationFromIP();
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    source: 'gps'
                });
            },
            async () => {
                const fallback = await fetchLocationFromIP();
                resolve(fallback);
            },
            {
                enableHighAccuracy: true,
                timeout: timeoutMs,
                maximumAge: 300000
            }
        );
    });
}
