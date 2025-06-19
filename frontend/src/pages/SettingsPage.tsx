import React, { useState, useEffect } from 'react';
import { useReaderStore, useUIStore } from '../store';
import { apiService } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useReaderStore();
  const { theme, setTheme } = useUIStore();
  const [ttsStatus, setTTSStatus] = useState<any>(null);
  const [geminiStatus, setGeminiStatus] = useState<any>(null);

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const [tts, gemini] = await Promise.all([
        apiService.getTTSStatus(),
        apiService.getGeminiStatus()
      ]);
      setTTSStatus(tts);
      setGeminiStatus(gemini);
    } catch (error) {
      console.error('Failed to check service status:', error);
    }
  };

  const fontOptions = [
    { value: 'Crimson Text', label: 'Crimson Text (Serif)' },
    { value: 'Inter', label: 'Inter (Sans-serif)' },
    { value: 'Georgia', label: 'Georgia (Serif)' },
    { value: 'Arial', label: 'Arial (Sans-serif)' },
    { value: 'Times New Roman', label: 'Times New Roman (Serif)' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'sepia', label: 'Sepia', icon: '📜' },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your reading experience</p>
        </div>

        <div className="space-y-8">
          {/* Reading Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Reading Preferences</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Family
                </label>
                <select
                  value={settings.fontFamily}
                  onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size: {settings.fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>12px</span>
                  <span>24px</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Line Height: {settings.lineHeight}
                </label>
                <input
                  type="range"
                  min="1.2"
                  max="2.0"
                  step="0.1"
                  value={settings.lineHeight}
                  onChange={(e) => updateSettings({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>1.2</span>
                  <span>2.0</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Highlight Color
                </label>
                <div className="flex space-x-2">
                  {['#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ffa500'].map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSettings({ highlightColor: color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        settings.highlightColor === color 
                          ? 'border-gray-800 dark:border-white' 
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</h3>
              <div
                className="text-gray-900 dark:text-white"
                style={{
                  fontFamily: settings.fontFamily,
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight,
                }}
              >
                This is how your text will appear while reading. You can adjust the font family, size, and line height to your preference.
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appearance</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {themeOptions.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value as 'light' | 'dark');
                      updateSettings({ theme: themeOption.value as any });
                    }}
                    className={`
                      p-4 rounded-lg border text-center transition-colors
                      ${(theme === themeOption.value || settings.theme === themeOption.value)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">{themeOption.icon}</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {themeOption.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Service Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🎙️</div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Text-to-Speech</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Tortoise TTS for natural voice generation
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  ttsStatus?.available 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {ttsStatus?.available ? 'Available' : 'Unavailable'}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">AI Assistant</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Google Gemini for explanations and dictionary
                    </p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  geminiStatus?.available 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {geminiStatus?.available ? 'Available' : 'Unavailable'}
                </div>
              </div>

              {ttsStatus?.cuda_available && (
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">GPU Acceleration</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        CUDA enabled for faster TTS generation
                      </p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                    Enabled
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">About</h2>
            
            <div className="text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                <strong className="text-gray-900 dark:text-white">AI-Enhanced Personal Ebook Reader</strong>
              </p>
              <p>
                A privacy-first ebook reader with advanced AI features including natural text-to-speech, 
                intelligent explanations, and smart dictionary lookups.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded">
                  React + TypeScript
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs rounded">
                  Tortoise TTS
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 text-xs rounded">
                  Google Gemini
                </span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 text-xs rounded">
                  FastAPI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 