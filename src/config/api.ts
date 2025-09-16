// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
(import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin + '/api');