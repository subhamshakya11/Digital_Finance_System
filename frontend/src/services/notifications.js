import api from './api';

const notificationService = {
  // Get all notifications
  getAll: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.post(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },

  // Delete notification
  delete: async (id) => {
    const response = await api.delete(`/notifications/${id}/`);
    return response.data;
  },
};

export default notificationService;