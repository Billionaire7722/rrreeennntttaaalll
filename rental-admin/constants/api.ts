import { Platform } from "react-native";

const normalizeApiBaseUrl = (value?: string) => {
  if (!value) return "";
  const normalized = value.trim().replace(/\/+$/, "");
  if (!normalized) return "";
  if (normalized.includes("yourdomain.com")) return "";
  return normalized;
};

const resolveWebApiBaseUrl = () => {
  const explicit = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (explicit) return explicit.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }

  return "http://localhost:3000";
};

const resolveNativeApiBaseUrl = () => {
  const explicit = normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL);
  if (explicit) return explicit.replace(/\/+$/, "");
  return "http://192.168.100.129:3000";
};

export const API_BASE_URL =
  Platform.OS === "web" ? resolveWebApiBaseUrl() : resolveNativeApiBaseUrl();

export const HOUSES_API_URL = `${API_BASE_URL}/houses`;
export const UPLOAD_IMAGE_URL = `${API_BASE_URL}/upload/image`;
export const UPLOAD_VIDEO_URL = `${API_BASE_URL}/upload/video`;
