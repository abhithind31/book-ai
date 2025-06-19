import os
from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, DateTime, Text, BigInteger, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from databases import Database
import uuid

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://bookuser:bookpass@db:5432/bookreader")

# Create database instance
database = Database(DATABASE_URL)
metadata = MetaData()

# Define tables
books = Table(
    "books",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("title", String(255), nullable=False),
    Column("author", String(255)),
    Column("file_path", String(500), nullable=False),
    Column("file_type", String(10), nullable=False),
    Column("file_size", BigInteger),
    Column("cover_image", Text),
    Column("upload_date", DateTime, default=func.now()),
    Column("last_read", DateTime),
    Column("current_position", JSONB),
    Column("metadata", JSONB),
)

highlights = Table(
    "highlights",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("book_id", UUID(as_uuid=True)),
    Column("text_content", Text, nullable=False),
    Column("start_position", JSONB, nullable=False),
    Column("end_position", JSONB, nullable=False),
    Column("color", String(7), default="#ffff00"),
    Column("note", Text),
    Column("created_at", DateTime, default=func.now()),
)

reading_sessions = Table(
    "reading_sessions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("book_id", UUID(as_uuid=True)),
    Column("start_time", DateTime, default=func.now()),
    Column("end_time", DateTime),
    Column("pages_read", Integer),
    Column("time_spent", Integer),  # in seconds
)

tts_cache = Table(
    "tts_cache",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("text_hash", String(64), unique=True, nullable=False),
    Column("voice", String(50), nullable=False),
    Column("preset", String(20), nullable=False),
    Column("audio_file_path", String(500), nullable=False),
    Column("created_at", DateTime, default=func.now()),
    Column("last_accessed", DateTime, default=func.now()),
)

# Create engine for metadata operations
engine = create_engine(DATABASE_URL) 