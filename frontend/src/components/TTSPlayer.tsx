import React, { useEffect, useRef, useState } from 'react';
import { useTTSStore } from '../store';
import { apiService } from '../services/api';

interface TTSPlayerProps {
  text: string;
  onClose: () => void;
}

export const TTSPlayer: React.FC<TTSPlayerProps> = ({ text, onClose }) => {
  const { state, voices, presets, audioContext, updateState, setVoices, setPresets, initializeAudio } = useTTSStore();
  const [volume, setVolume] = useState(0.8);
  const [selectedVoice, setSelectedVoice] = useState(state.voice);
  const [selectedPreset, setSelectedPreset] = useState(state.preset);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadVoicesAndPresets();
  }, []);

  const loadVoicesAndPresets = async () => {
    try {
      const [voicesData, presetsData] = await Promise.all([
        apiService.getVoices(),
        apiService.getPresets()
      ]);
      
      setVoices(voicesData.voices);
      setPresets(presetsData.presets);
      
      if (voicesData.voices.length > 0 && !voices.includes(selectedVoice)) {
        setSelectedVoice(voicesData.voices[0]);
      }
    } catch (error) {
      console.error('Failed to load TTS data:', error);
    }
  };

  const handlePlay = async () => {
    if (!audioContext) {
      initializeAudio();
      return;
    }

    setIsLoading(true);
    updateState({ status: 'loading_initial' });

    try {
      const audioChunks: ArrayBuffer[] = [];
      
      await apiService.generateTTS(
        {
          text,
          voice: selectedVoice,
          preset: selectedPreset
        },
        (chunk) => {
          audioChunks.push(chunk);
          
          // Play the first chunk as soon as we get it
          if (audioChunks.length === 1) {
            playAudioChunk(chunk);
            updateState({ status: 'playing' });
            setIsLoading(false);
          }
        }
      );
      
      // Combine all chunks for the full audio
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const combinedArray = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioChunks) {
        combinedArray.set(new Uint8Array(chunk), offset);
        offset += chunk.byteLength;
      }
      
      // Create blob URL for the full audio
      const audioBlob = new Blob([combinedArray], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.volume = volume;
      }
      
    } catch (error) {
      console.error('TTS generation failed:', error);
      updateState({ status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
      setIsLoading(false);
    }
  };

  const playAudioChunk = async (chunk: ArrayBuffer) => {
    if (!audioContext) return;
    
    try {
      const audioBuffer = await audioContext.decodeAudioData(chunk);
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      gainNode.gain.value = volume;
      
      source.start();
    } catch (error) {
      console.error('Failed to play audio chunk:', error);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    updateState({ status: 'paused' });
  };

  const handleResume = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
    updateState({ status: 'playing' });
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    updateState({ status: 'idle' });
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const getStatusText = () => {
    switch (state.status) {
      case 'loading_initial': return 'Initializing TTS...';
      case 'playing': return 'Playing';
      case 'paused': return 'Paused';
      case 'finished': return 'Finished';
      case 'error': return `Error: ${state.error}`;
      default: return 'Ready';
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-tts border border-gray-200 dark:border-gray-700 p-6 min-w-96 max-w-lg z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Text-to-Speech
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Text Preview */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {text}
        </p>
      </div>

      {/* Voice and Preset Selection */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Voice
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {voices.map((voice) => (
              <option key={voice} value={voice}>
                {voice}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quality
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {presets.map((preset) => (
              <option key={preset} value={preset}>
                {preset.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getStatusText()}
        </p>
        {isLoading && (
          <div className="mt-2">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {state.status === 'idle' || state.status === 'finished' ? (
          <button
            onClick={handlePlay}
            disabled={isLoading}
            className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h2m4 0h2M9 16V8a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2H11a2 2 0 01-2-2z" />
            </svg>
          </button>
        ) : state.status === 'playing' ? (
          <button
            onClick={handlePause}
            className="flex items-center justify-center w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleResume}
            className="flex items-center justify-center w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h2m4 0h2M9 16V8a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2H11a2 2 0 01-2-2z" />
            </svg>
          </button>
        )}
        
        <button
          onClick={handleStop}
          className="flex items-center justify-center w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
          </svg>
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center space-x-3">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m0 0l-6.01 6.016c-.5.5-1.286.755-2.059.755-.772 0-1.558-.255-2.059-.755C4.908 20.552 4.653 19.766 4.653 18.994s.255-1.558.755-2.059L11.424 11.9" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400 w-10">
          {Math.round(volume * 100)}%
        </span>
      </div>

      <audio
        ref={audioRef}
        onEnded={() => updateState({ status: 'finished' })}
        onPlay={() => updateState({ status: 'playing' })}
        onPause={() => updateState({ status: 'paused' })}
      />
    </div>
  );
}; 