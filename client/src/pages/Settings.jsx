import React, { useState, useEffect } from 'react';
import { loadSettings, saveSettings, clearHistory } from '../utils/settingsUtils';

const Settings = () => {
  const [settings, setSettings] = useState(loadSettings());

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLanguageChange = (e) => {
    setSettings(prev => ({ ...prev, language: e.target.value }));
  };

  const handleClear = () => {
    if (window.confirm('Clear all analysis history?')) {
      clearHistory();
      alert('History cleared!');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-md shadow mt-4">
      <h1 className="text-xl font-bold mb-4">Settings</h1>

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.voiceFeedback}
            onChange={() => toggle('voiceFeedback')}
          />
          Enable Voice Feedback
        </label>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={() => toggle('autoSave')}
          />
          Auto-Save AI Results
        </label>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Voice Language:</label>
        <select
          value={settings.language}
          onChange={handleLanguageChange}
          className="border p-2 rounded w-full"
        >
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="hi-IN">Hindi (India)</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
        </select>
      </div>

      <button
        onClick={handleClear}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
      >
        Clear History
      </button>
    </div>
  );
};

export default Settings;