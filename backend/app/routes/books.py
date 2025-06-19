from fastapi import APIRouter, HTTPException, UploadFile, File, Request, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import logging
from app.services.book_service import BookService
from app.services.database import database, books

logger = logging.getLogger(__name__)

router = APIRouter()
book_service = BookService()

class BookResponse(BaseModel):
    id: str
    title: str
    author: str
    file_type: str
    file_size: int
    cover_image: Optional[str]
    upload_date: str
    last_read: Optional[str]
    current_position: Optional[Dict]
    metadata: Optional[Dict]

class ReadingPosition(BaseModel):
    book_id: str
    position: Dict[str, Any]  # Chapter ID, page number, scroll position, etc.

@router.post("/upload")
async def upload_book(file: UploadFile = File(...)):
    """Upload and process a new ebook"""
    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_ext = file.filename.lower().split('.')[-1]
        if file_ext not in ['epub', 'pdf']:
            raise HTTPException(
                status_code=400, 
                detail="Only EPUB and PDF files are supported"
            )
        
        # Read file content
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        if len(content) > 100 * 1024 * 1024:  # 100MB limit
            raise HTTPException(status_code=400, detail="File too large (max 100MB)")
        
        # Process the book
        book_data = await book_service.process_uploaded_file(content, file.filename)
        
        # Save to database
        query = books.insert().values(
            id=uuid.UUID(book_data["id"]),
            title=book_data["title"],
            author=book_data["author"],
            file_path=book_data["file_path"],
            file_type=book_data["file_type"],
            file_size=book_data["file_size"],
            cover_image=book_data.get("cover_image"),
            metadata=book_data.get("metadata", {})
        )
        
        await database.execute(query)
        
        logger.info(f"Successfully uploaded book: {book_data['title']} by {book_data['author']}")
        
        return {
            "success": True,
            "book": {
                "id": book_data["id"],
                "title": book_data["title"],
                "author": book_data["author"],
                "file_type": book_data["file_type"],
                "chapters": len(book_data.get("metadata", {}).get("chapters", [])),
                "pages": len(book_data.get("metadata", {}).get("pages", [])),
                "total_words": book_data.get("metadata", {}).get("total_words", 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading book: {e}")
        raise HTTPException(status_code=500, detail="Error processing uploaded book")

@router.get("/", response_model=List[BookResponse])
async def get_books():
    """Get all books in the library"""
    try:
        query = books.select().order_by(books.c.upload_date.desc())
        results = await database.fetch_all(query)
        
        return [
            BookResponse(
                id=str(row.id),
                title=row.title,
                author=row.author,
                file_type=row.file_type,
                file_size=row.file_size,
                cover_image=row.cover_image,
                upload_date=row.upload_date.isoformat(),
                last_read=row.last_read.isoformat() if row.last_read else None,
                current_position=row.current_position,
                metadata=row.metadata
            )
            for row in results
        ]
        
    except Exception as e:
        logger.error(f"Error fetching books: {e}")
        raise HTTPException(status_code=500, detail="Error fetching books")

@router.get("/{book_id}")
async def get_book(book_id: str):
    """Get detailed information about a specific book"""
    try:
        query = books.select().where(books.c.id == uuid.UUID(book_id))
        result = await database.fetch_one(query)
        
        if not result:
            raise HTTPException(status_code=404, detail="Book not found")
        
        return BookResponse(
            id=str(result.id),
            title=result.title,
            author=result.author,
            file_type=result.file_type,
            file_size=result.file_size,
            cover_image=result.cover_image,
            upload_date=result.upload_date.isoformat(),
            last_read=result.last_read.isoformat() if result.last_read else None,
            current_position=result.current_position,
            metadata=result.metadata
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching book {book_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching book")

@router.get("/{book_id}/content")
async def get_book_content(book_id: str, chapter_id: Optional[str] = None, page: Optional[int] = None):
    """Get book content for reading"""
    try:
        # Get book metadata
        query = books.select().where(books.c.id == uuid.UUID(book_id))
        book_result = await database.fetch_one(query)
        
        if not book_result:
            raise HTTPException(status_code=404, detail="Book not found")
        
        metadata = book_result.metadata or {}
        
        if book_result.file_type == "epub":
            chapters = metadata.get("chapters", [])
            
            if chapter_id:
                # Get specific chapter
                chapter = next((ch for ch in chapters if ch["id"] == chapter_id), None)
                if not chapter:
                    raise HTTPException(status_code=404, detail="Chapter not found")
                return {"content": chapter, "type": "chapter"}
            else:
                # Return table of contents
                return {
                    "chapters": [
                        {
                            "id": ch["id"],
                            "title": ch["title"],
                            "word_count": ch["word_count"]
                        }
                        for ch in chapters
                    ],
                    "type": "toc"
                }
        
        elif book_result.file_type == "pdf":
            pages = metadata.get("pages", [])
            
            if page is not None:
                # Get specific page
                if page < 1 or page > len(pages):
                    raise HTTPException(status_code=404, detail="Page not found")
                
                page_content = pages[page - 1]
                return {"content": page_content, "type": "page"}
            else:
                # Return page list
                return {
                    "pages": [
                        {
                            "page_number": p["page_number"],
                            "word_count": p["word_count"]
                        }
                        for p in pages
                    ],
                    "total_pages": len(pages),
                    "type": "pdf_info"
                }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching book content {book_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching book content")

@router.post("/{book_id}/position")
async def update_reading_position(book_id: str, position: ReadingPosition):
    """Update reading position for a book"""
    try:
        query = books.update().where(books.c.id == uuid.UUID(book_id)).values(
            current_position=position.position,
            last_read=database.func.now()
        )
        
        result = await database.execute(query)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Book not found")
        
        return {"success": True, "message": "Reading position updated"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID format")
    except Exception as e:
        logger.error(f"Error updating reading position: {e}")
        raise HTTPException(status_code=500, detail="Error updating reading position")

@router.delete("/{book_id}")
async def delete_book(book_id: str):
    """Delete a book from the library"""
    try:
        # Get book info first to delete file
        query = books.select().where(books.c.id == uuid.UUID(book_id))
        book_result = await database.fetch_one(query)
        
        if not book_result:
            raise HTTPException(status_code=404, detail="Book not found")
        
        # Delete from database
        delete_query = books.delete().where(books.c.id == uuid.UUID(book_id))
        await database.execute(delete_query)
        
        # Delete physical file
        try:
            import os
            if os.path.exists(book_result.file_path):
                os.remove(book_result.file_path)
        except Exception as e:
            logger.warning(f"Could not delete file {book_result.file_path}: {e}")
        
        return {"success": True, "message": "Book deleted successfully"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting book {book_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting book") 