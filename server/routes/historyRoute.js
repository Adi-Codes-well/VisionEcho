const express = require('express');
const router = express.Router();
const AnalysisResult = require('../models/AnalysisResult');

// GET /api/history
router.get('/history', async (req, res) => {
  try {
    const results = await AnalysisResult.find().sort({ createdAt: -1 }).limit(20);
    res.json(results);
  } catch (err) {
    console.error('History fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;