
import axios from 'axios';

const api = axios.create({
    baseURL: '/api' // Proxy handles correct port
});

export default api;
