
import axios from 'axios';


// Adapts automatically based on runtime hostname
// This avoids build-time environment variable issues on Railway
const isProduction = window.location.hostname.includes('railway.app');
const apiUrl = isProduction
    ? 'https://granite-erp-production.up.railway.app/api'
    : '/api';

console.log('🔗 API URL:', apiUrl);

const api = axios.create({
    baseURL: apiUrl
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
