
import axios from 'axios';


const apiUrl = import.meta.env.VITE_API_URL || '/api';
console.log('🔗 API URL:', apiUrl);

const api = axios.create({
    baseURL: apiUrl
});

export default api;
