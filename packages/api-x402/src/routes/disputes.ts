import { Router, Request, Response } from 'express';
import { PublicKey } from '@solana/web3.js';
import { x402DisputeMiddleware } from '../middleware/x402';
import { disputeAnswerOnChain } from '../services/solana';
import { convertUsdcToSol } from '../services/conversion';
import {
  DisputeAnswerParams,
  ApiResponse,
  DisputeAnswerResponse,
  OracleError,
} from '../types';
import logger from '../utils/logger';
import { isValidSolanaAddress, generateId } from '../utils/helpers';

const router = Router();

/**
 * POST /api/disputes
 * Dispute a proposed answer
 */
router.post(
  '/',
  x402DisputeMiddleware(),
  async (req: Request, res: Response) => {
    try {
      const {
        requestId,
        counterAnswer,
        disputer,
        resolutionBounty,
      } = req.body;
      
      // Validate required fields
      if (!requestId || !disputer) {
        throw new OracleError(
          'Missing required fields',
          'MISSING_FIELDS',
          400
        );
      }
      
      // Validate disputer address
      if (!isValidSolanaAddress(disputer)) {
        throw new OracleError(
          'Invalid disputer address',
          'INVALID_DISPUTER',
          400
        );
      }
      
      // Validate counter answer if provided
      if (counterAnswer && counterAnswer.length > 200) {
        throw new OracleError(
          'Counter answer too long (max 200 characters)',
          'ANSWER_TOO_LONG',
          400
        );
      }
      
      logger.info('Disputing answer', {
        requestId,
        disputer,
        hasCounterAnswer: !!counterAnswer,
      });
      
      // Get payment info from middleware
      const payment = (req as any).payment;
      
      // Convert USDC bond to SOL
      const conversion = await convertUsdcToSol(payment.record.amount);
      const bondAmountSol = conversion.toAmount;
      
      logger.info('Dispute bond conversion', {
        usdcAmount: payment.record.amount,
        solAmount: bondAmountSol,
        rate: conversion.rate,
      });
      
      // Dispute answer on-chain
      const disputerPubkey = new PublicKey(disputer);
      const params: DisputeAnswerParams = {
        requestId,
        counterAnswer,
        bond: {
          amount: payment.record.amount,
          asset: 'USDC',
        },
        resolutionBounty,
      };
      
      const result = await disputeAnswerOnChain(
        params,
        disputerPubkey,
        bondAmountSol
      );
      
      // Generate bounty ID if bounty provided
      const bountyId = resolutionBounty ? generateId() : undefined;
      
      const disputeTime = Math.floor(Date.now() / 1000);
      
      // Build response
      const response: ApiResponse<DisputeAnswerResponse> = {
        success: true,
        data: {
          requestId,
          disputeTxSignature: result.txSignature,
          bondTxSignature: result.txSignature,
          bondAmount: bondAmountSol,
          bondEscrowPda: result.escrowPda.toString(),
          paymentId: payment.id,
          disputeTime,
          bountyId,
        },
        meta: {
          timestamp: Date.now(),
        },
      };
      
      logger.info('Dispute submitted successfully', {
        requestId,
        paymentId: payment.id,
        txSignature: result.txSignature,
        bountyId,
      });
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error disputing answer', { error });
      throw error;
    }
  }
);

/**
 * GET /api/disputes/:requestId
 * Get dispute for a request
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
    
    // Get dispute from Solana (mock for now)
    const disputeData = {
      requestId: id,
      disputer: 'mock_disputer',
      disputeTime: Date.now() / 1000,
      // ... other fields
    };
    
    const response: ApiResponse = {
      success: true,
      data: disputeData,
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
