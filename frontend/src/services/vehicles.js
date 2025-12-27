import api from './api';

const vehicleService = {
  // Get all vehicles
  getAll: async (params = {}) => {
    const response = await api.get('/vehicles/', { params });
    return response.data;
  },

  // Get vehicle by ID
  getById: async (id) => {
    const response = await api.get(`/vehicles/${id}/`);
    return response.data;
  },

  // Filter vehicles by type
  filterByType: async (type) => {
    const response = await api.get('/vehicles/filter_by_type/', { params: { type } });
    return response.data;
  },

  // Filter vehicles by price range
  filterByPrice: async (minPrice, maxPrice) => {
    const response = await api.get('/vehicles/filter_by_price/', {
      params: { min_price: minPrice, max_price: maxPrice }
    });
    return response.data;
  },

  // Search vehicles
  search: async (query) => {
    const response = await api.get('/vehicles/', { params: { search: query } });
    return response.data;
  },

  // Create vehicle (Admin/Sales Rep)
  create: async (data) => {
    const response = await api.post('/vehicles/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update vehicle (Admin/Sales Rep)
  update: async (id, data) => {
    const response = await api.patch(`/vehicles/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Delete vehicle (Admin/Sales Rep)
  delete: async (id) => {
    const response = await api.delete(`/vehicles/${id}/`);
    return response.data;
  },
};

export default vehicleService;