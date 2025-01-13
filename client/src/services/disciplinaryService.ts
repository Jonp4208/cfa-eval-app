import axios from 'axios';
import { getAuthHeader } from '@/utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface DisciplinaryIncident {
  _id: string;
  employee: {
    _id: string;
    name: string;
    position: string;
    department: string;
  };
  date: string;
  type: string;
  severity: string;
  status: string;
  description: string;
  witnesses?: string;
  actionTaken: string;
  followUpDate: string;
  followUpActions: string;
  previousIncidents: boolean;
  documentationAttached: boolean;
  supervisor: {
    _id: string;
    name: string;
  };
  followUps: Array<{
    _id: string;
    date: string;
    status: string;
    note: string;
    by: {
      _id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  documents: Array<{
    _id: string;
    name: string;
    type: string;
    url: string;
    uploadedBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentData {
  employeeId: string;
  date: string;
  type: string;
  severity: string;
  description: string;
  witnesses?: string;
  actionTaken: string;
  followUpDate: string;
  followUpActions: string;
  previousIncidents: boolean;
  documentationAttached: boolean;
}

const disciplinaryService = {
  // Get all incidents
  getAllIncidents: async (): Promise<DisciplinaryIncident[]> => {
    const response = await axios.get(`${API_URL}/api/disciplinary`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Get incident by ID
  getIncidentById: async (id: string): Promise<DisciplinaryIncident> => {
    const response = await axios.get(`${API_URL}/api/disciplinary/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Create new incident
  createIncident: async (data: CreateIncidentData): Promise<DisciplinaryIncident> => {
    const response = await axios.post(`${API_URL}/api/disciplinary`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Update incident
  updateIncident: async (id: string, data: Partial<CreateIncidentData>): Promise<DisciplinaryIncident> => {
    const response = await axios.put(`${API_URL}/api/disciplinary/${id}`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Add follow-up
  addFollowUp: async (id: string, data: { date: string; note: string; status: string }): Promise<DisciplinaryIncident> => {
    const response = await axios.post(`${API_URL}/api/disciplinary/${id}/follow-up`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Add document
  addDocument: async (id: string, data: { name: string; type: string; url: string }): Promise<DisciplinaryIncident> => {
    const response = await axios.post(`${API_URL}/api/disciplinary/${id}/document`, data, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Delete incident
  deleteIncident: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/api/disciplinary/${id}`, {
      headers: getAuthHeader()
    });
  }
};

export default disciplinaryService; 