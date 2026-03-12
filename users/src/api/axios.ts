import axios from 'axios';

const normalizeApiBaseUrl = (value?: string) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';

    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    try {
        const url = new URL(candidate);
        if (!['http:', 'https:'].includes(url.protocol)) return '';
        if (url.username || url.password) return '';
        return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
    } catch {
        return '';
    }
};

const resolveApiBaseUrl = () => {
    const rawEnvUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const envUrl = normalizeApiBaseUrl(rawEnvUrl);
    if (envUrl) return envUrl;

    // Server-side (SSR / Route Handlers): prefer an internal Docker URL if provided.
    if (typeof window === 'undefined') {
        const internal = normalizeApiBaseUrl(process.env.API_BASE_URL);
        return internal || 'http://127.0.0.1:3000';
    }

    // Browser: prefer same-origin proxy to avoid depending on :3000 being public.
    return '/api';
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
