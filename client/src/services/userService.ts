import axios from 'axios';
import { getAuthHeader } from '@/utils/auth';

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
    const response = await axios.get(`/api/users`, {
      headers: getAuthHeader()
    });
    return response.data.users;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await axios.get(`/api/users/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  }
};

export default userService; 