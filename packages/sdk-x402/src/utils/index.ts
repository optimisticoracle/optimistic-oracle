import bs58 from 'bs58';

/**
 * Utility functions for SDK
 */

/**
 * Generate random nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return bs58.encode(array);
}

/**
 * Get current Unix timestamp
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert USD to USDC micro-units
 */
export function usdToUsdc(usd: number): string {
  return Math.floor(usd * 1_000_000).toString();
}

/**
 * Convert USDC micro-units to USD
 */
export function usdcToUsd(microUnits: string): number {
  return parseInt(microUnits, 10) / 1_000_000;
}

/**
 * Validate Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    const decoded = bs58.decode(address);
    return decoded.length === 32;
  } catch {
    return false;
  }
}

/**
 * Format timestamp to ISO string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Calculate expiry timestamp
 */
export function calculateExpiry(minutesFromNow: number): number {
  return getCurrentTimestamp() + minutesFromNow * 60;
}

/**
 * Parse error message from API response
 */
export function parseErrorMessage(error: any): string {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Encode X402 payment header to base64
 */
export function encodePaymentHeader(header: any): string {
  const jsonString = JSON.stringify(header);
  return Buffer.from(jsonString).toString('base64');
}

/**
 * Decode X402 payment header from base64
 */
export function decodePaymentHeader(encoded: string): any {
  const jsonString = Buffer.from(encoded, 'base64').toString('utf-8');
  return JSON.parse(jsonString);
}
