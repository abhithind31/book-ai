import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useUIStore, useTTSStore } from './store';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LibraryPage } from './pages/LibraryPage';
import { ReaderPage } from './pages/ReaderPage';
import { UploadPage } from './pages/UploadPage';
import { SettingsPage } from './pages/SettingsPage';
import './styles/globals.css';

function App() {
  const { theme, loading, error, setError } = useUIStore();
  const { initializeAudio } = useTTSStore();

  useEffect(() => {
    // Initialize audio context on user interaction
    const handleUserInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [initializeAudio]);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <Router>
          <div className="flex flex-col h-screen">
            <Navbar />
            
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              
              <main className="flex-1 overflow-auto">
                {loading && <LoadingSpinner />}
                
                {error && (
                  <div className="fixed top-4 right-4 z-50">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
                      <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                          onClick={() => setError(null)}
                          className="ml-4 text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <Routes>
                  <Route path="/" element={<Navigate to="/library" replace />} />
                  <Route path="/library" element={<LibraryPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/reader/:bookId" element={<ReaderPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App; 