import express from 'express';

const app = express();

// Simple health endpoint
app.get('/v1/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({
    success: true,
    message: 'Health check working',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 handler called for:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

export const minimal = app;
