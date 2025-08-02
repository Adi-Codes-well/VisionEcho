import React, { useState, useRef, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const VisionAssistant = () => {
  const webcamRef = useRef(null);
  const audioRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [detectionResults, setDetectionResults] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('all objects');
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [autoScan, setAutoScan] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testImages, setTestImages] = useState([]);
  const [selectedTestImage, setSelectedTestImage] = useState('');

  // Load test images on mount
  useEffect(() => {
    fetchTestImages();
  }, []);

  // Auto-scan timer
  useEffect(() => {
    let interval;
    if (autoScan && !isProcessing) {
      interval = setInterval(() => {
        captureAndAnalyze();
      }, 5000); // Scan every 5 seconds
    }
    return () => clearInterval(interval);
  }, [autoScan, isProcessing]);

  const fetchTestImages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/list-test-images`);
      setTestImages(response.data.images || []);
    } catch (error) {
      console.error('Error fetching test images:', error);
    }
  };

  const captureAndAnalyze = useCallback(async () => {
    if (isProcessing || !webcamRef.current) return;

    setIsProcessing(true);
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const response = await axios.post(`${API_BASE_URL}/analyze-image`, {
        image: imageSrc,
        prompt: customPrompt,
        ocr_language: ocrLanguage,
        generate_audio: audioEnabled
      });

      if (response.data.success) {
        setDetectionResults(response.data);
        
        // Play audio if available
        if (audioEnabled && response.data.audio) {
          const audio = new Audio(`data:audio/mp3;base64,${response.data.audio}`);
          audioRef.current = audio;
          audio.play().catch(e => console.error('Audio play failed:', e));
        }
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      setDetectionResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  }, [customPrompt, ocrLanguage, audioEnabled, isProcessing]);

  const analyzeTestImage = async () => {
    if (!selectedTestImage || isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/test-image/${selectedTestImage}`, {
        prompt: customPrompt,
        ocr_language: ocrLanguage
      });

      if (response.data.success) {
        setDetectionResults(response.data);
      }
    } catch (error) {
      console.error('Error analyzing test image:', error);
      setDetectionResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return (
    <div className="vision-assistant">
      <div className="controls">
        <div className="control-group">
          <label htmlFor="custom-prompt">Custom Prompt:</label>
          <input
            id="custom-prompt"
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., 'find cats', 'detect people', 'locate traffic signs'"
            className="prompt-input"
          />
        </div>

        <div className="control-group">
          <label htmlFor="ocr-language">OCR Language:</label>
          <select
            id="ocr-language"
            value={ocrLanguage}
            onChange={(e) => setOcrLanguage(e.target.value)}
            className="language-select"
          >
            <option value="eng">English</option>
            <option value="hin">Hindi</option>
            <option value="eng+hin">English + Hindi</option>
          </select>
        </div>

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
            />
            Enable Audio
          </label>
        </div>

        <div className="control-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
            />
            Auto-Scan (every 5 seconds)
          </label>
        </div>
      </div>

      <div className="camera-section">
        <div className="webcam-container">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="webcam"
          />
          {isProcessing && <div className="processing-overlay">Processing...</div>}
        </div>

        <div className="action-buttons">
          <button
            onClick={captureAndAnalyze}
            disabled={isProcessing}
            className="scan-button"
          >
            {isProcessing ? 'Scanning...' : 'Scan Now'}
          </button>
          
          {audioRef.current && (
            <button onClick={stopAudio} className="stop-audio-button">
              Stop Audio
            </button>
          )}
        </div>
      </div>

      <div className="test-section">
        <h3>Test with Sample Images</h3>
        <div className="test-controls">
          <select
            value={selectedTestImage}
            onChange={(e) => setSelectedTestImage(e.target.value)}
            className="test-image-select"
          >
            <option value="">Select a test image</option>
            {testImages.map((img) => (
              <option key={img} value={img}>{img}</option>
            ))}
          </select>
          <button
            onClick={analyzeTestImage}
            disabled={!selectedTestImage || isProcessing}
            className="test-button"
          >
            Test Image
          </button>
        </div>
      </div>

      {detectionResults && (
        <div className="results-section">
          <h3>Detection Results</h3>
          
          {detectionResults.error ? (
            <div className="error-message">
              Error: {detectionResults.error}
            </div>
          ) : (
            <>
              <div className="detected-objects">
                <h4>Detected Objects ({detectionResults.objects?.length || 0})</h4>
                {detectionResults.objects?.length > 0 ? (
                  <ul className="objects-list">
                    {detectionResults.objects.map((obj, idx) => (
                      <li key={idx}>
                        <strong>{obj.label}</strong> - 
                        Confidence: {(obj.confidence * 100).toFixed(1)}%
                        <span className="bbox-info">
                          [x: {obj.bbox[0]}, y: {obj.bbox[1]}, 
                          w: {obj.bbox[2] - obj.bbox[0]}, 
                          h: {obj.bbox[3] - obj.bbox[1]}]
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No objects detected with current prompt.</p>
                )}
              </div>

              <div className="ocr-results">
                <h4>OCR Text</h4>
                {detectionResults.ocr?.full_text ? (
                  <div className="ocr-text">
                    <p>{detectionResults.ocr.full_text}</p>
                    {detectionResults.ocr.words?.length > 0 && (
                      <details>
                        <summary>Word Details ({detectionResults.ocr.words.length} words)</summary>
                        <ul className="words-list">
                          {detectionResults.ocr.words.map((word, idx) => (
                            <li key={idx}>
                              "{word.text}" at [{word.bbox.join(', ')}]
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                ) : (
                  <p>No text detected in the image.</p>
                )}
              </div>

              {detectionResults.description && (
                <div className="description">
                  <h4>Summary</h4>
                  <p>{detectionResults.description}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VisionAssistant;