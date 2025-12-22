// services/invitationService.js
import apiClient from './apiClient';

const invitationService = {
  // Accept invitation
  acceptInvitation: async (token) => {
    try {
      const response = await apiClient.post(`/invitations/${token}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  // Decline invitation
  declineInvitation: async (token) => {
    try {
      const response = await apiClient.post(`/invitations/${token}/decline`);
      return response.data;
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  }
};

export default invitationService;
