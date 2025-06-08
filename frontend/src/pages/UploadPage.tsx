import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore, useUIStore } from '../store';
import { apiService } from '../services/api';
import { UploadProgress } from '../types';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { addBook } = useBookStore();
  const { setError } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const acceptedFileTypes = '.epub,.pdf';
  const maxFileSize = 100 * 1024 * 1024; // 100MB

  const validateFile = (file: File): string | null => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!fileExtension || !['epub', 'pdf'].includes(fileExtension)) {
      return 'Only EPUB and PDF files are supported';
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 100MB';
    }
    return null;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(async (file) => {
      const error = validateFile(file);
      if (error) {
        setError(error);
        return;
      }

      const progress: UploadProgress = {
        filename: file.name,
        progress: 0,
        status: 'uploading'
      };

      setUploadProgress(prev => [...prev, { ...progress }]);

      try {
        const response = await apiService.uploadBook(file, (progressPercent) => {
          setUploadProgress(prev => 
            prev.map(p => 
              p.filename === file.name 
                ? { ...p, progress: progressPercent }
                : p
            )
          );
        });

        if (response.success && response.data) {
          setUploadProgress(prev => 
            prev.map(p => 
              p.filename === file.name 
                ? { ...p, status: 'processing', progress: 100 }
                : p
            )
          );

          // Add book to store
          addBook(response.data);

          setTimeout(() => {
            setUploadProgress(prev => 
              prev.map(p => 
                p.filename === file.name 
                  ? { ...p, status: 'complete' }
                  : p
              )
            );
          }, 1000);

          setTimeout(() => {
            setUploadProgress(prev => prev.filter(p => p.filename !== file.name));
          }, 3000);

        } else {
          throw new Error(response.error || 'Upload failed');
        }
      } catch (error) {
        setUploadProgress(prev => 
          prev.map(p => 
            p.filename === file.name 
              ? { 
                  ...p, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Upload failed' 
                }
              : p
          )
        );
        setError(`Failed to upload ${file.name}`);
      }
    });
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading': return 'text-blue-600';
      case 'processing': return 'text-yellow-600';
      case 'complete': return 'text-green-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: UploadProgress['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'complete': return 'Complete!';
      case 'error': return 'Error';
      default: return 'Pending';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Books</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add EPUB and PDF files to your digital library
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedFileTypes}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="space-y-4">
            <div className="text-6xl">📚</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Drop your books here, or click to browse
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Supports EPUB and PDF files up to 100MB
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Select Files
              </button>
            </div>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Progress</h3>
            <div className="space-y-3">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {progress.filename}
                    </span>
                    <span className={`text-sm font-medium ${getStatusColor(progress.status)}`}>
                      {getStatusText(progress.status)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress.status === 'error' 
                          ? 'bg-red-500' 
                          : progress.status === 'complete'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  
                  {progress.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                      {progress.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Supported Features
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">File Formats</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• EPUB (recommended for fiction)</li>
                <li>• PDF (for technical books and documents)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Features</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Text-to-speech with natural voices</li>
                <li>• AI-powered explanations</li>
                <li>• Smart dictionary lookups</li>
                <li>• Highlighting and notes</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/library')}
            className="btn-secondary"
          >
            Back to Library
          </button>
        </div>
      </div>
    </div>
  );
}; 