import axios from 'axios';
import { x402, payments } from '../config';
import { 
  X402PaymentRequirement, 
  X402VerificationResult,
  X402Scheme,
  PaymentAmount
} from '../types';
import logger from '../utils/logger';
import { generateId } from '../utils/helpers';

/**
 * Create payment requirements for request creation
 */
export async function createRequestPaymentRequirements(
  resource: string,
  antispamBond?: PaymentAmount,
  priorityTip?: PaymentAmount
): Promise<X402PaymentRequirement> {
  const schemes: X402Scheme[] = [];
  
  // Antispam bond requirement
  if (antispamBond) {
    schemes.push({
      scheme: 'exact',
      network: 'solana-devnet',
      asset: {
        address: x402.usdcMint,
        decimals: 6,
      },
      recipient: x402.treasuryAddress,
      amount: antispamBond.amount,
    });
  } else {
    // Default antispam bond
    schemes.push({
      scheme: 'exact',
      network: 'solana-devnet',
      asset: {
        address: x402.usdcMint,
        decimals: 6,
      },
      recipient: x402.treasuryAddress,
      amount: payments.antispamBondAmount,
    });
  }
  
  // Priority tip (optional)
  if (priorityTip) {
    schemes.push({
      scheme: 'exact',
      network: 'solana-devnet',
      asset: {
        address: x402.usdcMint,
        decimals: 6,
      },
      recipient: x402.treasuryAddress,
      amount: priorityTip.amount,
    });
  }
  
  return {
    version: '1.0',
    schemes,
    description: 'Payment required to create oracle request',
    resource,
  };
}

/**
 * Create payment requirements for proposal submission
 */
export async function createProposalPaymentRequirements(
  resource: string,
  requestId: number,
  bond?: PaymentAmount,
  reputationStake?: PaymentAmount
): Promise<X402PaymentRequirement> {
  const schemes: X402Scheme[] = [];
  
  // Proposer bond requirement
  const bondAmount = bond?.amount || payments.proposerBondAmount;
  schemes.push({
    scheme: 'exact',
    network: 'solana-devnet',
    asset: {
      address: x402.usdcMint,
      decimals: 6,
    },
    recipient: x402.treasuryAddress,
    amount: bondAmount,
  });
  
  // Reputation stake (optional)
  if (reputationStake) {
    schemes.push({
      scheme: 'exact',
      network: 'solana-devnet',
      asset: {
        address: x402.usdcMint,
        decimals: 6,
      },
      recipient: x402.treasuryAddress,
      amount: reputationStake.amount,
    });
  }
  
  return {
    version: '1.0',
    schemes,
    description: `Payment required to propose answer for request #${requestId}`,
    resource,
  };
}

/**
 * Create payment requirements for dispute submission
 */
export async function createDisputePaymentRequirements(
  resource: string,
  requestId: number,
  bond?: PaymentAmount,
  resolutionBounty?: PaymentAmount
): Promise<X402PaymentRequirement> {
  const schemes: X402Scheme[] = [];
  
  // Disputer bond requirement (symmetric with proposer)
  const bondAmount = bond?.amount || payments.disputerBondAmount;
  schemes.push({
    scheme: 'exact',
    network: 'solana-devnet',
    asset: {
      address: x402.usdcMint,
      decimals: 6,
    },
    recipient: x402.treasuryAddress,
    amount: bondAmount,
  });
  
  // Resolution bounty (optional)
  if (resolutionBounty) {
    schemes.push({
      scheme: 'exact',
      network: 'solana-devnet',
      asset: {
        address: x402.usdcMint,
        decimals: 6,
      },
      recipient: x402.treasuryAddress,
      amount: resolutionBounty.amount,
    });
  }
  
  return {
    version: '1.0',
    schemes,
    description: `Payment required to dispute answer for request #${requestId}`,
    resource,
  };
}

/**
 * Verify X402 payment via PayAI facilitator
 */
export async function verifyPayment(
  paymentHeader: string,
  paymentRequirements: X402PaymentRequirement
): Promise<X402VerificationResult> {
  try {
    logger.info('Verifying X402 payment via PayAI facilitator');
    
    // Call PayAI facilitator verify endpoint
    const response = await axios.post(
      `${x402.facilitatorUrl}/verify`,
      {
        payment: paymentHeader,
        requirements: paymentRequirements,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );
    
    if (response.data.valid) {
      logger.info('Payment verified successfully', {
        txHash: response.data.txHash,
      });
      
      return {
        valid: true,
        txHash: response.data.txHash,
      };
    } else {
      logger.warn('Payment verification failed', {
        error: response.data.error,
      });
      
      return {
        valid: false,
        error: response.data.error || 'Payment verification failed',
      };
    }
  } catch (error: any) {
    logger.error('Error verifying payment', {
      error: error.message,
      facilitatorUrl: x402.facilitatorUrl,
    });
    
    return {
      valid: false,
      error: error.message || 'Failed to verify payment',
    };
  }
}

/**
 * Settle payment on-chain via PayAI facilitator
 */
export async function settlePayment(
  paymentId: string,
  txHash: string
): Promise<boolean> {
  try {
    logger.info('Settling payment on-chain', { paymentId, txHash });
    
    const response = await axios.post(
      `${x402.facilitatorUrl}/settle`,
      {
        paymentId,
        txHash,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      }
    );
    
    if (response.data.settled) {
      logger.info('Payment settled successfully', {
        paymentId,
        settlementTx: response.data.settlementTx,
      });
      return true;
    }
    
    return false;
  } catch (error: any) {
    logger.error('Error settling payment', {
      error: error.message,
      paymentId,
    });
    return false;
  }
}

/**
 * Refund payment via PayAI facilitator
 */
export async function refundPayment(
  paymentId: string,
  recipient: string,
  amount: string
): Promise<boolean> {
  try {
    logger.info('Refunding payment', { paymentId, recipient, amount });
    
    const response = await axios.post(
      `${x402.facilitatorUrl}/refund`,
      {
        paymentId,
        recipient,
        amount,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    if (response.data.refunded) {
      logger.info('Payment refunded successfully', {
        paymentId,
        refundTx: response.data.refundTx,
      });
      return true;
    }
    
    return false;
  } catch (error: any) {
    logger.error('Error refunding payment', {
      error: error.message,
      paymentId,
    });
    return false;
  }
}

/**
 * Get supported networks from facilitator
 */
export async function getSupportedNetworks(): Promise<string[]> {
  try {
    const response = await axios.get(`${x402.facilitatorUrl}/supported`, {
      timeout: 5000,
    });
    
    return response.data.networks || ['solana-devnet'];
  } catch (error) {
    logger.warn('Failed to fetch supported networks, using default');
    return ['solana-devnet'];
  }
}

/**
 * Health check for facilitator
 */
export async function checkFacilitatorHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${x402.facilitatorUrl}/health`, {
      timeout: 5000,
    });
    
    return response.status === 200 && response.data.status === 'healthy';
  } catch (error) {
    logger.error('Facilitator health check failed');
    return false;
  }
}
