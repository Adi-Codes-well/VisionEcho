// src/pages/Assistant.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic } from "lucide-react";

function Assistant() {
  const videoRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const fullTranscript = useRef("");

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
      });
  }, []);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + " ";
      }
      fullTranscript.current += currentTranscript.trim() + " ";

      const words = fullTranscript.current.trim().split(/\s+/);
      setTranscript(fullTranscript.current.trim());

      if (words.length >= 20) {
        recognition.stop();
        setListening(false);
        handleResponse(fullTranscript.current.trim());
      }
    };

    recognition.onend = () => {
      if (listening) {
        setListening(false);
        setTranscript(fullTranscript.current.trim());
        handleResponse(fullTranscript.current.trim());
      }
    };

    recognitionRef.current = recognition;
  }, [listening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (!listening) {
      fullTranscript.current = "";
      setTranscript("");
      recognitionRef.current.start();
      setListening(true);
    } else {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleResponse = (text) => {
    const simulatedResponse = simulateVision(text);
    setResponse(simulatedResponse);
    speak(simulatedResponse);
  };

  const simulateVision = (input) => {
    return "A person is 3 feet ahead, and a chair is nearby.";
  };

  const speak = (message) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    synth.speak(utterance);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Camera Feed Background */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      />

      {/* Overlay Controls */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-white px-6 backdrop-blur-sm bg-black/50">
        <h2 className="text-3xl font-semibold mb-8 tracking-tight">VisionEcho Assistant</h2>

        <div className="relative w-40 h-40 mb-8">
          {/* Wavy Rings */}
          {listening && (
            <>
              <div className="absolute inset-0 rounded-full border border-green-400 animate-ping-slow" />
              <div className="absolute inset-2 rounded-full border border-green-400 animate-ping-slower" />
              <div className="absolute inset-4 rounded-full border border-green-400 animate-ping-slowest" />
            </>
          )}

          {/* Main Mic Circle */}
          <div className={`absolute inset-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl ${listening ? 'text-green-400' : 'text-gray-400'} transition-all`}>
            <Mic className={listening ? 'animate-pulse-fast' : ''} size={40} />
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={toggleListening}
            className={`px-6 py-2 rounded-full font-medium transition-all duration-300 transform ${listening ? 'bg-green-400 text-black scale-105 shadow-md hover:bg-green-300' : 'bg-white text-black hover:bg-gray-200 scale-100'}`}
          >
            {listening ? "Stop" : "Start"}
          </button>
        </div>

        <div className="text-center max-w-lg text-sm text-white bg-black/30 p-4 rounded-xl">
          <p><strong>Command:</strong> {transcript}</p>
          <p className="text-green-300 mt-2"><strong>Response:</strong> {response}</p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-6 text-gray-300 hover:text-white underline text-sm"
        >
          Back to Home
        </button>
      </div>

      {/* Custom Animations */}
      <style>
        {`
          .animate-ping-slow {
            animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-ping-slower {
            animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-ping-slowest {
            animation: ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-pulse-fast {
            animation: pulse 1s ease-in-out infinite;
          }
          @keyframes ping-slow {
            0% { transform: scale(1); opacity: 1; }
            75%, 100% { transform: scale(2); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}

export default Assistant;
