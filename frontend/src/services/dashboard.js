import api from './api';

const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/dashboard/stats/');
    return response.data;
  },
};

export default dashboardService;