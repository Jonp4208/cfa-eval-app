import api from '../axios';

export interface Template {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sectionsCount: number;
  criteriaCount: number;
}

export interface TemplateService {
  getTemplates: () => Promise<Template[]>;
  getTemplate: (id: string) => Promise<Template>;
  createTemplate: (data: any) => Promise<Template>;
  updateTemplate: (id: string, data: any) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
}

const templateService: TemplateService = {
  getTemplates: async () => {
    try {
      const response = await api.get('/api/templates');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getTemplate: async (id: string) => {
    try {
      const response = await api.get(`/api/templates/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createTemplate: async (data: any) => {
    try {
      const response = await api.post('/api/templates', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateTemplate: async (id: string, data: any) => {
    try {
      const response = await api.put(`/api/templates/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteTemplate: async (id: string) => {
    try {
      await api.delete(`/api/templates/${id}`);
    } catch (error) {
      throw error;
    }
  }
};

export default templateService; 