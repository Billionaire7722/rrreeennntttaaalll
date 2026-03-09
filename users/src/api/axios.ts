import axios from 'axios';

const normalizeApiBaseUrl = (value?: string) => {
    if (!value) return '';
    const normalized = value.trim().replace(/\/+$/, '');
    if (!normalized) return '';
    if (normalized.includes('yourdomain.com')) return '';
    return normalized;
};

const resolveApiBaseUrl = () => {
    const envUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    if (envUrl) return envUrl.replace(/\/+$/, '');

    if (typeof window !== 'undefined' && window.location?.hostname) {
        return `${window.location.protocol}//${window.location.hostname}:3000`;
    }

    return 'http://127.0.0.1:3000';
};

const api = axios.create({
    baseURL: resolveApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
