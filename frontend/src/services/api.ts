
import axios from 'axios';


const apiUrl = import.meta.env.VITE_API_URL || 'https://granite-erp-production.up.railway.app/api';
console.log('🔗 API URL:', apiUrl);

const api = axios.create({
    baseURL: apiUrl
});

export default api;
