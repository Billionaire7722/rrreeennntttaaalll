import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const ACCESS_TOKEN_STORAGE_KEY = 'token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const AUTH_STATE_CHANGED_EVENT = 'auth:state-changed';

type TokenUpdate = {
    accessToken?: string | null;
    refreshToken?: string | null;
};

type RefreshResponse = {
    access_token: string;
    refresh_token: string;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};

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

const canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const notifyAuthStateChanged = () => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT));
};

export const getStoredAccessToken = () => {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
};

export const getStoredRefreshToken = () => {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
};

export const setStoredAuthTokens = ({ accessToken, refreshToken }: TokenUpdate) => {
    if (!canUseStorage()) return;

    if (accessToken === null) {
        window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    } else if (typeof accessToken === 'string') {
        window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    }

    if (refreshToken === null) {
        window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    } else if (typeof refreshToken === 'string') {
        window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    }

    notifyAuthStateChanged();
};

export const clearStoredAuthTokens = () => {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    notifyAuthStateChanged();
};

export const resolveApiBaseUrl = () => {
    const rawEnvUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const envUrl = normalizeApiBaseUrl(rawEnvUrl);
    if (envUrl) {
        if (shouldIgnoreEnvUrlInBrowser(envUrl)) {
            return '/api';
        }
        return envUrl;
    }

    if (typeof window === 'undefined') {
        const internal = normalizeApiBaseUrl(process.env.API_BASE_URL);
        return internal || 'http://127.0.0.1:3000';
    }

    return '/api';
};

export const resolvedApiBaseUrl = resolveApiBaseUrl();

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

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async () => {
    if (typeof window === 'undefined') return null;

    if (refreshPromise) {
        return refreshPromise;
    }

    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
        clearStoredAuthTokens();
        return null;
    }

    refreshPromise = axios
        .post<RefreshResponse>(`${resolvedApiBaseUrl}/auth/refresh`, { refreshToken })
        .then((response) => {
            const nextAccessToken = response.data?.access_token;
            const nextRefreshToken = response.data?.refresh_token;

            if (!nextAccessToken || !nextRefreshToken) {
                clearStoredAuthTokens();
                return null;
            }

            setStoredAuthTokens({
                accessToken: nextAccessToken,
                refreshToken: nextRefreshToken,
            });

            return nextAccessToken;
        })
        .catch(() => {
            clearStoredAuthTokens();
            return null;
        })
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
};

const isAuthRequest = (url?: string) => {
    if (!url) return false;
    return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh') || url.includes('/auth/logout');
};

const api = axios.create({
    baseURL: resolvedApiBaseUrl,
});

api.interceptors.request.use(
    (config) => {
        const token = getStoredAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;

        if (
            error.response?.status !== 401 ||
            !originalRequest ||
            originalRequest._retry ||
            isAuthRequest(originalRequest.url)
        ) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const nextAccessToken = await refreshAccessToken();

        if (!nextAccessToken) {
            return Promise.reject(error);
        }

        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
    }
);

export default api;
