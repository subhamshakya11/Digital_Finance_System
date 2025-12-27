import api from './api';

const userService = {
    // Get all users (Admin only)
    getAll: async () => {
        const response = await api.get('/users/');
        return response.data;
    },

    // Create new user (Admin only)
    create: async (userData) => {
        const response = await api.post('/users/', userData);
        return response.data;
    },

    // Update user (Admin only)
    update: async (id, userData) => {
        const response = await api.put(`/users/${id}/`, userData);
        return response.data;
    },

    // Delete user (Admin only)
    delete: async (id) => {
        const response = await api.delete(`/users/${id}/`);
        return response.data;
    }
};

export default userService;
