import React, { useEffect, useRef } from 'react';
import VoiceCommandButton from '../components/VoiceCommandButton';
import ResultDisplay from '../components/ResultDisplay';

const Home = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error('Camera access error:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">AI Media Analyzer</h1>

      <div className="w-full max-w-md relative">
        <video
          ref={videoRef}
          autoPlay
          className="w-full rounded-lg border shadow-lg"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      <VoiceCommandButton videoRef={videoRef} />
      <ResultDisplay />
    </div>
  );
};

export default Home;
