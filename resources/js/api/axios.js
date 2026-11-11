import axios from 'axios';

// Get CSRF token from meta tag if available
const token = document.head.querySelector('meta[name="csrf-token"]');

const apiClient = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { 'X-CSRF-TOKEN': token.content } : {})
    },
    timeout: 10000,
});

// Interceptor for response handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        let errorMessage = 'An unexpected error occurred. Please try again.';

        if (error.response) {
            // Server responded with an error status
            if (error.response.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.data?.errors) {
                // Laravel validation errors
                const firstKey = Object.keys(error.response.data.errors)[0];
                errorMessage = error.response.data.errors[firstKey][0];
            }
        } else if (error.request) {
            errorMessage = 'Network error. Please check your internet connection or server status.';
        }

        const err = new Error(errorMessage);
        err.response = error.response;
        err.status = error.response?.status;
        err.data = error.response?.data;
        err.character = error.response?.data?.character;

        return Promise.reject(err);
    }
);

export default apiClient;
