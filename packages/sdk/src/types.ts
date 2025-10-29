import { PublicKey } from '@solana/web3.js';

export interface OracleConfig {
  network: 'devnet' | 'mainnet-beta' | 'testnet';
  rpcUrl?: string;
  wallet?: any;
  programId?: string;
}

export interface CreateRequestParams {
  question: string;
  expiryMinutes: number;
  rewardSOL: number;
  bondSOL?: number;
  challengeHours?: number;
  dataSource?: string;
  metadata?: string;
}

export interface OracleRequest {
  id: string;
  requestId: number;
  question: string;
  status: 'created' | 'proposed' | 'disputed' | 'resolved' | 'cancelled';
  reward: number;
  bond: number;
  answer?: string;
  creator: string;
  proposer?: string;
  disputer?: string;
  createdAt: Date;
  expiresAt: Date;
  challengeEndsAt?: Date;
  resolvedAt?: Date;
  dataSource?: string;
  metadata?: string;
}

export interface RequestStats {
  total: number;
  active: number;
  proposed: number;
  disputed: number;
  resolved: number;
  cancelled: number;
  totalVolume: number;
  totalLocked: number;
}

export interface ProposerStats {
  address: string;
  totalProposals: number;
  successfulProposals: number;
  totalEarnings: number;
  successRate: number;
}
