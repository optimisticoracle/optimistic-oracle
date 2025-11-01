import axios from 'axios';
import { x402, payments } from '../config';
import logger from '../utils/logger';

/**
 * PayAI Facilitator Integration
 * Implements x402 payment protocol for Solana
 */

// Types for X402 Protocol (PayAI spec)
interface PaymentRequirement {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: {
    feePayer: string;
  };
}

interface X402Response {
  x402Version: number;
  accepts: PaymentRequirement[];
}

interface VerificationResult {
  valid: boolean;
  error?: string;
  txHash?: string;
}

/**
 * Create payment requirements for request creation
 */
export async function createRequestPaymentRequirements(
  resource: string,
  customAmount?: { amount: string; asset: string }
): Promise<X402Response> {
  const amount = customAmount?.amount || payments.antispamBondAmount;

  return {
    x402Version: 1,
    accepts: [{
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: amount,
      resource,
      description: 'Payment required to create oracle request',
      mimeType: 'application/json',
      payTo: x402.treasuryAddress,
      maxTimeoutSeconds: 60,
      asset: x402.usdcMint,
      extra: {
        feePayer: x402.treasuryAddress,
      },
    }],
  };
}

/**
 * Create payment requirements for proposal submission
 */
export async function createProposalPaymentRequirements(
  resource: string,
  requestId: number | string
): Promise<X402Response> {
  return {
    x402Version: 1,
    accepts: [{
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: payments.proposerBondAmount,
      resource,
      description: `Payment required to propose answer for request #${requestId}`,
      mimeType: 'application/json',
      payTo: x402.treasuryAddress,
      maxTimeoutSeconds: 60,
      asset: x402.usdcMint,
      extra: {
        feePayer: x402.treasuryAddress,
      },
    }],
  };
}

/**
 * Create payment requirements for dispute submission
 */
export async function createDisputePaymentRequirements(
  resource: string,
  requestId: number | string
): Promise<X402Response> {
  return {
    x402Version: 1,
    accepts: [{
      scheme: 'exact',
      network: 'solana-devnet',
      maxAmountRequired: payments.disputerBondAmount,
      resource,
      description: `Payment required to dispute answer for request #${requestId}`,
      mimeType: 'application/json',
      payTo: x402.treasuryAddress,
      maxTimeoutSeconds: 60,
      asset: x402.usdcMint,
      extra: {
        feePayer: x402.treasuryAddress,
      },
    }],
  };
}

/**
 * Verify X402 payment via PayAI facilitator
 */
export async function verifyPayment(
  paymentHeader: string,
  paymentRequirements: X402Response
): Promise<VerificationResult> {
  try {
    logger.info('Verifying X402 payment via PayAI facilitator');

    // PayAI expects first accept requirement
    const requirement = paymentRequirements.accepts[0];

    // Decode X-PAYMENT header to get paymentPayload (PayAI expects decoded JSON)
    const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));

    // Call PayAI facilitator /verify endpoint
    const response = await axios.post(
      `${x402.facilitatorUrl}/verify`,
      {
        paymentPayload,
        paymentRequirements: requirement,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const { isValid, invalidReason } = response.data;

    if (isValid) {
      logger.info('Payment verified successfully');
      return {
        valid: true,
        txHash: response.data.txHash,
      };
    } else {
      logger.warn('Payment verification failed', { reason: invalidReason });
      return {
        valid: false,
        error: invalidReason || 'Payment verification failed',
      };
    }
  } catch (error: any) {
    logger.error('Error verifying payment', {
      error: error.message,
      facilitatorUrl: x402.facilitatorUrl,
    });

    return {
      valid: false,
      error: error.response?.data?.invalidReason || error.message || 'Failed to verify payment',
    };
  }
}

/**
 * Settle payment on-chain via PayAI facilitator
 */
export async function settlePayment(
  paymentHeader: string,
  paymentRequirements: X402Response
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    logger.info('Settling payment on-chain via PayAI');

    const requirement = paymentRequirements.accepts[0];

    // Decode X-PAYMENT header
    const paymentPayload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));

    // Call PayAI facilitator /settle endpoint
    const response = await axios.post(
      `${x402.facilitatorUrl}/settle`,
      {
        paymentPayload,
        paymentRequirements: requirement,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const { success, txHash, error } = response.data;

    if (success) {
      logger.info('Payment settled successfully', { txHash });
      return { success: true, txHash };
    } else {
      logger.warn('Payment settlement failed', { error });
      return { success: false, error };
    }
  } catch (error: any) {
    logger.error('Error settling payment', { error: error.message });
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to settle payment',
    };
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

    return response.data.kinds?.map((k: any) => k.network) || ['solana-devnet'];
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

    return response.status === 200;
  } catch (error) {
    logger.error('Facilitator health check failed');
    return false;
  }
}