import axios from 'axios';
import { User, LoginCredentials } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
  });
export const authApi = {
  modLogin: async (credentials: LoginCredentials) => {
    try {
      const response = await api.post(`${API_BASE_URL}/auth/mod-login`, credentials, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_MOD_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/auth/verify-token`, {
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get<User[]>(`${API_BASE_URL}/auth/users`, {
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post(`${API_BASE_URL}/auth/logout`, {}, {
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  proxy: async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/auth/proxy?url=https://node-mysql-signup-verification-api.onrender.com/external/get-employee-active`, {
        method: 'GET',
        headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_MOD_API_KEY
        }
    });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  registerUser: async (userData: {
    username: string;
    email: string;
    password: string;
    identifier: string;
  }) => {
    try {
      const response = await api.post(`${API_BASE_URL}/auth/register`, userData, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_MOD_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  changePassword: async (credentials: {
    username: string;
    password: string;
  }) => {
    try {
      const response = await api.post(`${API_BASE_URL}/auth/change-password`, credentials, {
        headers: {
          'X-API-Key': process.env.NEXT_PUBLIC_MOD_API_KEY,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};