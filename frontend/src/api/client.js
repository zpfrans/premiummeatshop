import axios from "axios";

function resolveApiBaseUrl() {
  // For production, use the deployed API
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://premiummeatshop-api.onrender.com/api";
  }

  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredUrl) {
    const isLocalApi = /localhost|127\.0\.0\.1/i.test(configuredUrl);
    const isLocalApp =
      typeof window !== "undefined" &&
      /localhost|127\.0\.0\.1/i.test(window.location.hostname);

    if (!isLocalApi || isLocalApp) {
      return configuredUrl.replace(/\/$/, "");
    }
  }

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

// Keep requests credentialed so the backend's httpOnly cookie can carry auth.
api.interceptors.request.use((config) => config);

// Handle auth errors and provide better error messages
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
