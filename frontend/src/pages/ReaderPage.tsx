import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookStore, useReaderStore, useUIStore } from '../store';
import { TTSPlayer } from '../components/TTSPlayer';
import { apiService } from '../services/api';

export const ReaderPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { currentBook, setCurrentBook, books } = useBookStore();
  const { settings, selectedText, setSelectedText } = useReaderStore();
  const { setLoading, setError } = useUIStore();
  
  const [content, setContent] = useState<string>('');
  const [showTTSPlayer, setShowTTSPlayer] = useState(false);
  const [ttsText, setTTSText] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiResponse, setAIResponse] = useState<string>('');
  const [aiLoading, setAILoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bookId) {
      loadBook();
    }
  }, [bookId]);

  const loadBook = async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      
      // Find book in store first
      let book = books.find(b => b.id === bookId);
      if (!book) {
        book = await apiService.getBook(bookId);
      }
      
      setCurrentBook(book);
      
      // Load book content
      const contentData = await apiService.getBookContent(bookId);
      setContent(contentData.content || 'Book content not available');
      
    } catch (error) {
      setError('Failed to load book');
      console.error('Failed to load book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleTTSRequest = (text?: string) => {
    const textToSpeak = text || selectedText || content.substring(0, 1000);
    setTTSText(textToSpeak);
    setShowTTSPlayer(true);
  };

  const handleExplainText = async () => {
    if (!selectedText) return;
    
    setAILoading(true);
    setShowAIPanel(true);
    
    try {
      const response = await apiService.explainText({
        text: selectedText,
        context: content.substring(0, 500)
      });
      setAIResponse(response.explanation);
    } catch (error) {
      setAIResponse('Failed to get explanation. Please try again.');
      console.error('AI explanation failed:', error);
    } finally {
      setAILoading(false);
    }
  };

  const handleDictionaryLookup = async (word: string) => {
    setAILoading(true);
    setShowAIPanel(true);
    
    try {
      const response = await apiService.lookupWord({ word });
      setAIResponse(`**${response.word}**\n\n${response.definition}\n\n${response.examples?.join('\n') || ''}`);
    } catch (error) {
      setAIResponse('Failed to look up word. Please try again.');
      console.error('Dictionary lookup failed:', error);
    } finally {
      setAILoading(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const word = selection.toString().trim().replace(/[^\w]/g, '');
      if (word) {
        handleDictionaryLookup(word);
      }
    }
  };

  if (!currentBook) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Book not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The requested book could not be loaded.</p>
          <button
            onClick={() => navigate('/library')}
            className="btn-primary"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/library')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {currentBook.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  by {currentBook.author}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleTTSRequest()}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Text-to-Speech"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m0 0l-6.01 6.016c-.5.5-1.286.755-2.059.755-.772 0-1.558-.255-2.059-.755C4.908 20.552 4.653 19.766 4.653 18.994s.255-1.558.755-2.059L11.424 11.9" />
                </svg>
              </button>
              
              {selectedText && (
                <button
                  onClick={handleExplainText}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Explain selected text"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364-.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => setShowAIPanel(!showAIPanel)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="AI Panel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Reading Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            <div
              ref={contentRef}
              className={`
                reading-font prose prose-lg max-w-none
                ${settings.theme === 'dark' ? 'prose-invert' : ''}
              `}
              style={{
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                fontFamily: settings.fontFamily,
              }}
              onMouseUp={handleTextSelection}
              onDoubleClick={handleDoubleClick}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
              <button
                onClick={() => setShowAIPanel(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
            {selectedText && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium mb-1">Selected:</p>
                <p className="text-sm text-blue-700 dark:text-blue-200">{selectedText}</p>
              </div>
            )}
            
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : aiResponse ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: aiResponse.replace(/\n/g, '<br>') }} />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm">Select text and click the explain button or double-click a word for AI assistance.</p>
              </div>
            )}
          </div>
          
          {selectedText && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <button
                  onClick={handleExplainText}
                  className="w-full btn-primary text-sm"
                >
                  Explain Text
                </button>
                <button
                  onClick={() => handleTTSRequest(selectedText)}
                  className="w-full btn-secondary text-sm"
                >
                  Read Aloud
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TTS Player */}
      {showTTSPlayer && (
        <TTSPlayer
          text={ttsText}
          onClose={() => setShowTTSPlayer(false)}
        />
      )}
    </div>
  );
}; 