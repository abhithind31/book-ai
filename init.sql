-- Initialize the database schema for the AI-Enhanced Personal Ebook Reader

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Books table to store uploaded ebooks
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(10) NOT NULL CHECK (file_type IN ('epub', 'pdf')),
    file_size BIGINT,
    cover_image TEXT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read TIMESTAMP,
    current_position JSONB,
    metadata JSONB
);

-- Highlights table to store user highlights
CREATE TABLE highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    start_position JSONB NOT NULL,
    end_position JSONB NOT NULL,
    color VARCHAR(7) DEFAULT '#ffff00',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reading sessions to track progress
CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    pages_read INTEGER,
    time_spent INTERVAL
);

-- TTS cache to store generated audio files
CREATE TABLE tts_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text_hash VARCHAR(64) UNIQUE NOT NULL,
    voice VARCHAR(50) NOT NULL,
    preset VARCHAR(20) NOT NULL,
    audio_file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_upload_date ON books(upload_date);
CREATE INDEX idx_highlights_book_id ON highlights(book_id);
CREATE INDEX idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX idx_tts_cache_hash ON tts_cache(text_hash);

-- Insert some sample data (optional)
INSERT INTO books (title, author, file_path, file_type, file_size) VALUES
('Sample Book', 'Sample Author', '/uploads/sample.epub', 'epub', 1024000); 