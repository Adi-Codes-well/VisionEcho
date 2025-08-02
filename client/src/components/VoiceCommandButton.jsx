import React, { useState } from 'react';
import api from '../services/api';
import socket from '../services/socket';
import Loader from './Loader';

const VoiceCommandButton = ({ videoRef }) => {
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = async (event) => {
      const command = event.results[0][0].transcript;
      await captureImageAndSend(command);
    };

    recognition.start();
  };

  const captureImageAndSend = async (command) => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg'));

    const formData = new FormData();
    formData.append('image', blob, 'photo.jpg');
    formData.append('command', command);
    formData.append('save', true);
    formData.append('socketId', socket.id);

    try {
      setLoading(true);
      await api.post('/ai/analyze', formData);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center">
      <button
        onClick={startListening}
        className={`px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 
        ${listening ? 'bg-red-500' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}
        disabled={loading}
      >
        {loading ? 'Processing...' : listening ? 'Listening...' : 'Start Voice Command'}
      </button>
      {loading && <Loader />}
    </div>
  );
};

export default VoiceCommandButton;
