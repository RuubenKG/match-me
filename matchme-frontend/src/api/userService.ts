import axios from 'axios';
import { API_BASE_URL } from "../config";

export interface RegisterRequest {
    username: string;
    email: string;
    password?: string;
}

const API_URL = `${API_BASE_URL}/api/users`;

export const registerUser = async (formData: RegisterRequest) => {
    console.log("Sending to 9090:", formData);
    return await axios.post(`${API_URL}/register`, formData);
};

export const userService = {
    registerUser,
    getMyProfile: async () => {
        const token = localStorage.getItem("authToken");

        const response = await axios.get(`${API_BASE_URL}/api/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getUserBasic: async (id: number) => {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getUserProfile: async (id: number) => {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getUserBio: async (id: number) => {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}/bio`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
}