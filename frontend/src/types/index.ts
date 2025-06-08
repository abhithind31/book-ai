// Core types for the AI-Enhanced Ebook Reader

export interface Book {
  id: string;
  title: string;
  author: string;
  file_type: 'epub' | 'pdf';
  file_size: number;
  cover_image?: string;
  upload_date: string;
  last_read?: string;
  current_position?: ReadingPosition;
  metadata?: BookMetadata;
}

export interface BookMetadata {
  chapters?: Chapter[];
  pages?: Page[];
  total_chapters?: number;
  total_pages?: number;
  total_words?: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
}

export interface Page {
  page_number: number;
  content: string;
  word_count: number;
}

export interface ReadingPosition {
  chapter_id?: string;
  page_number?: number;
  scroll_position?: number;
  percentage?: number;
}

export interface Highlight {
  id: string;
  book_id: string;
  text_content: string;
  start_position: Position;
  end_position: Position;
  color: string;
  note?: string;
  created_at: string;
}

export interface Position {
  chapter_id?: string;
  page_number?: number;
  char_offset: number;
  element_id?: string;
}

export interface TTSRequest {
  text: string;
  voice: string;
  preset: string;
}

export interface TTSStatus {
  available: boolean;
  ready: boolean;
  cuda_available: boolean;
  error?: string;
}

export interface Voice {
  id: string;
  name: string;
  description?: string;
}

export interface TTSPreset {
  id: string;
  name: string;
  description: string;
}

export interface ExplanationRequest {
  text: string;
  context?: string;
}

export interface ExplanationResponse {
  explanation: string;
  simplified: string;
  key_points?: string[];
}

export interface DictionaryRequest {
  word: string;
}

export interface DictionaryResponse {
  word: string;
  definition: string;
  pronunciation?: string;
  examples?: string[];
}

export interface ReadingStats {
  book_id: string;
  total_reading_time: number;
  pages_read: number;
  reading_sessions: number;
  average_reading_speed: number;
  completion_percentage: number;
}

export interface TTSState {
  status: 'idle' | 'loading_initial' | 'playing' | 'paused' | 'finished' | 'error';
  currentSentence: number;
  totalSentences: number;
  voice: string;
  preset: string;
  error?: string;
}

export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  autoScroll: boolean;
  highlightColor: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
} 