import axios from 'axios';

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

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

// Prefer explicit build-time env; otherwise use a same-origin proxy path.
// This avoids relying on exposing backend port 3000 publicly in VPS deployments.
export const resolvedApiBaseUrl = normalizeApiBaseUrl(envApiBaseUrl) || '/api';

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
