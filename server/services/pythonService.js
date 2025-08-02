const dotenv = require('dotenv');
const axios = require('axios');
const FormData = require('form-data');

dotenv.config();

const PYTHON_BASE_URL = process.env.PYTHON_SERVICE_URL;

// Helper function to send image + command to Python service
const sendToPythonAI = async (fileBuffer, filename, command) => {
  try {
    const formData = new FormData();
    formData.append('image', fileBuffer, filename);
    formData.append('command', command);

    // Decide which Python endpoint to call based on command
    let endpoint = '/object-detection'; // default

    if (command.toLowerCase().includes('face')) {
      endpoint = '/face-recognition';
    } else if (command.toLowerCase().includes('medicine')) {
      endpoint = '/medicine-ocr';
    }

    const url = `${PYTHON_BASE_URL}${endpoint}`;

    const response = await axios.post(url, formData, {
      headers: formData.getHeaders(),
      timeout: 10000 // 10 seconds timeout
    });

    return response.data; // JSON result from Python
  } catch (err) {
    console.error('Error communicating with Python AI:', err.message);
    throw new Error('AI processing failed');
  }
};

module.exports = { sendToPythonAI };