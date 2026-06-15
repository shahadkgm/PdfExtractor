export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
  PDF: {
    UPLOAD: `${API_BASE_URL}/pdf/upload`,
    EXTRACT: `${API_BASE_URL}/pdf/extract`,
    HISTORY: `${API_BASE_URL}/pdf/history`,
    DOWNLOAD_HISTORY: `${API_BASE_URL}/pdf/history/download`,
  },
} as const;
