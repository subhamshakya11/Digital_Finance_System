/**
 * Centralized error helper to extract user-friendly messages from API responses.
 * Standardizes error formatting across the application.
 */
const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred. Please try again.';

    // Handle string errors passed directly
    if (typeof error === 'string') return error;

    // Handle Axios response errors
    if (error.response) {
        const data = error.response.data;
        const status = error.response.status;

        // 1. Handle explicit error field from backend
        if (data.error) return data.error;

        // 2. Handle standard DRF detail field
        if (data.detail) {
            if (status === 401) return 'Your session has expired. Please log in again to continue.';
            if (status === 403) return 'You do not have permission to perform this action.';
            return data.detail;
        }

        // 3. Handle field-specific validation errors (e.g., { "email": ["This field is required."] })
        if (typeof data === 'object' && !Array.isArray(data)) {
            const fieldEntries = Object.entries(data);
            if (fieldEntries.length > 0) {
                const [field, messages] = fieldEntries[0];

                // If it's a nested object or array of messages
                let message = '';
                if (Array.isArray(messages)) {
                    message = messages[0];
                } else if (typeof messages === 'string') {
                    message = messages;
                } else if (typeof messages === 'object') {
                    // Recursive call for nested errors if needed, or just stringify
                    message = 'Invalid data provided';
                }

                // Format field name: citizenship_number -> Citizenship Number
                const formattedField = field
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());

                if (field === 'non_field_errors') return message;
                return `${formattedField}: ${message}`;
            }
        }

        // 4. Status code fallback
        switch (status) {
            case 400: return 'Invalid request. Please check your input.';
            case 401: return 'Authentication required. Please log in.';
            case 403: return 'Access denied. You are not authorized for this request.';
            case 404: return 'The requested information was not found.';
            case 408: return 'Request timeout. The server took too long to respond.';
            case 429: return 'Too many requests. Please wait a moment and try again.';
            case 500: return 'Internal server error. Our team has been notified.';
            case 502: case 503: case 504: return 'Server is temporarily unavailable. Please try again later.';
            default: return `Error ${status}: Something went wrong.`;
        }
    }

    // Handle network errors (no response received)
    if (error.request) {
        // The request was made but no response was received
        if (error.code === 'ECONNABORTED') return 'Connection timeout. Please check your internet speed.';
        if (error.message === 'Network Error') return 'Cannot connect to server. Please check your internet connection.';
        return 'No response from server. It might be down or you are offline.';
    }

    // Handle other errors (setting up the request)
    return error.message || 'An unexpected error occurred. Please contact support.';
};

export default getErrorMessage;
