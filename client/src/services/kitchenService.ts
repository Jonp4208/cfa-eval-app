import api from '@/lib/axios';
import { FoodSafetyChecklist, FoodSafetyChecklistCompletion, ChecklistItemCompletion } from '../types/kitchen';

export const kitchenService = {
  // Get all food safety checklists
  getAllChecklists: async (): Promise<FoodSafetyChecklist[]> => {
    const response = await api.get('/api/kitchen/food-safety/checklists');
    return response.data;
  },

  // Get a specific checklist
  getChecklist: async (id: string): Promise<FoodSafetyChecklist> => {
    const response = await api.get(`/api/kitchen/food-safety/checklists/${id}`);
    return response.data;
  },

  // Create a new checklist
  createChecklist: async (checklist: Omit<FoodSafetyChecklist, '_id' | 'createdBy' | 'store' | 'isActive'>): Promise<FoodSafetyChecklist> => {
    const response = await api.post('/api/kitchen/food-safety/checklists', checklist);
    return response.data;
  },

  // Update a checklist
  updateChecklist: async (id: string, checklist: Partial<FoodSafetyChecklist>): Promise<FoodSafetyChecklist> => {
    const response = await api.patch(`/api/kitchen/food-safety/checklists/${id}`, checklist);
    return response.data;
  },

  // Delete a checklist
  deleteChecklist: async (id: string): Promise<void> => {
    await api.delete(`/api/kitchen/food-safety/checklists/${id}`);
  },

  // Complete a checklist
  completeChecklist: async (
    id: string,
    completion: {
      items: Omit<ChecklistItemCompletion, 'completedAt'>[],
      notes?: string,
      score: number,
      overallStatus: CompletionStatus
    }
  ): Promise<FoodSafetyChecklistCompletion> => {
    const response = await api.post(
      `/api/kitchen/food-safety/checklists/${id}/complete`,
      completion
    );
    return response.data;
  },

  // Get checklist completions
  getChecklistCompletions: async (id: string): Promise<FoodSafetyChecklistCompletion[]> => {
    const response = await api.get(`/api/kitchen/food-safety/checklists/${id}/completions`);
    return response.data;
  },

  // Review a checklist completion
  reviewCompletion: async (
    id: string,
    review: { notes: string }
  ): Promise<FoodSafetyChecklistCompletion> => {
    const response = await api.post(
      `/api/kitchen/food-safety/completions/${id}/review`,
      review
    );
    return response.data;
  }
}; 