import axios from 'axios';
import { Platform } from 'react-native';

const getApiUrl = () => {
    const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');
    if (explicit && !explicit.includes('yourdomain.com')) {
        return explicit;
    }

    if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.location?.hostname) {
            return `${window.location.protocol}//${window.location.hostname}:3000`;
        }
        return "http://localhost:3000";
    }

    // Native dev fallback (update for your LAN if needed)
    return "http://192.168.100.129:3000";
};

export const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});
