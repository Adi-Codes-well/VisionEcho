const axios = require('axios');
const FormData = require('form-data');
const dotenv = require('dotenv');

dotenv.config();

const PYTHON_BASE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001';

/**
 * Send image and command to Python AI service
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @param {string} command - Analysis command
 * @returns {Promise<Object>} - AI service response
 */
const sendToPythonAI = async (fileBuffer, filename, command) => {
  try {
    console.log(`📤 Sending to Python AI: ${command}`);
    
    // Create form data
    const formData = new FormData();
    formData.append('image', fileBuffer, { 
      filename: filename || 'image.jpg',
      contentType: 'image/jpeg'
    });

    // Determine endpoint based on command
    let endpoint = determineEndpoint(command);
    const url = `${PYTHON_BASE_URL}${endpoint}`;

    console.log(`🎯 Using endpoint: ${url}`);

    // Send request to Python service
    const response = await axios.post(url, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 seconds timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log('✅ Python AI response received:', response.status);
    return {
      success: true,
      data: response.data,
      endpoint: endpoint,
    };

  } catch (error) {
    console.error('❌ Error communicating with Python AI:', error.message);
    
    // Handle different types of errors
    let errorMessage = 'AI processing failed';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = `AI service error (${error.response.status}): ${error.response.data?.error || error.response.statusText}`;
    } else if (error.request) {
      // Request failed to reach server
      errorMessage = 'AI service is not available. Please ensure the Python service is running.';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to AI service. Please check if the Python service is running on the correct port.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'AI processing timed out. Please try with a smaller image.';
    }

    throw new Error(errorMessage);
  }
};

/**
 * Determine which Python endpoint to use based on command
 * @param {string} command - User command
 * @returns {string} - Endpoint path
 */
const determineEndpoint = (command) => {
  const lowerCommand = command.toLowerCase();
  
  // Face detection/recognition
  if (lowerCommand.includes('face') || lowerCommand.includes('person')) {
    return '/recognize_face';
  }
  
  // Object detection (extend as you add more endpoints)
  if (lowerCommand.includes('object') || lowerCommand.includes('detect')) {
    return '/detect_objects'; // You'll need to implement this
  }
  
  // OCR for medicine/text
  if (lowerCommand.includes('medicine') || lowerCommand.includes('text') || lowerCommand.includes('read')) {
    return '/extract_text'; // You'll need to implement this
  }
  
  // Emotion analysis
  if (lowerCommand.includes('emotion') || lowerCommand.includes('mood') || lowerCommand.includes('feeling')) {
    return '/analyze_emotion'; // You'll need to implement this
  }
  
  // Default to face recognition
  return '/recognize_face';
};

/**
 * Check if Python AI service is available
 * @returns {Promise<boolean>} - Service availability
 */
const checkPythonServiceHealth = async () => {
  try {
    const response = await axios.get(`${PYTHON_BASE_URL}/health`, {
      timeout: 5000,
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Python service health check failed:', error.message);
    return false;
  }
};

module.exports = { 
  sendToPythonAI,
  checkPythonServiceHealth,
  determineEndpoint
};