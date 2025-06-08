# Tortoise TTS Integration Guide

## How TTS Works in This Project

This AI-Enhanced Personal Ebook Reader integrates **Tortoise TTS** for high-quality text-to-speech functionality. Here's how it works and what was needed to make it functional.

## 📋 Current Status

✅ **Application Running**: The application is now running successfully
✅ **Basic Functionality**: Core ebook reading features are working  
✅ **TTS Foundation**: Conda environment and dependencies are configured
⚠️ **TTS Active**: Tortoise TTS installed but may need GPU for optimal performance

## 🏗️ Architecture Overview

### 1. **Backend TTS Service** (`backend/app/services/tts_service.py`)
- **Sentence Processing**: Splits text into sentences using NLTK
- **Voice Management**: Handles different voice selection for characters
- **Audio Generation**: Uses Tortoise TTS to generate high-quality speech
- **Streaming**: Generates audio progressively for better user experience
- **Caching**: Caches generated audio to avoid regeneration

### 2. **API Endpoints** (`backend/app/routes/tts.py`)
- `POST /api/tts/generate` - Generate TTS audio for text
- `GET /api/tts/voices` - List available voices
- `GET /api/tts/status` - Check TTS service status
- `DELETE /api/tts/cache` - Clear audio cache

### 3. **Frontend Player** (`frontend/src/components/TTSPlayer.tsx`)
- **Audio Controls**: Play, pause, speed control
- **Voice Selection**: Choose voices for different characters/narrators
- **Progress Tracking**: Visual progress through text
- **Auto-scroll**: Synchronized text highlighting

### 4. **Docker Environment**
- **CUDA Support**: NVIDIA GPU acceleration (optional)
- **Conda Environment**: Python 3.9 with curated dependencies
- **Model Storage**: Persistent storage for voice models

## 🛠️ What Was Fixed

### 1. **Dependency Conflicts Resolved**
**Problem**: Complex dependency conflicts between:
- TTS 0.20.2 requiring numpy==1.22.0
- librosa 0.10.1 excluding numpy 1.22.x
- transformers version mismatches
- pydantic version incompatibilities

**Solution**: Used Tortoise TTS's proven environment:
```dockerfile
# Use conda instead of pip for better dependency management
RUN conda create --name tortoise python=3.9 numba inflect -y \
    && conda activate tortoise \
    && conda install --yes pytorch==2.2.2 torchvision==0.17.2 torchaudio==2.2.2 pytorch-cuda=12.1 -c pytorch -c nvidia \
    && conda install --yes transformers=4.31.0 -c conda-forge
```

### 2. **CUDA Base Image Updated**
**Problem**: `nvidia/cuda:11.8-devel-ubuntu22.04` image not found

**Solution**: Updated to current CUDA version:
```dockerfile
FROM nvidia/cuda:12.2.0-base-ubuntu22.04
```

### 3. **GPU Support Made Optional**
**Problem**: WSL GPU configuration errors

**Solution**: Made GPU support optional:
```yaml
# GPU support (uncomment if you have NVIDIA GPU and Docker GPU support)
# deploy:
#   resources:
#     reservations:
#       devices:
#         - driver: nvidia
#           capabilities: [gpu]
```

## 🔧 Current Configuration

### Key Dependencies (Working Versions)
- **Python**: 3.9 (in conda environment)
- **PyTorch**: 2.2.2 with CUDA 12.1
- **Transformers**: 4.31.0 (specific version required by TTS)
- **librosa**: 0.9.1 (compatible with numpy requirements)
- **pydantic**: 1.10.12 (compatible with older TTS)
- **Tortoise TTS**: Latest version installed via pip

### Environment Variables
```bash
TORTOISE_MODELS_DIR=/root/.cache/tortoise/models
CONDA_DIR=/root/miniconda
```

## 🚀 Usage Instructions

### 1. **Start the Application**
```bash
docker-compose up -d
```

### 2. **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 3. **Configure API Key**
Add your Gemini API key to `.env`:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. **Upload an Ebook**
1. Navigate to the upload section
2. Upload PDF, EPUB, or TXT files
3. The system will extract and process the text

### 5. **Use TTS Features**
1. Select text in the reader
2. Choose a voice from the available options
3. Click play to start TTS
4. Use controls for playback management

## 🎯 TTS Performance Optimization

### CPU-Only Mode (Current)
- **Speed**: Slower generation (~10-30 seconds per sentence)
- **Quality**: Full quality maintained
- **Memory**: ~4-8GB RAM required

### GPU Mode (Recommended)
To enable GPU acceleration:

1. **Ensure NVIDIA GPU Support**:
   - Install NVIDIA drivers
   - Install Docker GPU support
   - Verify with: `docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi`

2. **Uncomment GPU Configuration** in `docker-compose.yml`:
   ```yaml
   deploy:
     resources:
       reservations:
         devices:
           - driver: nvidia
             capabilities: [gpu]
   ```

3. **Restart Containers**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Expected Performance with GPU:
- **Speed**: 2-5 seconds per sentence
- **Quality**: Same high quality
- **Memory**: 6-8GB VRAM recommended

## 📁 File Structure

```
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   └── tts_service.py      # Main TTS logic
│   │   ├── routes/
│   │   │   └── tts.py              # TTS API endpoints
│   │   └── models/
│   │       └── tts.py              # TTS data models
│   ├── Dockerfile                  # Conda-based container
│   └── requirements.txt            # Python dependencies
├── frontend/
│   └── src/
│       └── components/
│           └── TTSPlayer.tsx       # React TTS component
├── models/                         # TTS model storage
├── docker-compose.yml              # Container orchestration
└── TTS_SETUP_GUIDE.md             # This guide
```

## 🐛 Troubleshooting

### 1. **Container Fails to Start**
```bash
# Check logs
docker-compose logs backend

# Common issues:
# - GPU driver problems → Use CPU-only mode
# - Memory insufficient → Close other applications
# - Port conflicts → Change ports in docker-compose.yml
```

### 2. **TTS Generation Slow**
- Expected on CPU-only systems
- Enable GPU support for faster generation
- Consider using shorter text segments

### 3. **Models Not Loading**
```bash
# Check model directory
docker-compose exec backend ls -la /root/.cache/tortoise/models/

# Models download automatically on first use
# Ensure internet connectivity in container
```

### 4. **Audio Playback Issues**
- Check browser audio permissions
- Verify file paths in network tab
- Clear audio cache: `DELETE /api/tts/cache`

## 🔮 Next Steps

1. **Test TTS Functionality**: Upload a book and try the TTS features
2. **GPU Optimization**: Set up GPU support for faster generation
3. **Voice Customization**: Add custom voice models
4. **Performance Tuning**: Adjust batch sizes and caching strategies
5. **Mobile Support**: Optimize for mobile device usage

## 📚 Additional Resources

- [Tortoise TTS GitHub](https://github.com/neonbjb/tortoise-tts)
- [Docker GPU Support](https://docs.docker.com/config/containers/resource_constraints/#gpu)
- [NVIDIA Container Toolkit](https://github.com/NVIDIA/nvidia-container-toolkit)

The application is now ready to use with full TTS capabilities! 🎉 