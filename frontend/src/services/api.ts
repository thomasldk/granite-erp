
import axios from 'axios';


// Hardcoded for production stability (COMMENTED OUT FOR DEV)
// const apiUrl = 'https://granite-erp-production.up.railway.app/api';
const apiUrl = 'http://localhost:5006/api';
// const apiUrl = import.meta.env.VITE_API_URL || '/api';
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
