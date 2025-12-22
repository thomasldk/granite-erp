
import axios from 'axios';


// Adapts automatically to Localhost or Cloudflare Tunnel via Vite Proxy
const apiUrl = '/api';
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
