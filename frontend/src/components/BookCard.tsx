import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  onDelete?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onDelete }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getReadingProgress = () => {
    if (book.current_position?.percentage) {
      return Math.round(book.current_position.percentage * 100);
    }
    return 0;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="relative">
        {/* Cover Image */}
        <div className="aspect-[3/4] bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
          {book.cover_image ? (
            <img
              src={book.cover_image}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {book.title}
              </p>
            </div>
          )}
        </div>

        {/* File type badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            book.file_type === 'epub' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
          }`}>
            {book.file_type.toUpperCase()}
          </span>
        </div>

        {/* Reading Progress */}
        {getReadingProgress() > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
            <div className="flex items-center justify-between text-xs">
              <span>{getReadingProgress()}% complete</span>
              <div className="w-16 bg-gray-600 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${getReadingProgress()}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Title and Author */}
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          {book.author}
        </p>

        {/* Metadata */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 space-y-1">
          <div className="flex justify-between">
            <span>Size:</span>
            <span>{formatFileSize(book.file_size)}</span>
          </div>
          <div className="flex justify-between">
            <span>Added:</span>
            <span>{formatDate(book.upload_date)}</span>
          </div>
          {book.last_read && (
            <div className="flex justify-between">
              <span>Last read:</span>
              <span>{formatDate(book.last_read)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link
            to={`/reader/${book.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors text-center"
          >
            {getReadingProgress() > 0 ? 'Continue Reading' : 'Start Reading'}
          </Link>
          
          <button
            onClick={() => onDelete?.(book.id)}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete book"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}; 