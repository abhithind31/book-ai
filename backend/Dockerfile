FROM nvidia/cuda:12.2.0-base-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV HOME="/root"
ENV CONDA_DIR="${HOME}/miniconda"
ENV PATH="$CONDA_DIR/bin:$PATH"
ENV CONDA_AUTO_UPDATE_CONDA=false
ENV PIP_DOWNLOAD_CACHE="$HOME/.pip/cache"
ENV TORTOISE_MODELS_DIR="$HOME/.cache/tortoise/models"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    git \
    build-essential \
    libsndfile1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Miniconda
RUN wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda3.sh \
    && bash /tmp/miniconda3.sh -b -p "${CONDA_DIR}" -f -u \
    && "${CONDA_DIR}/bin/conda" init bash \
    && rm -f /tmp/miniconda3.sh \
    && echo ". '${CONDA_DIR}/etc/profile.d/conda.sh'" >> "${HOME}/.profile"

# --login option used to source bashrc (thus activating conda env) at every RUN statement
SHELL ["/bin/bash", "--login", "-c"]

# Create conda environment for TTS
RUN conda create --name tortoise python=3.9 numba inflect -y \
    && conda activate tortoise \
    && conda install --yes pytorch==2.2.2 torchvision==0.17.2 torchaudio==2.2.2 pytorch-cuda=12.1 -c pytorch -c nvidia \
    && conda install --yes transformers=4.31.0 -c conda-forge

# Create app directory
WORKDIR /app

# Copy requirements and install Python dependencies in the conda environment
COPY requirements.txt .
RUN conda activate tortoise && pip install --no-cache-dir -r requirements.txt

# Install Tortoise TTS
RUN conda activate tortoise && pip install tortoise-tts

# Download NLTK data
RUN conda activate tortoise && python -c "import nltk; nltk.download('punkt')"

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/uploads /app/models /app/static/audio_cache

# Expose port
EXPOSE 8000

# Create a startup script that activates conda and runs the app
RUN echo '#!/bin/bash' > /app/start.sh \
    && echo 'source /root/miniconda/etc/profile.d/conda.sh' >> /app/start.sh \
    && echo 'conda activate tortoise' >> /app/start.sh \
    && echo 'exec python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload' >> /app/start.sh \
    && chmod +x /app/start.sh

# Run the application using the startup script
CMD ["/app/start.sh"] 