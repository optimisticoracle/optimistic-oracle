import cors from 'cors';

/**
 * CORS configuration for local development
 * Allows Dashboard (port 5175) to connect to API (port 3000)
 */
export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'http://localhost:3000',
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Payment',
    'X-Payment-Response',
  ],
  exposedHeaders: ['X-Payment-Response'],
  credentials: true,
  maxAge: 86400,
});