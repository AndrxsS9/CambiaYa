/**
 * Módulo de llamadas a la API de productos.
 *
 * Usa la instancia centralizada de Axios (api/axios.js)
 * para evitar duplicar configuración de tokens y baseURL.
 */
import api from './axios';

/** Obtiene la lista de productos con filtros opcionales. */
export const getProducts = (params) => api.get('products/', { params });

/** Obtiene el detalle de un producto por su ID. */
export const getProduct = (id) => api.get(`products/${id}/`);

/** Crea un producto nuevo enviando multipart/form-data. */
export const createProduct = (formData) => api.post('products/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});

/** Actualiza un producto existente (solo el dueño). */
export const updateProduct = (id, data) => api.put(`products/${id}/`, data);

/** Elimina un producto (solo el dueño, retorna 204). */
export const deleteProduct = (id) => api.delete(`products/${id}/`);
