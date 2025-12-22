import apiClient from './apiClient';

export const getMyGroups = async () => {
  const res = await apiClient.get('/api/groups/my');
  return res?.data?.data || [];
};

export const createGroup = async (payload) => {
  const res = await apiClient.post('/api/groups', payload);
  return res?.data?.data;
};

export const getGroupDetail = async (id) => {
  const res = await apiClient.get(`/api/groups/${id}`);
  return res?.data?.data;
};

export const inviteToGroup = async (payload) => {
  // payload: { groupId, email, role?, message? }
  const res = await apiClient.post('/api/group-invites', payload);
  return res?.data?.data;
};

export const validateGroupInvite = async (token) => {
  try {
    const res = await apiClient.get(`/api/group-invites/validate/${token}`);
    return res?.data;
  } catch (error) {
    // Return error response structure for better error handling
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

export const acceptGroupInvite = async (token) => {
  try {
    const res = await apiClient.post(`/api/group-invites/accept/${token}`);
    return res?.data;
  } catch (error) {
    // Return error response structure for better error handling
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

export const declineGroupInvite = async (token) => {
  try {
    const res = await apiClient.post(`/api/group-invites/decline/${token}`);
    return res?.data;
  } catch (error) {
    // Return error response structure for better error handling
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
};

