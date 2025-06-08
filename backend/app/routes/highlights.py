from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import logging
from app.services.database import database, highlights

logger = logging.getLogger(__name__)

router = APIRouter()

class HighlightCreate(BaseModel):
    book_id: str
    text_content: str
    start_position: Dict[str, Any]
    end_position: Dict[str, Any]
    color: str = "#ffff00"
    note: Optional[str] = None

class HighlightResponse(BaseModel):
    id: str
    book_id: str
    text_content: str
    start_position: Dict[str, Any]
    end_position: Dict[str, Any]
    color: str
    note: Optional[str]
    created_at: str

class HighlightUpdate(BaseModel):
    color: Optional[str] = None
    note: Optional[str] = None

@router.post("/", response_model=HighlightResponse)
async def create_highlight(highlight: HighlightCreate):
    """Create a new highlight"""
    try:
        highlight_id = uuid.uuid4()
        
        query = highlights.insert().values(
            id=highlight_id,
            book_id=uuid.UUID(highlight.book_id),
            text_content=highlight.text_content,
            start_position=highlight.start_position,
            end_position=highlight.end_position,
            color=highlight.color,
            note=highlight.note
        )
        
        await database.execute(query)
        
        # Fetch the created highlight
        select_query = highlights.select().where(highlights.c.id == highlight_id)
        result = await database.fetch_one(select_query)
        
        return HighlightResponse(
            id=str(result.id),
            book_id=str(result.book_id),
            text_content=result.text_content,
            start_position=result.start_position,
            end_position=result.end_position,
            color=result.color,
            note=result.note,
            created_at=result.created_at.isoformat()
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID format")
    except Exception as e:
        logger.error(f"Error creating highlight: {e}")
        raise HTTPException(status_code=500, detail="Error creating highlight")

@router.get("/book/{book_id}", response_model=List[HighlightResponse])
async def get_book_highlights(book_id: str):
    """Get all highlights for a specific book"""
    try:
        query = highlights.select().where(
            highlights.c.book_id == uuid.UUID(book_id)
        ).order_by(highlights.c.created_at.asc())
        
        results = await database.fetch_all(query)
        
        return [
            HighlightResponse(
                id=str(row.id),
                book_id=str(row.book_id),
                text_content=row.text_content,
                start_position=row.start_position,
                end_position=row.end_position,
                color=row.color,
                note=row.note,
                created_at=row.created_at.isoformat()
            )
            for row in results
        ]
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid book ID format")
    except Exception as e:
        logger.error(f"Error fetching highlights for book {book_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching highlights")

@router.get("/", response_model=List[HighlightResponse])
async def get_all_highlights():
    """Get all highlights across all books"""
    try:
        query = highlights.select().order_by(highlights.c.created_at.desc())
        results = await database.fetch_all(query)
        
        return [
            HighlightResponse(
                id=str(row.id),
                book_id=str(row.book_id),
                text_content=row.text_content,
                start_position=row.start_position,
                end_position=row.end_position,
                color=row.color,
                note=row.note,
                created_at=row.created_at.isoformat()
            )
            for row in results
        ]
        
    except Exception as e:
        logger.error(f"Error fetching all highlights: {e}")
        raise HTTPException(status_code=500, detail="Error fetching highlights")

@router.put("/{highlight_id}", response_model=HighlightResponse)
async def update_highlight(highlight_id: str, update: HighlightUpdate):
    """Update a highlight"""
    try:
        # Build update values
        update_values = {}
        if update.color is not None:
            update_values["color"] = update.color
        if update.note is not None:
            update_values["note"] = update.note
        
        if not update_values:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        query = highlights.update().where(
            highlights.c.id == uuid.UUID(highlight_id)
        ).values(**update_values)
        
        result = await database.execute(query)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Highlight not found")
        
        # Fetch updated highlight
        select_query = highlights.select().where(highlights.c.id == uuid.UUID(highlight_id))
        updated_highlight = await database.fetch_one(select_query)
        
        return HighlightResponse(
            id=str(updated_highlight.id),
            book_id=str(updated_highlight.book_id),
            text_content=updated_highlight.text_content,
            start_position=updated_highlight.start_position,
            end_position=updated_highlight.end_position,
            color=updated_highlight.color,
            note=updated_highlight.note,
            created_at=updated_highlight.created_at.isoformat()
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid highlight ID format")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating highlight {highlight_id}: {e}")
        raise HTTPException(status_code=500, detail="Error updating highlight")

@router.delete("/{highlight_id}")
async def delete_highlight(highlight_id: str):
    """Delete a highlight"""
    try:
        query = highlights.delete().where(highlights.c.id == uuid.UUID(highlight_id))
        result = await database.execute(query)
        
        if result == 0:
            raise HTTPException(status_code=404, detail="Highlight not found")
        
        return {"success": True, "message": "Highlight deleted successfully"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid highlight ID format")
    except Exception as e:
        logger.error(f"Error deleting highlight {highlight_id}: {e}")
        raise HTTPException(status_code=500, detail="Error deleting highlight") 