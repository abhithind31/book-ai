import os
import uuid
import logging
import zipfile
import xml.etree.ElementTree as ET
from typing import Optional, Dict, List, Any
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
import PyPDF2
from io import BytesIO
import json
import base64
from PIL import Image

logger = logging.getLogger(__name__)

class BookService:
    """Service for processing and managing ebook files"""
    
    def __init__(self, upload_dir: str = "/app/uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)
    
    async def process_uploaded_file(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process an uploaded ebook file and extract metadata and content"""
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        file_ext = filename.lower().split('.')[-1]
        
        if file_ext not in ['epub', 'pdf']:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Save file
        file_path = os.path.join(self.upload_dir, f"{file_id}.{file_ext}")
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Process based on file type
        if file_ext == 'epub':
            return await self._process_epub(file_path, filename, file_id)
        elif file_ext == 'pdf':
            return await self._process_pdf(file_path, filename, file_id)
    
    async def _process_epub(self, file_path: str, original_filename: str, file_id: str) -> Dict[str, Any]:
        """Process EPUB file and extract metadata and content"""
        try:
            book = epub.read_epub(file_path)
            
            # Extract metadata
            title = book.get_metadata('DC', 'title')[0][0] if book.get_metadata('DC', 'title') else original_filename
            authors = book.get_metadata('DC', 'creator')
            author = authors[0][0] if authors else "Unknown Author"
            
            # Extract cover image
            cover_image = None
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_COVER:
                    cover_image = base64.b64encode(item.get_content()).decode()
                    break
            
            # If no cover found, try to find first image
            if not cover_image:
                for item in book.get_items():
                    if item.get_type() == ebooklib.ITEM_IMAGE:
                        cover_image = base64.b64encode(item.get_content()).decode()
                        break
            
            # Extract text content by chapters
            chapters = []
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    soup = BeautifulSoup(item.get_content(), 'html.parser')
                    
                    # Remove script and style elements
                    for script in soup(["script", "style"]):
                        script.decompose()
                    
                    # Get text content
                    text = soup.get_text()
                    
                    # Clean up whitespace
                    lines = (line.strip() for line in text.splitlines())
                    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                    text = ' '.join(chunk for chunk in chunks if chunk)
                    
                    if len(text.strip()) > 100:  # Only include substantial content
                        chapters.append({
                            "id": item.get_id(),
                            "title": self._extract_chapter_title(soup),
                            "content": text,
                            "word_count": len(text.split())
                        })
            
            return {
                "id": file_id,
                "title": title,
                "author": author,
                "file_path": file_path,
                "file_type": "epub",
                "file_size": os.path.getsize(file_path),
                "cover_image": cover_image,
                "metadata": {
                    "chapters": chapters,
                    "total_chapters": len(chapters),
                    "total_words": sum(ch["word_count"] for ch in chapters)
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing EPUB file: {e}")
            raise
    
    async def _process_pdf(self, file_path: str, original_filename: str, file_id: str) -> Dict[str, Any]:
        """Process PDF file and extract metadata and content"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                
                # Extract metadata
                info = pdf_reader.metadata
                title = info.title if info and info.title else original_filename
                author = info.author if info and info.author else "Unknown Author"
                
                # Extract text content by pages
                pages = []
                for page_num, page in enumerate(pdf_reader.pages):
                    text = page.extract_text()
                    
                    if text.strip():
                        pages.append({
                            "page_number": page_num + 1,
                            "content": text,
                            "word_count": len(text.split())
                        })
                
                return {
                    "id": file_id,
                    "title": title,
                    "author": author,
                    "file_path": file_path,
                    "file_type": "pdf",
                    "file_size": os.path.getsize(file_path),
                    "metadata": {
                        "pages": pages,
                        "total_pages": len(pages),
                        "total_words": sum(p["word_count"] for p in pages)
                    }
                }
                
        except Exception as e:
            logger.error(f"Error processing PDF file: {e}")
            raise
    
    def _extract_chapter_title(self, soup: BeautifulSoup) -> str:
        """Extract chapter title from HTML content"""
        # Look for common heading tags
        for tag in ['h1', 'h2', 'h3']:
            heading = soup.find(tag)
            if heading and heading.get_text().strip():
                return heading.get_text().strip()
        
        # Fallback to first strong text
        strong = soup.find('strong')
        if strong and strong.get_text().strip():
            return strong.get_text().strip()
        
        return "Untitled Chapter"
    
    def get_book_content(self, book_id: str, chapter_id: Optional[str] = None, page_number: Optional[int] = None) -> Dict[str, Any]:
        """Get specific content from a book"""
        # This would typically load from database
        # For now, we'll implement basic file reading
        pass
    
    def get_text_for_tts(self, book_id: str, start_position: Dict, end_position: Dict) -> str:
        """Extract text content for TTS generation"""
        # This would extract text based on position markers
        # Implementation depends on how positions are stored
        pass 