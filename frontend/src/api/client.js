import axios from "axios";

function resolveApiBaseUrl() {
  // Always prioritize environment variable for Render/production deployment
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // Fallback for local development only
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:4000/api";
  }

  // For production without env var, use relative path
  return "/api";
}

export const API_BASE_URL = resolveApiBaseUrl();
const API_PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export function getPublicAssetUrl(assetPath) {
  if (!assetPath) return "";
  if (/^(?:data:|blob:|https?:\/\/)/i.test(assetPath)) return assetPath;
  return `${API_PUBLIC_BASE_URL}/${assetPath.replace(/^\/+/, "")}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000
});

let pendingRequestCount = 0;
const apiLoadingListeners = new Set();

function notifyApiLoadingListeners() {
  const isLoading = pendingRequestCount > 0;
  apiLoadingListeners.forEach((listener) => listener(isLoading));
}

export function subscribeToApiLoading(listener) {
  apiLoadingListeners.add(listener);
  listener(pendingRequestCount > 0);

  return () => {
    apiLoadingListeners.delete(listener);
  };
}

function startApiRequest() {
  pendingRequestCount += 1;
  notifyApiLoadingListeners();
}

function finishApiRequest() {
  pendingRequestCount = Math.max(0, pendingRequestCount - 1);
  notifyApiLoadingListeners();
}

// Keep requests credentialed so the backend's httpOnly cookie can carry auth.
api.interceptors.request.use((config) => {
  startApiRequest();
  return config;
});

// Handle auth errors and provide better error messages
api.interceptors.response.use(
  (response) => {
    finishApiRequest();
    return response;
  },
  (error) => {
    finishApiRequest();

    // Provide friendly error messages
    let message = error.message || 'An error occurred';
    
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.status === 400) {
      message = 'Invalid request. Please check your input.';
    } else if (error.response?.status === 404) {
      message = 'Resource not found.';
    } else if (error.response?.status === 500) {
      message = 'Server error. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timeout. Please check your connection.';
    } else if (!error.response) {
      message = 'Connection lost. Please check your internet and backend server.';
    }
    
    const details = error.response?.data?.details;
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.details = details;
    enhancedError.originalError = error;
    
    return Promise.reject(enhancedError);
  }
);
