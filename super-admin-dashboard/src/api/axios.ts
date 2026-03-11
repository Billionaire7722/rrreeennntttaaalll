import axios from 'axios';

const runtimeHost = typeof window !== 'undefined' ? (window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname) : '127.0.0.1';
const runtimeProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
const fallbackApiBaseUrl = `${runtimeProtocol}//${runtimeHost}:3000`;
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

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const resolvedApiBaseUrl = normalizeApiBaseUrl(envApiBaseUrl) || fallbackApiBaseUrl;

const api = axios.create({
    baseURL: resolvedApiBaseUrl,
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
