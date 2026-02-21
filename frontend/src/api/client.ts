import axios from 'axios';

const api = axios.create({
    baseURL: '',
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('fleetflow_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor – handle 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('fleetflow_token');
            localStorage.removeItem('fleetflow_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    },
);

export default api;
