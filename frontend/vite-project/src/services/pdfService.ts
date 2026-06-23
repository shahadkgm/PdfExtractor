import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../constance/Routes';

class PdfService {
  async uploadPdf(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(API_ENDPOINTS.PDF.UPLOAD, formData);
    return response.data;
  }

  async extractPages(fileId: string, pages: number[], originalName: string) {
    const response = await apiClient.post(API_ENDPOINTS.PDF.EXTRACT, {
      fileId,
      pages,
      originalName
    }, {
      responseType: 'blob'
    });
    return response.data;
  }

  async getHistory() {
    const response = await apiClient.get(API_ENDPOINTS.PDF.HISTORY);
    return response.data;
  }

  async downloadHistoryItem(id: string) {
    const response = await apiClient.get(`${API_ENDPOINTS.PDF.DOWNLOAD_HISTORY}/${id}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async deleteHistoryItem(id: string) {
    const response = await apiClient.delete(`${API_ENDPOINTS.PDF.DELETE_HISTORY}/${id}`);
    return response.data;
  }
}

export const pdfService = new PdfService();
