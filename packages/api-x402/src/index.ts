import express, { Application } from 'express';
import { config, validateConfig, logConfig } from './config';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeSolana } from './services/solana';
import { startPriceRefreshInterval } from './services/conversion';
import logger from './utils/logger';

// Import routes
import healthRoutes from './routes/health';
import requestRoutes from './routes/requests';
import proposalRoutes from './routes/proposals';
import disputeRoutes from './routes/disputes';

// Create Express app
const app: Application = express();

/**
 * Initialize application
 */
async function initializeApp(): Promise<void> {
  try {
    logger.info('🚀 Initializing Optimistic Oracle X402 API Server...');
    
    // Validate configuration
    validateConfig();
    logConfig();
    
    // Initialize Solana connection
    logger.info('Initializing Solana connection...');
    initializeSolana();
    
    // Start price refresh interval
    logger.info('Starting price refresh interval...');
    startPriceRefreshInterval(60000); // Every 1 minute
    
    logger.info('✅ Application initialized successfully');
  } catch (error: any) {
    logger.error('Failed to initialize application', { error: error.message });
    process.exit(1);
  }
}

/**
 * Configure middleware
 */
function configureMiddleware(): void {
  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS
  app.use(corsMiddleware);
  
  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });
}

/**
 * Configure routes
 */
function configureRoutes(): void {
  // Health check
  app.use('/health', healthRoutes);
  
  // API routes
  app.use('/api/requests', requestRoutes);
  app.use('/api/proposals', proposalRoutes);
  app.use('/api/disputes', disputeRoutes);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      name: 'Optimistic Oracle X402 API',
      version: '1.0.0',
      description: 'X402-enabled REST API for Optimistic Oracle on Solana',
      endpoints: {
        health: '/health',
        requests: '/api/requests',
        proposals: '/api/proposals',
        disputes: '/api/disputes',
      },
      documentation: 'https://github.com/optimisticoracle/optimistic-oracle',
    });
  });
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Error handler (must be last)
  app.use(errorHandler);
}

/**
 * Start server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize app
    await initializeApp();
    
    // Configure middleware
    configureMiddleware();
    
    // Configure routes
    configureRoutes();
    
    // Start listening
    app.listen(config.port, () => {
      logger.info(`🚀 Server started successfully!`);
      logger.info(`📡 Listening on port ${config.port}`);
      logger.info(`🌐 Base URL: ${config.baseUrl}`);
      logger.info(`🔗 Health check: ${config.baseUrl}/health`);
      logger.info(`📚 API Docs: ${config.baseUrl}/`);
      logger.info('');
      logger.info('✨ Ready to accept X402 payments! ✨');
    });
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
