import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Book, ReaderSettings, TTSState, Highlight } from '../types';

interface BookStore {
  books: Book[];
  currentBook: Book | null;
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  setCurrentBook: (book: Book | null) => void;
  updateBook: (bookId: string, updates: Partial<Book>) => void;
  removeBook: (bookId: string) => void;
}

interface ReaderStore {
  settings: ReaderSettings;
  isReading: boolean;
  currentChapter: string | null;
  currentPage: number | null;
  highlights: Highlight[];
  selectedText: string;
  updateSettings: (settings: Partial<ReaderSettings>) => void;
  setIsReading: (reading: boolean) => void;
  setCurrentChapter: (chapterId: string | null) => void;
  setCurrentPage: (page: number | null) => void;
  addHighlight: (highlight: Highlight) => void;
  removeHighlight: (highlightId: string) => void;
  setSelectedText: (text: string) => void;
}

interface TTSStore {
  state: TTSState;
  voices: string[];
  presets: string[];
  audioContext: AudioContext | null;
  isInitialized: boolean;
  updateState: (state: Partial<TTSState>) => void;
  setVoices: (voices: string[]) => void;
  setPresets: (presets: string[]) => void;
  initializeAudio: () => void;
  reset: () => void;
}

interface UIStore {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
  error: string | null;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Book Store
export const useBookStore = create<BookStore>()(
  devtools(
    persist(
      (set, get) => ({
        books: [],
        currentBook: null,
        setBooks: (books) => set({ books }),
        addBook: (book) => set((state) => ({ books: [...state.books, book] })),
        setCurrentBook: (book) => set({ currentBook: book }),
        updateBook: (bookId, updates) =>
          set((state) => ({
            books: state.books.map((book) =>
              book.id === bookId ? { ...book, ...updates } : book
            ),
            currentBook:
              state.currentBook?.id === bookId
                ? { ...state.currentBook, ...updates }
                : state.currentBook,
          })),
        removeBook: (bookId) =>
          set((state) => ({
            books: state.books.filter((book) => book.id !== bookId),
            currentBook:
              state.currentBook?.id === bookId ? null : state.currentBook,
          })),
      }),
      {
        name: 'book-store',
        partialize: (state) => ({ books: state.books }),
      }
    )
  )
);

// Reader Store
export const useReaderStore = create<ReaderStore>()(
  devtools(
    persist(
      (set, get) => ({
        settings: {
          fontSize: 16,
          fontFamily: 'Crimson Text',
          lineHeight: 1.6,
          theme: 'light',
          autoScroll: false,
          highlightColor: '#ffff00',
        },
        isReading: false,
        currentChapter: null,
        currentPage: null,
        highlights: [],
        selectedText: '',
        updateSettings: (settings) =>
          set((state) => ({
            settings: { ...state.settings, ...settings },
          })),
        setIsReading: (reading) => set({ isReading: reading }),
        setCurrentChapter: (chapterId) => set({ currentChapter: chapterId }),
        setCurrentPage: (page) => set({ currentPage: page }),
        addHighlight: (highlight) =>
          set((state) => ({ highlights: [...state.highlights, highlight] })),
        removeHighlight: (highlightId) =>
          set((state) => ({
            highlights: state.highlights.filter((h) => h.id !== highlightId),
          })),
        setSelectedText: (text) => set({ selectedText: text }),
      }),
      {
        name: 'reader-store',
        partialize: (state) => ({ settings: state.settings }),
      }
    )
  )
);

// TTS Store
export const useTTSStore = create<TTSStore>()(
  devtools((set, get) => ({
    state: {
      status: 'idle',
      currentSentence: 0,
      totalSentences: 0,
      voice: 'random',
      preset: 'ultra_fast',
    },
    voices: [],
    presets: [],
    audioContext: null,
    isInitialized: false,
    updateState: (newState) =>
      set((state) => ({ state: { ...state.state, ...newState } })),
    setVoices: (voices) => set({ voices }),
    setPresets: (presets) => set({ presets }),
    initializeAudio: () => {
      if (typeof window !== 'undefined' && !get().audioContext) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        set({ audioContext: context, isInitialized: true });
      }
    },
    reset: () =>
      set({
        state: {
          status: 'idle',
          currentSentence: 0,
          totalSentences: 0,
          voice: 'random',
          preset: 'ultra_fast',
        },
      }),
  }))
);

// UI Store
export const useUIStore = create<UIStore>()(
  devtools(
    persist(
      (set, get) => ({
        sidebarOpen: false,
        theme: 'light',
        loading: false,
        error: null,
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({ theme: state.theme }),
      }
    )
  )
); 