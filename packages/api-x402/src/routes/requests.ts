import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { x402RequestMiddleware } from '../middleware/x402';
import { createRequestOnChain } from '../services/solana';
import { convertUsdcToSol } from '../services/conversion';
import {
  CreateRequestParams,
  ApiResponse,
  CreateRequestResponse,
  AnswerType,
  OracleError,
} from '../types';
import logger from '../utils/logger';
import { generateCapabilityToken, isValidSolanaAddress } from '../utils/helpers';

const router = Router();

/**
 * POST /api/requests
 * Create a new oracle request
 */
router.post(
  '/',
  x402RequestMiddleware(true),
  async (req: Request, res: Response) => {
    try {
      const {
        question,
        answerType,
        rewardAmount,
        bondAmount,
        expiryTimestamp,
        challengePeriod,
        dataSource,
        metadata,
        creator,
      } = req.body;
      
      // Validate required fields
      if (!question || !answerType || !rewardAmount || !bondAmount || !expiryTimestamp || !challengePeriod) {
        throw new OracleError(
          'Missing required fields',
          'MISSING_FIELDS',
          400
        );
      }
      
      // Validate creator address
      if (!creator || !isValidSolanaAddress(creator)) {
        throw new OracleError(
          'Invalid creator address',
          'INVALID_CREATOR',
          400
        );
      }
      
      // Validate answer type
      if (!Object.values(AnswerType).includes(answerType)) {
        throw new OracleError(
          'Invalid answer type',
          'INVALID_ANSWER_TYPE',
          400
        );
      }
      
      // Validate timestamps
      const now = Math.floor(Date.now() / 1000);
      if (expiryTimestamp <= now) {
        throw new OracleError(
          'Expiry timestamp must be in the future',
          'INVALID_EXPIRY',
          400
        );
      }
      
      // Validate challenge period (1 hour to 7 days)
      if (challengePeriod < 3600 || challengePeriod > 604800) {
        throw new OracleError(
          'Challenge period must be between 1 hour and 7 days',
          'INVALID_CHALLENGE_PERIOD',
          400
        );
      }
      
      logger.info('Creating oracle request', {
        question,
        answerType,
        creator,
      });
      
      // Get payment info from middleware
      const payment = (req as any).payment;
      
      // Convert USDC amounts to SOL (if needed)
      // For simplicity, using the amounts as-is (assuming they're already in SOL)
      const rewardAmountSol = rewardAmount;
      const bondAmountSol = bondAmount;
      
      // Create request on-chain
      const creatorPubkey = new PublicKey(creator);
      const params: CreateRequestParams = {
        question,
        answerType,
        rewardAmount: rewardAmountSol,
        bondAmount: bondAmountSol,
        expiryTimestamp,
        challengePeriod,
        dataSource,
        metadata,
      };
      
      const result = await createRequestOnChain(params, creatorPubkey);
      
      // Generate capability token
      const capabilityToken = generateCapabilityToken(
        payment.id,
        result.requestId
      );
      
      // Build response
      const response: ApiResponse<CreateRequestResponse> = {
        success: true,
        data: {
          requestId: result.requestId,
          requestPda: result.requestPda.toString(),
          escrowPda: result.escrowPda.toString(),
          txSignature: result.txSignature,
          paymentId: payment.id,
          antispamBondRefundable: true,
          capabilityToken,
        },
        meta: {
          timestamp: Date.now(),
        },
      };
      
      logger.info('Request created successfully', {
        requestId: result.requestId,
        paymentId: payment.id,
      });
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating request', { error });
      throw error;
    }
  }
);

/**
 * GET /api/requests/:requestId
 * Get request details
 */
router.get('/:requestId', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const id = parseInt(requestId, 10);
    
    if (isNaN(id)) {
      throw new OracleError(
        'Invalid request ID',
        'INVALID_REQUEST_ID',
        400
      );
    }
    
    // Get request from Solana (mock for now)
    const requestData = {
      requestId: id,
      creator: 'mock_creator',
      question: 'Mock question',
      status: 'Created',
      // ... other fields
    };
    
    const response: ApiResponse = {
      success: true,
      data: requestData,
      meta: {
        timestamp: Date.now(),
      },
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
});

/**
 * GET /api/requests
 * Get all requests
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // In production, would query all requests from Solana
    const requests: any[] = [];
    
    const response: ApiResponse = {
      success: true,
      data: {
        requests,
        count: requests.length,
      },
      meta: {
        timestamp: Date.now(),
      },
    };
    
    res.json(response);
  } catch (error) {
    throw error;
  }
});

export default router;
