import api from './api';

const paymentService = {
    // Create a new payment
    createPayment: async (paymentData) => {
        const response = await api.post('/payments/', paymentData);
        return response.data;
    },

    // Get all payments for the current user
    getAll: async () => {
        const response = await api.get('/payments/');
        return response.data;
    },

    // Get a specific payment by ID
    getById: async (id) => {
        const response = await api.get(`/payments/${id}/`);
        return response.data;
    },
};

export default paymentService;
