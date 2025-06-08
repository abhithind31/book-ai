#!/usr/bin/env python3
"""
Download Tortoise TTS models to avoid long startup times
"""
import os
import torch
from tortoise.api import TextToSpeech
from tortoise.utils.audio import load_voices

def download_models():
    """Download Tortoise TTS models"""
    print("🚀 Downloading Tortoise TTS models...")
    
    # Create models directory if it doesn't exist
    os.makedirs("models", exist_ok=True)
    
    try:
        # Initialize TextToSpeech - this will download models
        print("📦 Downloading main TTS models...")
        tts = TextToSpeech(
            models_dir="./models",
            use_deepspeed=False,  # Don't use deepspeed for downloading
            kv_cache=True,
            device="cpu"  # Use CPU for downloading
        )
        print("✅ Main TTS models downloaded successfully")
        
        # Download voice samples
        print("🎤 Downloading voice samples...")
        voices = ["random", "geralt", "deniro", "freeman", "pat", "william"]
        
        for voice in voices:
            try:
                print(f"  Downloading {voice} voice...")
                voice_samples, conditioning_latents = load_voices([voice])
                print(f"  ✅ {voice} voice downloaded")
            except Exception as e:
                print(f"  ⚠️  Could not download {voice} voice: {e}")
        
        print("\n🎉 All models downloaded successfully!")
        print("📁 Models are stored in the 'models' directory")
        print("🚀 You can now start the application with faster TTS initialization")
        
    except Exception as e:
        print(f"❌ Error downloading models: {e}")
        print("💡 You can still run the application - models will download on first use")

if __name__ == "__main__":
    download_models() 