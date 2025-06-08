from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import asyncio
from app.services.database import database
from app.routes import books, tts, highlights, library
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    
    # Startup
    logger.info("Starting AI-Enhanced Personal Ebook Reader...")
    
    # Connect to database
    await database.connect()
    logger.info("Database connected")
    
    # TTS service will be initialized lazily when needed
    logger.info("TTS service will be initialized when first requested")
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await database.disconnect()
    logger.info("Database disconnected")

# Create FastAPI app
app = FastAPI(
    title="AI-Enhanced Personal Ebook Reader",
    description="A powerful ebook reader with AI-powered TTS and explanations",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio cache
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers
app.include_router(books.router, prefix="/api/books", tags=["books"])
app.include_router(tts.router, prefix="/api/tts", tags=["tts"])
app.include_router(highlights.router, prefix="/api/highlights", tags=["highlights"])
app.include_router(library.router, prefix="/api/library", tags=["library"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "AI-Enhanced Personal Ebook Reader API is running"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    # Try to import TTS service to check availability
    try:
        from app.services.tts_service import tts_service
        tts_available = tts_service.is_available()
    except Exception as e:
        logger.warning(f"TTS service check failed: {e}")
        tts_available = False
    
    return {
        "status": "healthy",
        "database": "connected" if database.is_connected else "disconnected",
        "tts_service": "available" if tts_available else "not available"
    } 