import api from '@/lib/axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  position: string;
  departments: string[];
  shift: string;
  role: string;
  status: string;
  startDate?: string;
}

const userService = {
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get(`/api/users`);
    console.log('Raw API Response:', response);
    return response.data.users;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  }
};

export default userService; 