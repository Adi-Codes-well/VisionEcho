const { sendToPythonAI } = require('../services/pythonService');

const analyzeImage = async (req, res) => {
  try {
    const file = req.file;
    const command = req.body.command;
    const save = req.body.save === 'true';
    const socketId = req.body.socketId; // ✅ NEW

    if (!file || !command || !socketId) {
      return res.status(400).json({ error: 'Image, command, and socketId are required' });
    }

    // Send to Python service
    const aiResult = await sendToPythonAI(file.buffer, file.originalname, command);

    let imageUrl = null;
    if (save) {
      const { uploadImageToCloudinary } = require('../services/cloudinaryService');
      const AnalysisResult = require('../models/AnalysisResult');

      const uploadResult = await uploadImageToCloudinary(file.buffer, file.originalname);
      imageUrl = uploadResult.secure_url;

      const resultEntry = new AnalysisResult({
        command,
        result: aiResult,
        imageUrl
      });
      await resultEntry.save();
    }

    // Get socket.io instance
    const io = req.app.get('io');

    // Emit result to client via WebSocket
    io.to(socketId).emit('analysis-result', {
      command,
      result: aiResult,
      imageUrl,
      saved: save,
      status: 'success'
    });

    // Respond quickly to frontend (acknowledge request)
    res.json({ message: 'Result will be sent via WebSocket', status: 'processing' });

  } catch (err) {
    console.error('Analysis Error:', err.message);
    res.status(500).json({ error: 'Server or AI processing error' });
  }
};

module.exports = { analyzeImage };
