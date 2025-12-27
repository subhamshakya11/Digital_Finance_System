import api from './api';

const loanService = {
  // Get all loan applications
  getAll: async () => {
    const response = await api.get('/loans/');
    return response.data;
  },

  // Get loan by ID
  getById: async (id) => {
    const response = await api.get(`/loans/${id}/`);
    return response.data;
  },

  // Create new loan application
  create: async (loanData) => {
    const response = await api.post('/loans/', loanData);
    return response.data;
  },

  // Update loan application
  update: async (id, loanData) => {
    const response = await api.put(`/loans/${id}/`, loanData);
    return response.data;
  },

  // Upload document
  uploadDocument: async (applicationId, documentData) => {
    const formData = new FormData();
    formData.append('application', applicationId);
    formData.append('document_type', documentData.document_type);
    formData.append('file', documentData.file);

    const response = await api.post('/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}/`);
    return response.data;
  },

  // Verify Single Document (NEW)
  verifyDocument: async (docId, status) => {
    const response = await api.post(`/documents/${docId}/verify/`, { status });
    return response.data;
  },

  // Verify documents (Sales Rep)
  verifyDocuments: async (id) => {
    const response = await api.post(`/loans/${id}/verify_documents/`);
    return response.data;
  },

  // Get AI score
  getAIScore: async (id) => {
    const response = await api.post(`/loans/${id}/ai_score/`);
    return response.data;
  },

  // Approve loan (Finance Manager)
  approve: async (id) => {
    const response = await api.post(`/loans/${id}/approve/`);
    return response.data;
  },

  // Reject loan (Finance Manager)
  reject: async (id, reason) => {
    const response = await api.post(`/loans/${id}/reject/`, { reason });
    return response.data;
  },

  // Get EMI schedules
  getEMISchedules: async (applicationId) => {
    const response = await api.get('/emi-schedules/', {
      params: { application: applicationId }
    });
    return response.data;
  },

  // Submit draft loan application
  submitLoan: async (id) => {
    const response = await api.post(`/loans/${id}/submit_loan/`);
    return response.data;
  },

  // Get upcoming EMIs
  getUpcomingEMIs: async () => {
    const response = await api.get('/emi-schedules/upcoming/');
    return response.data;
  },
};

export default loanService;