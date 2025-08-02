// src/components/ResultDisplay.jsx
import React, { useState, useEffect } from 'react';
import socket from '../services/socket';

const ResultDisplay = () => {
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listener for successful analysis results
    socket.on('analysis-result', (data) => {
      setAnalysis(data);
      setError(''); // Clear previous errors
    });

    // Optional: Listener for errors from the backend
    socket.on('analysis-error', (data) => {
      setError(data.message || 'An error occurred during analysis.');
      setAnalysis(null);
    });

    // Cleanup listeners when the component unmounts
    return () => {
      socket.off('analysis-result');
      socket.off('analysis-error');
    };
  }, []);

  if (error) {
    return (
      <div className="mt-4 p-4 w-full max-w-md bg-red-100 border border-red-400 text-red-700 rounded-md">
        <p className="font-bold">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="mt-4 p-4 w-full max-w-md bg-gray-200 rounded-md">
        <p className="text-gray-600">Waiting for analysis result...</p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 w-full max-w-md bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-2">Analysis Result</h2>
      <p><strong>Command:</strong> {analysis.command}</p>
      <div>
        <strong>Result:</strong>
        <pre className="bg-gray-100 p-2 rounded mt-1 whitespace-pre-wrap">
          {JSON.stringify(analysis.result, null, 2)}
        </pre>
      </div>
      {analysis.imageUrl && (
        <div className="mt-2">
          <p><strong>Saved Image:</strong></p>
          <img src={analysis.imageUrl} alt="Analysis" className="rounded-md border mt-1" />
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;