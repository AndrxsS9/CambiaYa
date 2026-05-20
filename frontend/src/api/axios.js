/**
 * Instancia centralizada de Axios para toda la aplicación.
 *
 * Configura la baseURL y el interceptor de autenticación JWT
 * en un solo lugar para evitar duplicación (DRY).
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: `${API_URL}/api/v1/`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: inyecta el token JWT en cada petición autenticada
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor de respuesta: manejo centralizado de errores 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
        return Promise.reject(error);
    }
);

export default api;
