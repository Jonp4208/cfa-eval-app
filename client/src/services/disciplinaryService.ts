import api from '@/lib/axios';

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
  severity: 'Minor' | 'Moderate' | 'Severe';
  status: 'Open' | 'Pending Acknowledgment' | 'Pending Follow-up' | 'Resolved';
  description: string;
  witnesses?: string;
  actionTaken: string;
  requiresFollowUp: boolean;
  followUpDate?: string;
  followUpActions?: string;
  fallOffDate?: string;
  acknowledgment?: {
    acknowledged: boolean;
    date: string;
    comments?: string;
    rating: number;
  };
  previousIncidents: boolean;
  documentationAttached: boolean;
  supervisor: {
    _id: string;
    name: string;
  };
  followUps: Array<{
    _id: string;
    date: string;
    note: string;
    by: {
      _id: string;
      name: string;
    };
    status: 'Pending' | 'Completed';
  }>;
  documents: Array<{
    _id: string;
    name: string;
    url: string;
    uploadedBy: {
      _id: string;
      name: string;
    };
    createdAt: string;
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
  followUpDate?: string;
  followUpActions?: string;
  fallOffDate?: string;
  previousIncidents: boolean;
  documentationAttached: boolean;
}

const disciplinaryService = {
  // Get all incidents
  getAllIncidents: async (): Promise<DisciplinaryIncident[]> => {
    const response = await api.get('/api/disciplinary');
    return response.data;
  },

  // Get employee incidents
  getEmployeeIncidents: async (employeeId: string): Promise<DisciplinaryIncident[]> => {
    const response = await api.get(`/api/disciplinary/employee/${employeeId}`);
    return response.data;
  },

  // Get incident by ID
  getIncidentById: async (id: string): Promise<DisciplinaryIncident> => {
    const response = await api.get(`/api/disciplinary/${id}`);
    return response.data;
  },

  // Create new incident
  createIncident: async (data: CreateIncidentData): Promise<DisciplinaryIncident> => {
    const response = await api.post('/api/disciplinary', data);
    return response.data;
  },

  // Update incident
  updateIncident: async (id: string, data: Partial<CreateIncidentData>): Promise<DisciplinaryIncident> => {
    const response = await api.put(`/api/disciplinary/${id}`, data);
    return response.data;
  },

  // Acknowledge incident
  acknowledgeIncident: async (id: string, data: { comments?: string; rating: number }): Promise<DisciplinaryIncident> => {
    const response = await api.post(`/api/disciplinary/${id}/acknowledge`, data);
    return response.data;
  },

  // Add follow-up
  addFollowUp: async (id: string, data: { date: string; note: string; status: string }): Promise<DisciplinaryIncident> => {
    const response = await api.post(`/api/disciplinary/${id}/follow-up`, data);
    return response.data;
  },

  // Complete follow-up
  completeFollowUp: async (id: string, followUpId: string, data: { note: string }): Promise<DisciplinaryIncident> => {
    const response = await api.post(`/api/disciplinary/${id}/follow-up/${followUpId}/complete`, data);
    return response.data;
  },

  // Add document
  addDocument: async (id: string, data: { name: string; type: string; url: string }): Promise<DisciplinaryIncident> => {
    const response = await api.post(`/api/disciplinary/${id}/document`, data);
    return response.data;
  },

  // Delete incident
  deleteIncident: async (id: string): Promise<void> => {
    await api.delete(`/api/disciplinary/${id}`);
  },

  // Send email
  sendEmail: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/disciplinary/${id}/send-email`);
    return response.data;
  },

  // Send unacknowledged notification
  sendUnacknowledgedNotification: async (id: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/disciplinary/${id}/notify-unacknowledged`);
    return response.data;
  }
};

export default disciplinaryService; 