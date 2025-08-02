const { sendToPythonAI } = require('../services/pythonService');
const { uploadImageToCloudinary } = require('../services/cloudinaryService');
const AnalysisResult = require('../models/AnalysisResult');

const analyzeImage = async (req, res) => {
  try {
    const file = req.file;
    const command = req.body.command;
    const save = req.body.save === 'true'; // Optional save flag

    if (!file || !command) {
      return res.status(400).json({ error: 'Image and command required' });
    }

    // Send to Python
    const aiResult = await sendToPythonAI(file.buffer, file.originalname, command);

    let imageUrl = null;

    if (save) {
      // Upload to Cloudinary
      const uploadResult = await uploadImageToCloudinary(file.buffer, file.originalname);
      imageUrl = uploadResult.secure_url;

      // Save to MongoDB
      const analysisEntry = new AnalysisResult({
        command,
        result: aiResult,
        imageUrl
      });
      await analysisEntry.save();
    }

    res.json({
      command,
      result: aiResult,
      imageUrl,
      saved: save,
      status: 'success'
    });
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: 'Server or AI error' });
  }
};

module.exports = { analyzeImage };
