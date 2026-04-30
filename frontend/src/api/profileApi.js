/**
 * Servicios de API para el módulo de perfil de usuario.
 * Sigue el patrón establecido por auth.js — separa la lógica HTTP del componente.
 */
import apiClient from './apiClient';

/**
 * Obtiene los datos del perfil del usuario autenticado.
 * GET /api/v1/users/me/
 */
export const getProfile = async () => {
  const response = await apiClient.get('users/me/');
  return response.data;
};

/**
 * Actualiza los datos del perfil del usuario autenticado.
 * PUT /api/v1/users/me/ con multipart/form-data (soporta subida de imagen).
 * @param {FormData} formData - Datos del formulario incluyendo posible archivo de imagen.
 */
export const updateProfile = async (formData) => {
  const response = await apiClient.put('users/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
