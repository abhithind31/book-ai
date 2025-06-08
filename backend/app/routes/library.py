from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import logging
import os

# Try to import Google Generative AI, make it optional
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
    
    # Configure Gemini API
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
    else:
        GENAI_AVAILABLE = False
        
except ImportError as e:
    GENAI_AVAILABLE = False
    genai = None

logger = logging.getLogger(__name__)

router = APIRouter()

class ExplanationRequest(BaseModel):
    text: str
    context: Optional[str] = None  # Additional context like book title, chapter, etc.

class DictionaryRequest(BaseModel):
    word: str

class ExplanationResponse(BaseModel):
    explanation: str
    simplified: str
    key_points: Optional[list] = None

class DictionaryResponse(BaseModel):
    word: str
    definition: str
    pronunciation: Optional[str] = None
    examples: Optional[list] = None

@router.post("/explain", response_model=ExplanationResponse)
async def explain_text(request: ExplanationRequest):
    """Get AI-powered explanation of selected text"""
    if not GENAI_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="AI explanation service not available - Google Generative AI not configured"
        )
    
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if len(request.text) > 2000:
            raise HTTPException(status_code=400, detail="Text too long for explanation (max 2000 characters)")
        
        # Create the prompt for Gemini
        prompt = f"""
Please provide a clear, educational explanation of the following text. Break it down in a way that would help someone understand the meaning, context, and significance.

Text to explain: "{request.text}"

{f"Additional context: {request.context}" if request.context else ""}

Please provide:
1. A detailed explanation of what this text means
2. A simplified version for easier understanding
3. Key points or concepts mentioned (if applicable)

Format your response as a structured explanation that would help a student or reader better understand this passage.
"""
        
        # Generate explanation using Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        if not response.text:
            raise HTTPException(status_code=500, detail="No explanation generated")
        
        # Parse the response (basic parsing - could be enhanced with more structured prompts)
        explanation_text = response.text
        
        # Try to extract simplified version and key points
        lines = explanation_text.split('\n')
        explanation = explanation_text
        simplified = "This text discusses the main concepts and ideas presented in the selected passage."
        key_points = []
        
        # Basic parsing for structured response
        current_section = None
        for line in lines:
            line = line.strip()
            if 'simplified' in line.lower() or 'simple' in line.lower():
                current_section = 'simplified'
            elif 'key points' in line.lower() or 'main points' in line.lower():
                current_section = 'key_points'
            elif line.startswith('•') or line.startswith('-') or line.startswith('*'):
                if current_section == 'key_points':
                    key_points.append(line[1:].strip())
            elif current_section == 'simplified' and line and not line.startswith('#'):
                simplified = line
        
        return ExplanationResponse(
            explanation=explanation,
            simplified=simplified,
            key_points=key_points if key_points else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating explanation: {e}")
        raise HTTPException(status_code=500, detail="Error generating explanation")

@router.post("/dictionary", response_model=DictionaryResponse)
async def lookup_word(request: DictionaryRequest):
    """Look up word definition using AI"""
    if not GENAI_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="AI dictionary service not available - Google Generative AI not configured"
        )
    
    try:
        if not request.word.strip():
            raise HTTPException(status_code=400, detail="Word cannot be empty")
        
        word = request.word.strip().lower()
        
        if len(word) > 100:
            raise HTTPException(status_code=400, detail="Word too long")
        
        # Create the prompt for dictionary lookup
        prompt = f"""
Provide a comprehensive dictionary definition for the word: "{word}"

Please include:
1. The primary definition
2. Pronunciation guide (if applicable)
3. 2-3 example sentences showing how the word is used
4. Any alternative meanings or contexts

Format this as a clear, educational dictionary entry.
"""
        
        # Generate definition using Gemini
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        
        if not response.text:
            raise HTTPException(status_code=500, detail="No definition generated")
        
        definition_text = response.text
        
        # Basic parsing for structured response
        lines = definition_text.split('\n')
        definition = definition_text
        pronunciation = None
        examples = []
        
        # Try to extract examples
        for line in lines:
            line = line.strip()
            if 'example' in line.lower() and (':' in line or '-' in line):
                example = line.split(':', 1)[-1].split('-', 1)[-1].strip()
                if example:
                    examples.append(example)
            elif line.startswith('"') and line.endswith('"'):
                examples.append(line[1:-1])
        
        return DictionaryResponse(
            word=request.word,
            definition=definition,
            pronunciation=pronunciation,
            examples=examples if examples else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error looking up word '{request.word}': {e}")
        raise HTTPException(status_code=500, detail="Error looking up word")

@router.get("/reading-stats/{book_id}")
async def get_reading_stats(book_id: str):
    """Get reading statistics for a book"""
    try:
        # This would typically calculate from reading_sessions table
        # For now, return basic structure
        return {
            "book_id": book_id,
            "total_reading_time": 0,
            "pages_read": 0,
            "reading_sessions": 0,
            "average_reading_speed": 0,  # words per minute
            "completion_percentage": 0
        }
        
    except Exception as e:
        logger.error(f"Error fetching reading stats for book {book_id}: {e}")
        raise HTTPException(status_code=500, detail="Error fetching reading statistics")

@router.get("/gemini-status")
async def get_gemini_status():
    """Check if Gemini API is properly configured"""
    try:
        if not GENAI_AVAILABLE:
            return {
                "available": False,
                "error": "Google Generative AI not available or GEMINI_API_KEY not configured"
            }
        
        api_key = os.getenv("GEMINI_API_KEY")
        
        if not api_key:
            return {
                "available": False,
                "error": "GEMINI_API_KEY not configured"
            }
        
        # Test API connection with a simple request
        model = genai.GenerativeModel('gemini-pro')
        test_response = model.generate_content("Say 'Hello' if you can respond")
        
        return {
            "available": True,
            "model": "gemini-pro",
            "status": "ready"
        }
        
    except Exception as e:
        logger.error(f"Error checking Gemini status: {e}")
        return {
            "available": False,
            "error": str(e)
        } 