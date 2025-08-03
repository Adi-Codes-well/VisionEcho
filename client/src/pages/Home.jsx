// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-6">
      <h1 className="text-5xl font-bold mb-4 tracking-tight">VisionEcho</h1>

      <p className="text-lg text-gray-300 text-center max-w-xl mb-10">
        Real-time visual assistant that helps blind and visually impaired individuals navigate and understand their surroundings using AI-powered object and text recognition.
      </p>

      <button
        onClick={() => navigate("/assistant")}
        className="bg-white text-black px-8 py-3 rounded-full text-lg font-medium tracking-wide shadow-md hover:bg-gray-200 transition"
      >
        Start Visual Assistance
      </button>
    </div>
  );
}

export default Home;
