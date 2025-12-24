
import axios from 'axios';


// Adapts automatically to Localhost or Cloudflare Tunnel via Vite Proxy
// FIXME: Hardcoded for Production due to Railway environment variable injection issue. Revert to VITE_API_URL later.
const apiUrl = import.meta.env.MODE === 'production'
    ? 'https://granite-erp-production.up.railway.app'
    : '/api';
console.log('🔗 API URL (Debug):', apiUrl);
console.log('🔗 VITE_API_URL value:', import.meta.env.VITE_API_URL);
console.log('🔗 Build Time:', new Date().toISOString());

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
