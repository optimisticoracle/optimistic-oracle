import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { x402ProposalMiddleware } from '../middleware/x402';
import { proposeAnswerOnChain } from '../services/solana';
import { convertUsdcToSol } from '../services/conversion';
import {
  ProposeAnswerParams,
  ApiResponse,
  ProposeAnswerResponse,
  OracleError,
} from '../types';
import logger from '../utils/logger';
import { isValidSolanaAddress, calculateChallengeEndTime } from '../utils/helpers';

const router = Router();

/**
 * POST /api/proposals
 * Propose an answer to a request
 */
router.post(
  '/',
  x402ProposalMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const {
        requestId,
        answer,
        proposer,
      } = req.body;
      
      // Validate required fields
      if (!requestId || !answer || !proposer) {
        throw new OracleError(
          'Missing required fields',
          'MISSING_FIELDS',
          400
        );
      }
      
      // Validate proposer address
      if (!isValidSolanaAddress(proposer)) {
        throw new OracleError(
          'Invalid proposer address',
          'INVALID_PROPOSER',
          400
        );
      }
      
      // Validate answer length
      if (answer.length > 200) {
        throw new OracleError(
          'Answer too long (max 200 characters)',
          'ANSWER_TOO_LONG',
          400
        );
      }
      
      logger.info('Proposing answer', {
        requestId,
        answer,
        proposer,
      });
      
      // Get payment info from middleware
      const payment = (req as any).payment;
      
      // Convert USDC bond to SOL
      const conversion = await convertUsdcToSol(payment.record.amount);
      const bondAmountSol = conversion.toAmount;
      
      logger.info('Bond conversion', {
        usdcAmount: payment.record.amount,
        solAmount: bondAmountSol,
        rate: conversion.rate,
      });
      
      // Propose answer on-chain
      const proposerPubkey = new PublicKey(proposer);
      const params: ProposeAnswerParams = {
        requestId,
        answer,
        bond: {
          amount: payment.record.amount,
          asset: 'USDC',
        },
      };
      
      const result = await proposeAnswerOnChain(
        params,
        proposerPubkey,
        bondAmountSol
      );
      
      // Calculate challenge end time
      const proposalTime = Math.floor(Date.now() / 1000);
      const challengePeriod = 3600; // Default 1 hour, would get from request
      const challengeEndTime = calculateChallengeEndTime(proposalTime, challengePeriod);
      
      // Build response
      const response: ApiResponse<ProposeAnswerResponse> = {
        success: true,
        data: {
          requestId,
          proposalTxSignature: result.txSignature,
          bondTxSignature: result.txSignature, // Same tx for simplicity
          bondAmount: bondAmountSol,
          bondEscrowPda: result.escrowPda.toString(),
          paymentId: payment.id,
          proposalTime,
          challengeEndTime,
        },
        meta: {
          timestamp: Date.now(),
        },
      };
      
      logger.info('Proposal submitted successfully', {
        requestId,
        paymentId: payment.id,
        txSignature: result.txSignature,
      });
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error proposing answer', { error });
      throw error;
    }
  }
);

/**
 * GET /api/proposals/:requestId
 * Get proposal for a request
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
    
    // Get proposal from Solana (mock for now)
    const proposalData = {
      requestId: id,
      proposer: 'mock_proposer',
      answer: 'Mock answer',
      proposalTime: Date.now() / 1000,
      // ... other fields
    };
    
    const response: ApiResponse = {
      success: true,
      data: proposalData,
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
