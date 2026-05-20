import apiClient from './apiClient';

export const getProfile = async () => {
  const response = await apiClient.get('users/me/');
  return response.data;
};

export const updateProfile = async (formData) => {
  const response = await apiClient.put('users/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
