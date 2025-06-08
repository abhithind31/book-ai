# AI-Enhanced Personal Ebook Reader

Transform your personal digital library into an interactive and accessible experience with AI-powered features.

## 🌟 Features

- **📚 Universal Ebook Support**: Upload and read EPUB and PDF files
- **🎙️ Lifelike Text-to-Speech**: Convert any book into a high-quality audiobook using Tortoise TTS
- **🤖 AI-Powered Explanations**: Get instant explanations of complex text using Google's Gemini AI
- **📖 Smart Dictionary**: Look up word definitions with AI assistance
- **✨ Highlighting & Notes**: Save important passages and add personal notes
- **📊 Reading Progress**: Track your reading sessions and progress
- **🔒 Privacy-First**: All processing happens locally on your machine

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- NVIDIA GPU (recommended for TTS performance)
- Google Gemini API key (for AI features)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd book-reader
   ```

2. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Database: localhost:5432

### Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add it to your `.env` file

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **FastAPI** for REST API
- **Tortoise TTS** for high-quality speech synthesis
- **Google Gemini** for AI explanations and dictionary
- **PostgreSQL** for data storage
- **Docker** with CUDA support

### Frontend (React/TypeScript)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Web Audio API** for streaming audio playback

## 📁 Project Structure

```
book-reader/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── models/         # Data models
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom hooks
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── init.sql               # Database schema
└── README.md
```

## 🎯 Key Features Explained

### Tortoise TTS Integration
- Models are loaded once on startup for optimal performance
- Sentence-by-sentence streaming for responsive audio playback
- GPU acceleration when available
- Multiple voice options and quality presets

### AI-Powered Reading Assistant
- **Text Explanations**: Select any passage for detailed AI explanations
- **Smart Dictionary**: Instant word definitions with examples
- **Context Awareness**: AI considers the book context for better explanations

### Advanced Reading Experience
- **Responsive Design**: Works on desktop and mobile
- **Reading Progress**: Automatic bookmark saving
- **Highlight Management**: Color-coded highlights with notes
- **Search & Navigation**: Quick access to chapters and pages

## 🔧 Development

### Running in Development Mode

1. **Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Database**
   ```bash
   docker run -d \
     --name postgres \
     -e POSTGRES_DB=bookreader \
     -e POSTGRES_USER=bookuser \
     -e POSTGRES_PASSWORD=bookpass \
     -p 5432:5432 \
     postgres:15
   ```

### API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.

## 🐳 Docker Configuration

The application uses Docker Compose with three services:

- **db**: PostgreSQL database
- **backend**: Python FastAPI application with GPU support
- **frontend**: React application served by Nginx

### GPU Support

The backend container is configured for NVIDIA GPU access. If you don't have a GPU, the application will fall back to CPU processing (slower TTS generation).

## 📚 Usage Guide

### Uploading Books
1. Click "Upload Book" on the library page
2. Select an EPUB or PDF file (max 100MB)
3. Wait for processing to complete

### Reading with TTS
1. Open a book
2. Select text or entire chapters
3. Click the "Play" button to start TTS
4. Audio streams in real-time as it's generated

### AI Features
1. **Explanations**: Select text and click "Explain"
2. **Dictionary**: Double-click any word for definitions
3. **Highlights**: Select text and choose a highlight color

## 🔒 Privacy & Security

- All book processing happens locally
- No book content is sent to external services
- Only selected text is sent to Gemini for explanations
- All data stored in your local database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Tortoise TTS](https://github.com/neonbjb/tortoise-tts) for amazing voice synthesis
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent Python framework
- [React](https://reactjs.org/) for the frontend framework

## 🐛 Troubleshooting

### Common Issues

1. **TTS not working**: Ensure NVIDIA drivers are installed and Docker has GPU access
2. **AI features not working**: Check your Gemini API key in the `.env` file
3. **Books not uploading**: Check file format (EPUB/PDF only) and size (max 100MB)
4. **Database connection issues**: Ensure PostgreSQL container is running

### Getting Help

- Check the logs: `docker-compose logs`
- Visit the API docs: http://localhost:8000/docs
- Check system status: http://localhost:8000/health

---

**Enjoy your enhanced reading experience! 📖✨** 