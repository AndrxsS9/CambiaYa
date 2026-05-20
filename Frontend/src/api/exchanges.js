import api from './axios';

export const getExchanges = (params) => api.get('exchanges/', { params });

export const getExchange = (id) => api.get(`exchanges/${id}/`);

export const createExchange = (data) => api.post('exchanges/', data);

export const acceptExchange = (id) => api.post(`exchanges/${id}/accept/`);

export const rejectExchange = (id) => api.post(`exchanges/${id}/reject/`);

export const cancelExchange = (id) => api.post(`exchanges/${id}/cancel/`);

export const getMyAvailableProducts = () => api.get('products/', {
    params: { owner: 'me' }
});
