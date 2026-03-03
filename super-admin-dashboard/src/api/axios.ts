import axios from 'axios';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const runtimeProtocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
const fallbackApiBaseUrl = `${runtimeProtocol}//${runtimeHost}:3000`;
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const normalizedEnvApiBaseUrl = envApiBaseUrl?.trim().replace(/\/+$/, '');
const resolvedApiBaseUrl =
    normalizedEnvApiBaseUrl && !normalizedEnvApiBaseUrl.includes('yourdomain.com')
        ? normalizedEnvApiBaseUrl
        : fallbackApiBaseUrl;

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
