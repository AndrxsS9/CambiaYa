/**
 * Módulo de llamadas a la API de autenticación.
 *
 * Centraliza login y registro usando la instancia compartida de Axios.
 */
import api from './axios';

/** Inicia sesión y retorna los tokens JWT. */
export const login = (credentials) => api.post('auth/login/', credentials);

/** Registra un nuevo usuario. */
export const register = (userData) => api.post('auth/register/', userData);

/** Refresca el access token usando el refresh token. */
export const refreshToken = (refresh) => api.post('auth/token/refresh/', { refresh });
