import os
import hashlib
import asyncio
import logging
from typing import Optional, Generator, List, Dict, Any
import io
import wave
from concurrent.futures import ThreadPoolExecutor
import threading
import re
import time

# Try to import TTS dependencies, make them optional
try:
    import torch
    import torchaudio
    import numpy as np
    from tortoise.api import TextToSpeech
    from tortoise.utils.audio import load_voices, get_voice_dir
    from tortoise.utils.text import split_and_recombine_text
    import nltk
    from nltk.tokenize import sent_tokenize
    TORTOISE_AVAILABLE = True
    logger.info("Tortoise TTS loaded successfully")
except ImportError as e:
    logger.warning(f"Tortoise TTS not available: {e}")
    TORTOISE_AVAILABLE = False
    torch = None
    torchaudio = None
    np = None
    TextToSpeech = None
    load_voices = None
    nltk = None
    sent_tokenize = None

logger = logging.getLogger(__name__)

class TTSService:
    """Tortoise TTS service with caching and streaming capabilities"""
    
    def __init__(self):
        self.tts = None
        self.device = None
        self.available_voices = []
        
        if TORTOISE_AVAILABLE:
            try:
                self._initialize_tortoise()
            except Exception as e:
                logger.error(f"Failed to initialize TTS: {e}")
                self.tts = None
        else:
            logger.warning("TTS service not available - Tortoise TTS dependencies not installed")
        
    def _initialize_tortoise(self):
        """Initialize Tortoise TTS"""
        if not TORTOISE_AVAILABLE:
            raise ImportError("Tortoise TTS dependencies not available")
            
        # Set device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
        # Initialize TTS
        self.tts = TextToSpeech(device=self.device)
        
        # Load available voices
        self._load_available_voices()
        
        logger.info("Tortoise TTS initialized successfully")
    
    def _load_available_voices(self):
        """Load list of available voices"""
        if not self.tts:
            return
            
        try:
            voice_dir = get_voice_dir()
            if os.path.exists(voice_dir):
                self.available_voices = [
                    d for d in os.listdir(voice_dir) 
                    if os.path.isdir(os.path.join(voice_dir, d))
                ]
            
            # Add default voices
            default_voices = ['angie', 'daniel', 'deniro', 'emma', 'freeman', 'geralt', 'halle', 'jlaw', 'lj', 'mol', 'pat', 'pat2', 'rainbow', 'snakes', 'tim_reynolds', 'tom', 'weaver', 'william']
            for voice in default_voices:
                if voice not in self.available_voices:
                    self.available_voices.append(voice)
                    
            logger.info(f"Loaded {len(self.available_voices)} voices")
            
        except Exception as e:
            logger.error(f"Error loading voices: {e}")
            self.available_voices = ['random']  # Fallback
    
    def is_available(self) -> bool:
        """Check if TTS service is available"""
        return TORTOISE_AVAILABLE and self.tts is not None
    
    def get_available_voices(self) -> List[str]:
        """Get list of available voice names"""
        return self.available_voices.copy() if self.available_voices else []
    
    def text_to_speech(
        self, 
        text: str, 
        voice: str = "random",
        preset: str = "fast",
        temperature: float = 0.7
    ) -> Optional[bytes]:
        """
        Convert text to speech using Tortoise TTS
        
        Args:
            text: Text to convert to speech
            voice: Voice name to use
            preset: Generation preset (ultrafast, fast, standard, high_quality)
            temperature: Sampling temperature (0.1 to 1.0)
        
        Returns:
            Audio bytes in WAV format, or None if TTS is not available
        """
        if not self.is_available():
            logger.warning("TTS service not available")
            return None
            
        try:
            logger.info(f"Generating speech for text: '{text[:50]}...' with voice: {voice}")
            
            # Clean and prepare text
            text = self._clean_text(text)
            if not text.strip():
                logger.warning("Empty text provided for TTS")
                return None
            
            # Split text into manageable chunks
            text_chunks = split_and_recombine_text(text)
            
            audio_chunks = []
            
            for chunk in text_chunks:
                if not chunk.strip():
                    continue
                    
                logger.debug(f"Processing chunk: '{chunk[:30]}...'")
                
                # Generate audio for this chunk
                gen = self.tts.tts_with_preset(
                    chunk,
                    voice_samples=None,
                    conditioning_latents=None,
                    preset=preset,
                    k=1,
                    temperature=temperature
                )
                
                audio_chunks.append(gen.squeeze(0).cpu())
            
            if not audio_chunks:
                logger.warning("No audio generated")
                return None
            
            # Concatenate audio chunks
            if len(audio_chunks) == 1:
                final_audio = audio_chunks[0]
            else:
                final_audio = torch.cat(audio_chunks, dim=-1)
            
            # Convert to bytes
            audio_bytes = self._audio_to_bytes(final_audio)
            
            logger.info(f"Successfully generated {len(audio_bytes)} bytes of audio")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        """Clean text for TTS processing"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove or replace problematic characters
        text = text.replace('\n', ' ')
        text = text.replace('\t', ' ')
        
        # Limit length (Tortoise works better with shorter texts)
        max_length = 500
        if len(text) > max_length:
            # Try to cut at sentence boundary
            sentences = text.split('.')
            result = ""
            for sentence in sentences:
                if len(result + sentence) < max_length:
                    result += sentence + "."
                else:
                    break
            text = result.strip() or text[:max_length]
        
        return text.strip()
    
    def _audio_to_bytes(self, audio_tensor: 'torch.Tensor') -> bytes:
        """Convert audio tensor to WAV bytes"""
        if not TORTOISE_AVAILABLE:
            return b''
            
        buffer = io.BytesIO()
        
        # Ensure audio is in the right format
        if audio_tensor.dim() == 1:
            audio_tensor = audio_tensor.unsqueeze(0)
        
        # Save as WAV
        torchaudio.save(
            buffer, 
            audio_tensor, 
            sample_rate=24000,  # Tortoise output sample rate
            format="wav"
        )
        
        return buffer.getvalue()
    
    def get_service_info(self) -> Dict[str, Any]:
        """Get information about the TTS service"""
        return {
            "available": self.is_available(),
            "device": str(self.device) if self.device else None,
            "voices_count": len(self.available_voices),
            "voices": self.get_available_voices()[:10],  # First 10 voices
            "tortoise_available": TORTOISE_AVAILABLE
        }

# Global TTS service instance
tts_service = TTSService() 