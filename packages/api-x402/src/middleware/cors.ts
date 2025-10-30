import cors from 'cors';
import { corsOrigin } from '../config';

/**
 * CORS configuration
 */
export const corsMiddleware = cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Payment',
    'X-Payment-Response',
  ],
  exposedHeaders: ['X-Payment-Response'],
  credentials: true,
  maxAge: 86400, // 24 hours
});
