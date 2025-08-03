// src/pages/Assistant.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VoiceCommandButton from "../components/VoiceCommandButton";
import ResultDisplay from "../components/ResultDisplay";

function Assistant() {
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Access the user's camera and stream it to the video element
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        // You could add some user-facing error message here
      });

    // Cleanup function to stop the camera stream when the component unmounts
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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

      {/* Overlay Content */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-white p-6 bg-black/50">
        <h1 className="text-3xl font-bold mb-4">VisionEcho Assistant</h1>
        <p className="text-lg mb-8">Press the button and speak a command.</p>

        {/* Voice Command Button (Handles sending data to server) */}
        <VoiceCommandButton videoRef={videoRef} />

        {/* Display for analysis results from the server */}
        <ResultDisplay />

        <button
          onClick={() => navigate("/")}
          className="mt-8 text-gray-300 hover:text-white underline text-sm"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default Assistant;