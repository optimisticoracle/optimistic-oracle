import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types';
import { checkFacilitatorHealth } from '../services/facilitator';
import { getServerBalance } from '../services/solana';
import { getExchangeRate } from '../services/conversion';
import { config } from '../config';

const router = Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const [facilitatorHealthy, serverBalance, exchangeRate] = await Promise.all([
      checkFacilitatorHealth(),
      getServerBalance(),
      getExchangeRate(),
    ]);
    
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: Date.now(),
        version: '1.0.0',
        services: {
          facilitator: facilitatorHealthy ? 'healthy' : 'unhealthy',
          solana: 'healthy',
          priceOracle: 'healthy',
        },
        serverBalance,
        exchangeRate,
        config: {
          network: 'solana-devnet',
          programId: config.solana.programId,
        },
      },
    };
    
    res.json(response);
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Health check failed',
      },
    });
  }
});

export default router;
