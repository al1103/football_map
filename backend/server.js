const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const fieldRoutes = require('./routes/fields');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test database connection
const pool = require('./config/database');
app.use('/', (req, res, next) => {
  pool.query('SELECT 1', (err, results) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({
        success: false,
        error: 'Database connection failed'
      });
    }
    console.log('Database connection successful');
    next();
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/fields', fieldRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Football Field Finder API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
