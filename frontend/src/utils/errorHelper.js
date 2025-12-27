/**
 * Centralized error helper to extract user-friendly messages from API responses.
 */
const getErrorMessage = (error) => {
    if (!error) return 'An unknown error occurred';

    // Handle Axios response errors
    if (error.response) {
        const data = error.response.data;

        // Handle string errors (e.g., { "error": "Message" } or { "detail": "Message" })
        if (typeof data === 'object') {
            if (data.error) return data.error;
            if (data.detail) return data.detail;

            // Handle field-specific validation errors (e.g., { "email": ["Invalid format"] })
            const firstField = Object.keys(data)[0];
            if (firstField && Array.isArray(data[firstField])) {
                const fieldName = firstField.charAt(0).toUpperCase() + firstField.slice(1).replace('_', ' ');
                return `${fieldName}: ${data[firstField][0]}`;
            }

            // Handle non-field errors array
            if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
                return data.non_field_errors[0];
            }
        }

        // Fallback for different status codes
        if (error.response.status === 401) return 'Session expired. Please login again.';
        if (error.response.status === 403) return 'You do not have permission to perform this action.';
        if (error.response.status === 404) return 'The requested resource was not found.';
        if (error.response.status >= 500) return 'Server error. Please try again later.';
    }

    // Handle network/timeout errors
    if (error.request) {
        return 'Network error. Please check your internet connection.';
    }

    return error.message || 'An unexpected error occurred';
};

export default getErrorMessage;
