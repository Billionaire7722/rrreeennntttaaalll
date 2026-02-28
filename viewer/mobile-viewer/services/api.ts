import axios from 'axios';
import { Platform } from 'react-native';

const getApiUrl = () => {
    if (Platform.OS === 'web') {
        return "http://127.0.0.1:3000";
    }
    // Change this to your local IP address for physical devices
    return "http://192.168.100.129:3000";
};

export const api = axios.create({
    baseURL: getApiUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});
