const mongoose = require('mongoose');

const analysisResultSchema = new mongoose.Schema({
  command: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnalysisResult', analysisResultSchema);
