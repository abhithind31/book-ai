import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookStore, useUIStore } from '../store';
import { BookCard } from '../components/BookCard';
import { apiService } from '../services/api';

export const LibraryPage: React.FC = () => {
  const { books, setBooks, removeBook } = useBookStore();
  const { setLoading, setError } = useUIStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'epub' | 'pdf'>('all');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const booksData = await apiService.getBooks();
      setBooks(booksData);
    } catch (error) {
      setError('Failed to load books');
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await apiService.deleteBook(bookId);
        removeBook(bookId);
      } catch (error) {
        setError('Failed to delete book');
        console.error('Failed to delete book:', error);
      }
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFileType = fileTypeFilter === 'all' || book.file_type === fileTypeFilter;
    return matchesSearch && matchesFileType;
  });

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Library</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and organize your digital book collection</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <select 
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value as 'all' | 'epub' | 'pdf')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Books</option>
              <option value="epub">EPUB</option>
              <option value="pdf">PDF</option>
            </select>
          </div>
          <Link 
            to="/upload"
            className="btn-primary whitespace-nowrap"
          >
            + Upload Book
          </Link>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Upload your first ebook to get started</p>
            <Link to="/upload" className="btn-primary">
              Upload Your First Book
            </Link>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books found</h3>
            <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredBooks.length} of {books.length} books
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onDelete={handleDeleteBook}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 