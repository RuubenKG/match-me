import axios from "axios";
import { API_BASE_URL } from "../config";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface AuthResponse {
  token: string;
  userId: number;
}

const USER_API = `${API_BASE_URL}/api/users`;
const AUTH_API = `${API_BASE_URL}/api/auth`;

const USE_MOCK = false;

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (USE_MOCK) {
      console.log("🔧 Using mock login");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockToken = `mock-jwt-token-${Date.now()}`;

      return {
        token: mockToken,
        userId: 1, // ← Return as number
      };
    }

    // Real login
    const response = await axios.post(`${AUTH_API}/login`, credentials);
    console.log("📥 Login response:", response.data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<void> => {
    if (USE_MOCK) {
      console.log("Using mock register:", data);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }

    await axios.post(`${USER_API}/register`, data);
  },

  setToken: (token: string) => {
    localStorage.setItem("authToken", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  },

  setUserId: (userId: number) => {
    localStorage.setItem("userId", userId.toString());
  },

  getUserId: (): number | null => {
    const userId = localStorage.getItem("user");
    return userId ? parseInt(userId, 10) : null;
  },

  getToken: (): string | null => {
    return localStorage.getItem("authToken");
  },

  logout: () => {
    localStorage.clear();
    delete axios.defaults.headers.common["Authorization"];
  },

  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },
};
