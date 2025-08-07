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

// CORS configuration with environment-specific origins
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGINS?.split(',') || ['https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import middlewares
const upload = require('./middlewares/uploadMiddleware');

// MongoDB connection with better error handling
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log(' MongoDB connected successfully');
}).catch((err) => {
  console.error(' MongoDB connection error:', err.message);
  process.exit(1);
});

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log(' Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(' Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log(' Mongoose disconnected from MongoDB');
});

// Import controllers
const { analyzeImage } = require('./controllers/analyzeController');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
app.post('/api/ai/analyze', upload.single('image'), analyzeImage);

// History routes (if you have them)
const historyRoute = require('./routes/historyRoute');
app.use('/api', historyRoute);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Create HTTP server from app
const server = http.createServer(app);

// Setup WebSocket (Socket.IO) with enhanced configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(` Client connected: ${socket.id}`);

  // Join user to their own room for targeted messaging
  socket.join(socket.id);

  // Handle analysis request events (optional)
  socket.on('request-analysis', (data) => {
    console.log('📨 Analysis request received via socket:', data);
    // You can emit back acknowledgment
    socket.emit('analysis-received', { 
      message: 'Analysis request received',
      requestId: data.requestId 
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(` Client disconnected: ${socket.id}, Reason: ${reason}`);
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(` Socket error for ${socket.id}:`, error);
  });
});

// Attach socket.io instance to app for controller use
app.set('io', io);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log(' SIGTERM received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(' SIGINT received, shutting down gracefully');
  server.close(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Socket.IO enabled`);
  console.log(` CORS origins: ${corsOptions.origin}`);
});