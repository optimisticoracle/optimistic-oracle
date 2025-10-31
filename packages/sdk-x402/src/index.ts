/**
 * Optimistic Oracle SDK with X402 Payment Integration
 * 
 * @packageDocumentation
 */

// Export main client
export { OptimisticOracleClient, createClient } from './client';

// Export payment handler
export { X402PaymentHandler, createPaymentHandler } from './payments';

// Export all types
export * from './types';

// Export utilities
export * from './utils';

// Re-export for convenience
export { Connection, PublicKey } from '@solana/web3.js';
