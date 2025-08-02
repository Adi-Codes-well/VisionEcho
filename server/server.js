const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware setup
app.use(cors({
  origin: '*', // Replace with frontend URL in production
  methods: ['GET', 'POST']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Multer from separate file
const upload = require('./middlewares/uploadMiddleware');

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

// Import controller
const { analyzeImage } = require('./controllers/analyzeController');

// Route: Image + Command Analysis
app.post('/api/ai/analyze', upload.single('image'), analyzeImage);

// Optional: Route for saved history
const historyRoute = require('./routes/historyRoute');
app.use('/api', historyRoute);

// Create HTTP server from app
const server = http.createServer(app);

// Setup WebSocket (Socket.IO)
const io = new Server(server, {
  cors: {
    origin: '*', // Replace in production
    methods: ['GET', 'POST']
  }
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

// Attach socket.io instance to app for controller use
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
