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

const isLocalHostName = (host?: string) => {
    if (!host) return false;
    const lowered = host.toLowerCase();
    return lowered === 'localhost' || lowered === '127.0.0.1' || lowered === '::1';
};

const shouldIgnoreEnvUrlInBrowser = (envUrl: string) => {
    if (typeof window === 'undefined') return false;
    if (!window.location) return false;

    try {
        const parsed = new URL(envUrl, window.location.origin);
        const pageProtocol = window.location.protocol;
        if (pageProtocol === 'https:' && parsed.protocol !== 'https:') {
            return true;
        }

        const pageHost = window.location.hostname;
        if (isLocalHostName(parsed.hostname) && !isLocalHostName(pageHost)) {
            return true;
        }
    } catch {
        return false;
    }

    return false;
};

// Prefer explicit build-time env; otherwise use a same-origin proxy path.
// This avoids relying on exposing backend port 3000 publicly in VPS deployments.
const rawEnvUrl = import.meta.env.VITE_API_BASE_URL;
const normalizedEnvUrl = normalizeApiBaseUrl(rawEnvUrl);
export const resolvedApiBaseUrl = normalizedEnvUrl
    ? shouldIgnoreEnvUrlInBrowser(normalizedEnvUrl)
        ? '/api'
        : normalizedEnvUrl
    : '/api';

export const resolveSocketBaseUrl = () => {
    if (resolvedApiBaseUrl.startsWith('http')) {
        try {
            return new URL(resolvedApiBaseUrl).origin;
        } catch {
            return resolvedApiBaseUrl;
        }
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return 'http://localhost:3000';
};

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
