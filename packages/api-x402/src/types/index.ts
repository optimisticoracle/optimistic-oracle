import { PublicKey } from '@solana/web3.js';

// ============================================================================
// X402 Payment Types
// ============================================================================

export interface X402PaymentHeader {
  version: string;
  scheme: string;
  network: string;
  signature: string;
  payload: X402PaymentPayload;
}

export interface X402PaymentPayload {
  from: string;
  to: string;
  amount: string;
  asset: {
    address: string;
    decimals: number;
  };
  nonce: string;
  timestamp: number;
}

export interface X402PaymentRequirement {
  version: string;
  schemes: X402Scheme[];
  description?: string;
  resource: string;
}

export interface X402Scheme {
  scheme: string;
  network: string;
  asset: {
    address: string;
    decimals: number;
  };
  recipient: string;
  amount: string;
}

export interface X402VerificationResult {
  valid: boolean;
  txHash?: string;
  error?: string;
}

// ============================================================================
// Oracle Request Types
// ============================================================================

export enum AnswerType {
  YesNo = 'YesNo',
  MultipleChoice = 'MultipleChoice',
  Numeric = 'Numeric',
}

export enum RequestStatus {
  Created = 'Created',
  Proposed = 'Proposed',
  Disputed = 'Disputed',
  Resolved = 'Resolved',
  Cancelled = 'Cancelled',
}

export interface CreateRequestParams {
  question: string;
  answerType: AnswerType;
  rewardAmount: number; // in SOL (will be converted from USDC)
  bondAmount: number; // in SOL (will be converted from USDC)
  expiryTimestamp: number;
  challengePeriod: number; // in seconds
  dataSource?: string;
  metadata?: string;
  // X402 specific
  antispamBond?: PaymentAmount;
  priorityTip?: PaymentAmount;
}

export interface ProposeAnswerParams {
  requestId: number;
  answer: string;
  // X402 specific
  bond: PaymentAmount;
  reputationStake?: PaymentAmount;
}

export interface DisputeAnswerParams {
  requestId: number;
  counterAnswer?: string;
  // X402 specific
  bond: PaymentAmount;
  resolutionBounty?: PaymentAmount;
}

export interface PaymentAmount {
  amount: string; // in micro-units (e.g., "10000000" for $10 USDC)
  asset: 'USDC' | 'SOL';
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId?: string;
  };
}

export interface CreateRequestResponse {
  requestId: number;
  requestPda: string;
  escrowPda: string;
  txSignature: string;
  paymentId: string;
  antispamBondRefundable: boolean;
  capabilityToken: string;
}

export interface ProposeAnswerResponse {
  requestId: number;
  proposalTxSignature: string;
  bondTxSignature: string;
  bondAmount: number;
  bondEscrowPda: string;
  paymentId: string;
  proposalTime: number;
  challengeEndTime: number;
}

export interface DisputeAnswerResponse {
  requestId: number;
  disputeTxSignature: string;
  bondTxSignature: string;
  bondAmount: number;
  bondEscrowPda: string;
  paymentId: string;
  disputeTime: number;
  bountyId?: string;
}

// ============================================================================
// Solana Program Types
// ============================================================================

export interface OracleStateAccount {
  admin: PublicKey;
  requestCount: number;
  totalVolume: number;
  bump: number;
}

export interface RequestAccount {
  requestId: number;
  creator: PublicKey;
  question: string;
  answerType: AnswerType;
  rewardAmount: number;
  bondAmount: number;
  expiryTimestamp: number;
  challengePeriod: number;
  dataSource?: string;
  metadata?: string;
  status: RequestStatus;
  createdAt: number;
  proposer?: PublicKey;
  proposalTime?: number;
  answer?: string;
  disputer?: PublicKey;
  disputeTime?: number;
  resolvedAt?: number;
  bump: number;
}

// ============================================================================
// Payment Tracking Types
// ============================================================================

export interface PaymentRecord {
  id: string;
  paymentId: string;
  type: 'antispam' | 'bond' | 'tip' | 'bounty' | 'stake';
  amount: string;
  asset: string;
  from: string;
  to: string;
  txHash?: string;
  status: 'pending' | 'verified' | 'refunded' | 'slashed';
  refundable: boolean;
  createdAt: number;
  verifiedAt?: number;
  refundedAt?: number;
  requestId?: number;
  metadata?: Record<string, any>;
}

export interface BondRecord {
  bondId: string;
  requestId: number;
  type: 'proposer' | 'disputer';
  amount: number; // in SOL
  usdcAmount: string; // original USDC payment
  paymentId: string;
  escrowPda: string;
  holder: string;
  status: 'active' | 'released' | 'slashed';
  createdAt: number;
  releasedAt?: number;
}

export interface BountyRecord {
  bountyId: string;
  requestId: number;
  type: 'resolution' | 'keeper' | 'arbitration';
  amount: string;
  asset: string;
  poster: string;
  claimedBy?: string;
  status: 'active' | 'claimed' | 'expired';
  createdAt: number;
  claimedAt?: number;
  expiresAt: number;
}

// ============================================================================
// Conversion & Price Types
// ============================================================================

export interface PriceInfo {
  price: number; // SOL/USDC price
  confidence: number;
  timestamp: number;
  source: 'pyth' | 'cache';
}

export interface ConversionResult {
  fromAmount: string;
  fromAsset: string;
  toAmount: number;
  toAsset: string;
  rate: number;
  timestamp: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  baseUrl: string;
  corsOrigin: string[];
  solana: {
    rpcUrl: string;
    commitment: string;
    programId: string;
    serverWalletPath: string;
  };
  x402: {
    treasuryAddress: string;
    facilitatorUrl: string;
    usdcMint: string;
  };
  payments: {
    antispamBondAmount: string;
    proposerBondAmount: string;
    disputerBondAmount: string;
  };
  pyth: {
    priceFeedSolUsd: string;
  };
  rateLimit: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  logging: {
    level: string;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class X402Error extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 402,
    public details?: any
  ) {
    super(message);
    this.name = 'X402Error';
  }
}

export class OracleError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'OracleError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type Awaited<T> = T extends Promise<infer U> ? U : T;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
