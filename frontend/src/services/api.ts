import axios, { AxiosInstance } from 'axios';
import {
  Book,
  Highlight,
  TTSRequest,
  TTSStatus,
  ExplanationRequest,
  ExplanationResponse,
  DictionaryRequest,
  DictionaryResponse,
  ReadingStats,
  ApiResponse,
} from '../types';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: any) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: any) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        console.error('API Response Error:', error);
        if (error.response?.status === 504) {
          throw new Error('Request timeout - the server is taking too long to respond');
        }
        throw error;
      }
    );
  }

  // Health Check
  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Books API
  async getBooks(): Promise<Book[]> {
    const response = await this.client.get('/api/books/');
    return response.data;
  }

  async getBook(bookId: string): Promise<Book> {
    const response = await this.client.get(`/api/books/${bookId}`);
    return response.data;
  }

  async uploadBook(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/api/books/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  async deleteBook(bookId: string): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/api/books/${bookId}`);
    return response.data;
  }

  async getBookContent(
    bookId: string,
    chapterId?: string,
    page?: number
  ): Promise<any> {
    const params = new URLSearchParams();
    if (chapterId) params.append('chapter_id', chapterId);
    if (page) params.append('page', page.toString());

    const response = await this.client.get(
      `/api/books/${bookId}/content?${params.toString()}`
    );
    return response.data;
  }

  async updateReadingPosition(
    bookId: string,
    position: any
  ): Promise<ApiResponse<any>> {
    const response = await this.client.post(`/api/books/${bookId}/position`, {
      book_id: bookId,
      position,
    });
    return response.data;
  }

  // Highlights API
  async getBookHighlights(bookId: string): Promise<Highlight[]> {
    const response = await this.client.get(`/api/highlights/book/${bookId}`);
    return response.data;
  }

  async createHighlight(highlight: Omit<Highlight, 'id' | 'created_at'>): Promise<Highlight> {
    const response = await this.client.post('/api/highlights/', highlight);
    return response.data;
  }

  async updateHighlight(
    highlightId: string,
    updates: { color?: string; note?: string }
  ): Promise<Highlight> {
    const response = await this.client.put(`/api/highlights/${highlightId}`, updates);
    return response.data;
  }

  async deleteHighlight(highlightId: string): Promise<ApiResponse<any>> {
    const response = await this.client.delete(`/api/highlights/${highlightId}`);
    return response.data;
  }

  // TTS API
  async getTTSStatus(): Promise<TTSStatus> {
    const response = await this.client.get('/api/tts/status');
    return response.data;
  }

  async getVoices(): Promise<{ voices: string[]; default: string }> {
    const response = await this.client.get('/api/tts/voices');
    return response.data;
  }

  async getPresets(): Promise<{
    presets: string[];
    default: string;
    descriptions: Record<string, string>;
  }> {
    const response = await this.client.get('/api/tts/presets');
    return response.data;
  }

  // TTS Generation with streaming
  async generateTTS(
    request: TTSRequest,
    onAudioChunk: (chunk: ArrayBuffer) => void
  ): Promise<void> {
    const response = await fetch(`${this.client.defaults.baseURL}/api/tts/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (value) {
          onAudioChunk(value.buffer);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // AI Features API
  async explainText(request: ExplanationRequest): Promise<ExplanationResponse> {
    const response = await this.client.post('/api/library/explain', request);
    return response.data;
  }

  async lookupWord(request: DictionaryRequest): Promise<DictionaryResponse> {
    const response = await this.client.post('/api/library/dictionary', request);
    return response.data;
  }

  async getReadingStats(bookId: string): Promise<ReadingStats> {
    const response = await this.client.get(`/api/library/reading-stats/${bookId}`);
    return response.data;
  }

  async getGeminiStatus(): Promise<{ available: boolean; error?: string }> {
    const response = await this.client.get('/api/library/gemini-status');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 