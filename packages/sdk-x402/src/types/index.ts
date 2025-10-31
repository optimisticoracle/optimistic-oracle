/**
 * Type definitions for Optimistic Oracle SDK
 */

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

// ============================================================================
// Request Types
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
  rewardAmount: number;
  bondAmount: number;
  expiryTimestamp: number;
  challengePeriod: number;
  creator: string;
  dataSource?: string;
  metadata?: string;
}

export interface ProposeAnswerParams {
  requestId: number;
  answer: string;
  proposer: string;
}

export interface DisputeAnswerParams {
  requestId: number;
  counterAnswer?: string;
  disputer: string;
  resolutionBounty?: PaymentAmount;
}

export interface PaymentAmount {
  amount: string;
  asset: 'USDC' | 'SOL';
}

// ============================================================================
// X402 Payment Types
// ============================================================================

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

// ============================================================================
// Response Types
// ============================================================================

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

export interface RequestDetails {
  requestId: number;
  creator: string;
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
  proposer?: string;
  proposalTime?: number;
  answer?: string;
  disputer?: string;
  disputeTime?: number;
  resolvedAt?: number;
}

// ============================================================================
// SDK Configuration
// ============================================================================

export interface SDKConfig {
  apiUrl: string;
  network?: 'solana-devnet' | 'solana';
  timeout?: number;
}

// ============================================================================
// Wallet Adapter Interface
// ============================================================================

export interface WalletAdapter {
  publicKey: string;
  signTransaction: (transaction: any) => Promise<any>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}
