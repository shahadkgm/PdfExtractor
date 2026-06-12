export const PORT = Number(process.env.PORT) || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'pdfcraft_secret_key_2026';
export const API_PREFIX = '/api';

export const API_ROUTES = {
  PDF: `${API_PREFIX}/pdf`,
  AUTH: `${API_PREFIX}/auth`,
} as const;
