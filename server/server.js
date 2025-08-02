const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

const historyRoute = require('./routes/historyRoute');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());                      // Allow cross-origin requests
app.use(express.json());              // Parse JSON body

app.get('/api/test', (req, res) => {
  res.json({ message: 'API working 🚀' });
});

app.use('/api', historyRoute);

//Mongo connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}).catch((err) => {
  console.error(' MongoDB connection error:', err.message);
});

