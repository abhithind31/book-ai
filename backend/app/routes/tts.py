from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    voice: str = "random"
    preset: str = "fast"

def get_tts_service():
    """Lazy-load TTS service"""
    try:
        from app.services.tts_service import tts_service
        return tts_service
    except Exception as e:
        logger.error(f"Failed to load TTS service: {e}")
        return None

@router.post("/generate")
async def generate_tts(request: TTSRequest):
    """
    Generate TTS audio for the provided text
    """
    try:
        # Get TTS service
        tts_service = get_tts_service()
        
        if not tts_service or not tts_service.is_available():
            raise HTTPException(status_code=503, detail="TTS service not available")
        
        if len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        if len(request.text) > 1000:  # Reasonable limit for single requests
            raise HTTPException(status_code=400, detail="Text too long (max 1000 characters)")
        
        logger.info(f"Generating TTS for text length: {len(request.text)} with voice: {request.voice}")
        
        # Generate audio
        audio_bytes = tts_service.text_to_speech(
            request.text, 
            request.voice, 
            request.preset
        )
        
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="Failed to generate audio")
        
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Content-Disposition": "inline; filename=speech.wav",
                "Cache-Control": "no-cache"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in TTS generation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during TTS generation")

@router.get("/voices")
async def get_available_voices():
    """Get list of available TTS voices"""
    try:
        tts_service = get_tts_service()
        
        if not tts_service:
            return {
                "voices": [],
                "default": "random",
                "available": False
            }
        
        return {
            "voices": tts_service.get_available_voices(),
            "default": "random",
            "available": tts_service.is_available()
        }
    except Exception as e:
        logger.error(f"Error getting voices: {e}")
        return {
            "voices": [],
            "default": "random", 
            "available": False,
            "error": str(e)
        }

@router.get("/presets")
async def get_available_presets():
    """Get list of available quality presets"""
    try:
        return {
            "presets": ["ultrafast", "fast", "standard", "high_quality"],
            "default": "fast",
            "descriptions": {
                "ultrafast": "Fastest generation, lower quality",
                "fast": "Fast generation, good quality",
                "standard": "Balanced speed and quality", 
                "high_quality": "Slowest generation, highest quality"
            }
        }
    except Exception as e:
        logger.error(f"Error getting presets: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving available presets")

@router.get("/status")
async def get_tts_status():
    """Get TTS service status"""
    try:
        tts_service = get_tts_service()
        
        if not tts_service:
            return {
                "available": False,
                "device": None,
                "voices_count": 0,
                "error": "TTS service not loaded"
            }
        
        return tts_service.get_service_info()
        
    except Exception as e:
        logger.error(f"Error getting TTS status: {e}")
        return {
            "available": False,
            "device": None,
            "voices_count": 0,
            "error": str(e)
        } 