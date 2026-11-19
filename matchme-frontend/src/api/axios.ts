import axios from "axios";
import { authService } from "../services/authService";
import { API_BASE_URL } from "../config";


const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});


axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling.... 67... 67
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      (window as any).disconnectSocket?.();
      authService.logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
