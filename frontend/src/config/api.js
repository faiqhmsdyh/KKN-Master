// API Configuration
// Change this to your computer's IP address when accessing from mobile devices
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default API_BASE_URL;

// Usage in components:
// import API_BASE_URL from '../config/api';
// fetch(`${API_BASE_URL}/api/dosen`)
