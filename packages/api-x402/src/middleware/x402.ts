import { Request, Response, NextFunction } from 'express';
import {
  X402PaymentRequirement,
  X402Error,
  PaymentRecord,
  ApiResponse,
} from '../types';
import {
  verifyPayment,
  createRequestPaymentRequirements,
  createProposalPaymentRequirements,
  createDisputePaymentRequirements,
} from '../services/facilitator';
import { baseUrl } from '../config';
import logger from '../utils/logger';
import { generateId, create402ResponseBody } from '../utils/helpers';

// In-memory payment tracking (in production, use database)
const paymentRecords = new Map<string, PaymentRecord>();

/**
 * Extract X-PAYMENT header from request
 */
export function extractPaymentHeader(req: Request): string | null {
  const header = req.headers['x-payment'] as string;
  
  logger.info('Extracting payment header:', {
    hasHeader: !!header,
    headerLength: header?.length || 0,
    allHeaderKeys: Object.keys(req.headers),
  });
  
  return header || null;
}

/**
 * Create 402 response with payment requirements
 */
function send402Response(
  res: Response,
  paymentRequirements: X402PaymentRequirement
): void {
  const body = create402ResponseBody(paymentRequirements);
  
  res.status(402).json(body);
}

/**
 * X402 Middleware for Request Creation
 */
export function x402RequestMiddleware(antispamRequired: boolean = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract payment header
      const paymentHeader = extractPaymentHeader(req);
      
      // If no payment header, return 402 with requirements
      if (!paymentHeader) {
        logger.info('No payment header, returning 402', {
          path: req.path,
        });
        
        const requirements = await createRequestPaymentRequirements(
          `${baseUrl}${req.path}`,
          antispamRequired ? undefined : { amount: '0', asset: 'USDC' }
        );
        
        send402Response(res, requirements);
        return;
      }
      
      // Verify payment
      const requirements = await createRequestPaymentRequirements(
        `${baseUrl}${req.path}`
      );
      
      const verification = await verifyPayment(paymentHeader, requirements);
      
      if (!verification.valid) {
        logger.warn('Payment verification failed', {
          error: verification.error,
        });
        
        throw new X402Error(
          verification.error || 'Payment verification failed',
          'PAYMENT_VERIFICATION_FAILED',
          402
        );
      }
      
      // Payment verified - create payment record
      const paymentId = generateId();
      const record: PaymentRecord = {
        id: paymentId,
        paymentId,
        type: 'antispam',
        amount: requirements.schemes[0].amount,
        asset: requirements.schemes[0].asset.address,
        from: 'user', // Would extract from payment header
        to: requirements.schemes[0].recipient,
        txHash: verification.txHash,
        status: 'verified',
        refundable: true,
        createdAt: Date.now(),
        verifiedAt: Date.now(),
      };
      
      paymentRecords.set(paymentId, record);
      
      // Attach payment info to request
      (req as any).payment = {
        id: paymentId,
        verified: true,
        txHash: verification.txHash,
        record,
      };
      
      logger.info('Payment verified successfully', {
        paymentId,
        txHash: verification.txHash,
      });
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * X402 Middleware for Proposal Submission
 */
export function x402ProposalMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.body;
      
      if (!requestId) {
        throw new X402Error(
          'Request ID required',
          'MISSING_REQUEST_ID',
          400
        );
      }
      
      const paymentHeader = extractPaymentHeader(req);
      
      if (!paymentHeader) {
        logger.info('No payment header for proposal, returning 402');
        
        const requirements = await createProposalPaymentRequirements(
          `${baseUrl}${req.path}`,
          requestId
        );
        
        send402Response(res, requirements);
        return;
      }
      
      // Verify payment
      const requirements = await createProposalPaymentRequirements(
        `${baseUrl}${req.path}`,
        requestId
      );
      
      const verification = await verifyPayment(paymentHeader, requirements);
      
      if (!verification.valid) {
        throw new X402Error(
          verification.error || 'Payment verification failed',
          'PAYMENT_VERIFICATION_FAILED',
          402
        );
      }
      
      // Create payment record
      const paymentId = generateId();
      const record: PaymentRecord = {
        id: paymentId,
        paymentId,
        type: 'bond',
        amount: requirements.schemes[0].amount,
        asset: requirements.schemes[0].asset.address,
        from: 'proposer',
        to: requirements.schemes[0].recipient,
        txHash: verification.txHash,
        status: 'verified',
        refundable: false, // Bonds are not refundable
        createdAt: Date.now(),
        verifiedAt: Date.now(),
        requestId,
      };
      
      paymentRecords.set(paymentId, record);
      
      (req as any).payment = {
        id: paymentId,
        verified: true,
        txHash: verification.txHash,
        record,
      };
      
      logger.info('Proposal payment verified', {
        paymentId,
        requestId,
        txHash: verification.txHash,
      });
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * X402 Middleware for Dispute Submission
 */
export function x402DisputeMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { requestId } = req.body;
      
      if (!requestId) {
        throw new X402Error(
          'Request ID required',
          'MISSING_REQUEST_ID',
          400
        );
      }
      
      const paymentHeader = extractPaymentHeader(req);
      
      if (!paymentHeader) {
        logger.info('No payment header for dispute, returning 402');
        
        const requirements = await createDisputePaymentRequirements(
          `${baseUrl}${req.path}`,
          requestId
        );
        
        send402Response(res, requirements);
        return;
      }
      
      // Verify payment
      const requirements = await createDisputePaymentRequirements(
        `${baseUrl}${req.path}`,
        requestId
      );
      
      const verification = await verifyPayment(paymentHeader, requirements);
      
      if (!verification.valid) {
        throw new X402Error(
          verification.error || 'Payment verification failed',
          'PAYMENT_VERIFICATION_FAILED',
          402
        );
      }
      
      // Create payment record
      const paymentId = generateId();
      const record: PaymentRecord = {
        id: paymentId,
        paymentId,
        type: 'bond',
        amount: requirements.schemes[0].amount,
        asset: requirements.schemes[0].asset.address,
        from: 'disputer',
        to: requirements.schemes[0].recipient,
        txHash: verification.txHash,
        status: 'verified',
        refundable: false,
        createdAt: Date.now(),
        verifiedAt: Date.now(),
        requestId,
      };
      
      paymentRecords.set(paymentId, record);
      
      (req as any).payment = {
        id: paymentId,
        verified: true,
        txHash: verification.txHash,
        record,
      };
      
      logger.info('Dispute payment verified', {
        paymentId,
        requestId,
        txHash: verification.txHash,
      });
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Get payment record
 */
export function getPaymentRecord(paymentId: string): PaymentRecord | undefined {
  return paymentRecords.get(paymentId);
}

/**
 * Update payment record status
 */
export function updatePaymentStatus(
  paymentId: string,
  status: PaymentRecord['status'],
  metadata?: Record<string, any>
): boolean {
  const record = paymentRecords.get(paymentId);
  
  if (!record) {
    return false;
  }
  
  record.status = status;
  
  if (status === 'refunded') {
    record.refundedAt = Date.now();
  }
  
  if (metadata) {
    record.metadata = { ...record.metadata, ...metadata };
  }
  
  paymentRecords.set(paymentId, record);
  
  logger.info('Payment status updated', {
    paymentId,
    status,
  });
  
  return true;
}

/**
 * Get all payment records (for debugging)
 */
export function getAllPaymentRecords(): PaymentRecord[] {
  return Array.from(paymentRecords.values());
}
