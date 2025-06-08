# 🚀 Quick Start Guide

Get your AI-Enhanced Personal Ebook Reader running in minutes!

## ⚡ Instant Setup (PowerShell)

1. **Run the setup script:**
   ```powershell
   .\setup.ps1
   ```

2. **Add your Gemini API key:**
   - Edit the `.env` file that was created
   - Replace `your_gemini_api_key_here` with your actual API key
   - Get a free key at: https://makersuite.google.com/app/apikey

3. **Start the application:**
   ```powershell
   docker-compose up -d
   ```

## 🌐 Access Points

- **📱 Main App**: http://localhost:3000
- **🔧 API Docs**: http://localhost:8000/docs
- **💾 Database**: localhost:5432

## 📚 First Steps

1. **Upload a book**: Click "Upload Book" and select an EPUB or PDF
2. **Start reading**: Open your book and enjoy the enhanced experience
3. **Try TTS**: Select text and click "Play" for AI narration
4. **Get explanations**: Select complex text and click "Explain"
5. **Look up words**: Double-click any word for instant definitions

## 🛠️ Commands

```powershell
# Start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs

# Stop the application
docker-compose down

# Restart a service
docker-compose restart backend
```

## 🔧 Troubleshooting

### TTS Not Working?
- Ensure NVIDIA drivers are installed
- Check GPU access: `docker-compose logs backend`

### AI Features Not Working?
- Verify your Gemini API key in `.env`
- Check API status: http://localhost:8000/api/library/gemini-status

### Can't Upload Books?
- Supported formats: EPUB, PDF only
- Max file size: 100MB
- Check backend logs for errors

## 🎯 What's Next?

- Upload your favorite books
- Experiment with different TTS voices
- Try the AI explanation features
- Customize your reading experience

**Happy reading! 📖✨**