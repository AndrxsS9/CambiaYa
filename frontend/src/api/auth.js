/**
 * Servicios de autenticación.
 */
import apiClient from './apiClient';

export const registerUser = async (userData) => {
  const response = await apiClient.post('auth/register/', userData);
  return response.data;
};

// El login se maneja directamente en AuthContext para actualizar el estado global,
// pero se podría extraer aquí si fuera necesario.
