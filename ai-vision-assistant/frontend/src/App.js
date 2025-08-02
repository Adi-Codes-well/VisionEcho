import React from 'react';
import './App.css';
import VisionAssistant from './components/VisionAssistant';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Vision Assistant</h1>
        <p>Object Detection with Custom Prompts + OCR + TTS</p>
      </header>
      <main>
        <VisionAssistant />
      </main>
    </div>
  );
}

export default App;