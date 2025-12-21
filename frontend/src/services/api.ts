
import axios from 'axios';


// Hardcoded for production stability
const apiUrl = 'https://granite-erp-production.up.railway.app/api';
// const apiUrl = import.meta.env.VITE_API_URL || '/api';
console.log('🔗 API URL:', apiUrl);

const api = axios.create({
    baseURL: apiUrl
});

export default api;
