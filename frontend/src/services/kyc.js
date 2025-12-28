import api from './api';

const kycService = {
    // Get all KYC profiles (Admin/Sales Rep only)
    getAllKYC: async () => {
        const response = await api.get('/kyc/');
        return response.data;
    },

    // Get current user's KYC profile
    getMyKYC: async () => {
        const response = await api.get('/kyc/my_kyc/');
        return response.data;
    },

    // Check KYC status
    checkStatus: async () => {
        const response = await api.get('/kyc/check_status/');
        return response.data;
    },

    // Create or update KYC profile
    createKYC: async (data) => {
        const response = await api.post('/kyc/', data);
        return response.data;
    },

    updateKYC: async (id, data) => {
        const response = await api.put(`/kyc/${id}/`, data);
        return response.data;
    },

    // Submit KYC for verification
    submitKYC: async (id) => {
        const response = await api.post(`/kyc/${id}/submit/`);
        return response.data;
    },

    // Verify KYC (Sales Rep/Admin only)
    verifyKYC: async (id, action, reason = '', notes = '') => {
        const response = await api.post(`/kyc/${id}/verify/`, {
            action, // 'approve' or 'reject'
            reason,
            notes
        });
        return response.data;
    },

    // Upload KYC document
    uploadDocument: async (documentType, file) => {
        const formData = new FormData();
        formData.append('document_type', documentType);
        formData.append('file', file);

        const response = await api.post('/kyc-documents/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get KYC documents
    getDocuments: async () => {
        const response = await api.get('/kyc-documents/');
        return response.data;
    },

    // Delete KYC document
    deleteDocument: async (id) => {
        const response = await api.delete(`/kyc-documents/${id}/`);
        return response.data;
    },
};

export default kycService;
