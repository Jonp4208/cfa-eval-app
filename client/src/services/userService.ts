import axios from 'axios';
import { getAuthHeader } from '@/utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface User {
  _id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  role: string;
  status: string;
  startDate?: string;
}

const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response = await axios.get(`${API_URL}/api/users`, {
      headers: getAuthHeader()
    });
    return response.data.users;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await axios.get(`${API_URL}/api/users/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default userService; 