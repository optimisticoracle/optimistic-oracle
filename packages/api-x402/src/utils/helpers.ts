import { PublicKey } from '@solana/web3.js';
import * as crypto from 'crypto';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a capability token
 */
export function generateCapabilityToken(paymentId: string, requestId: number): string {
  const data = `${paymentId}:${requestId}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify capability token
 */
export function verifyCapabilityToken(token: string, paymentId: string, requestId: number): boolean {
  // Simple verification - in production, use more robust method
  return token.length === 64; // SHA256 hex length
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert USDC micro-units to dollars
 */
export function usdcToUsd(microUnits: string): number {
  return parseInt(microUnits, 10) / 1_000_000;
}

/**
 * Convert USD to USDC micro-units
 */
export function usdToUsdc(usd: number): string {
  return Math.floor(usd * 1_000_000).toString();
}

/**
 * Convert SOL lamports to SOL
 */
export function lamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
  throw new Error('Retry failed');
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Get current Unix timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Validate payment amount
 */
export function isValidPaymentAmount(amount: string): boolean {
  const parsed = parseInt(amount, 10);
  return !isNaN(parsed) && parsed > 0;
}

/**
 * Calculate challenge end time
 */
export function calculateChallengeEndTime(proposalTime: number, challengePeriod: number): number {
  return proposalTime + challengePeriod;
}

/**
 * Check if challenge period has expired
 */
export function isChallengeExpired(proposalTime: number, challengePeriod: number): boolean {
  const endTime = calculateChallengeEndTime(proposalTime, challengePeriod);
  return getCurrentTimestamp() > endTime;
}

/**
 * Truncate string
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Parse X-PAYMENT header
 */
export function parsePaymentHeader(header: string): any {
  try {
    // X402 payment header is base64 encoded JSON
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid X-PAYMENT header format');
  }
}

/**
 * Create 402 response body
 */
export function create402ResponseBody(paymentRequirements: any): any {
  return {
    error: {
      code: 'PAYMENT_REQUIRED',
      message: 'Payment required to access this resource',
    },
    paymentRequirements,
  };
}
