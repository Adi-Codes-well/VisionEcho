const SETTINGS_KEY = 'ai_analyzer_settings';

export const loadSettings = () => {
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? JSON.parse(saved) : {
    voiceFeedback: true,
    autoSave: true,
    language: 'en-US',
  };
};

export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const clearHistory = () => {
  // Optional: If you save history in localStorage
  localStorage.removeItem('ai_analysis_history');
};
