import api from '../axios';

export interface Evaluation {
  id: string;
  employeeId: string;
  templateId: string;
  status: 'pending' | 'completed' | 'acknowledged';
  scheduledDate: string;
  completedDate?: string;
  acknowledgedDate?: string;
  sections: any[];
}

export interface EvaluationService {
  getEvaluations: (params?: any) => Promise<Evaluation[]>;
  getEvaluation: (id: string) => Promise<Evaluation>;
  createEvaluation: (data: any) => Promise<Evaluation>;
  updateEvaluation: (id: string, data: any) => Promise<Evaluation>;
  getHistory: (employeeId: string, timeframe: string) => Promise<Evaluation[]>;
  acknowledgeEvaluation: (id: string, data: any) => Promise<void>;
}

const evaluationService: EvaluationService = {
  getEvaluations: async (params?: any) => {
    try {
      const response = await api.get('/api/evaluations', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getEvaluation: async (id: string) => {
    try {
      const response = await api.get(`/api/evaluations/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createEvaluation: async (data: any) => {
    try {
      const response = await api.post('/api/evaluations', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateEvaluation: async (id: string, data: any) => {
    try {
      const response = await api.put(`/api/evaluations/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getHistory: async (employeeId: string, timeframe: string) => {
    try {
      const response = await api.get(`/api/evaluations/history/${employeeId}?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  acknowledgeEvaluation: async (id: string, data: any) => {
    try {
      await api.post(`/api/evaluations/${id}/acknowledge`, data);
    } catch (error) {
      throw error;
    }
  }
};

export default evaluationService; 