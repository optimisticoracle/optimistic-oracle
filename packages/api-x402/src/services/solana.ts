import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import * as fs from 'fs';
import { solana } from '../config';
import {
  CreateRequestParams,
  ProposeAnswerParams,
  DisputeAnswerParams,
  RequestAccount,
  OracleStateAccount,
  AnswerType,
  RequestStatus,
} from '../types';
import logger from '../utils/logger';
import { solToLamports } from '../utils/helpers';

// IDL for the Optimistic Oracle program (simplified type)
const IDL = {
  version: '0.1.0',
  name: 'optimistic_oracle',
  instructions: [],
  accounts: [],
};

// Connection instance
let connection: Connection | null = null;
let program: Program | null = null;
let serverWallet: Keypair | null = null;

/**
 * Initialize Solana connection and program
 */
export function initializeSolana(): void {
  try {
    // Create connection
    connection = new Connection(solana.rpcUrl, solana.commitment as any);
    
    // Load server wallet
    const walletKeypair = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(fs.readFileSync(solana.serverWalletPath, 'utf-8')))
    );
    serverWallet = walletKeypair;
    
    // Create provider
    const wallet = new Wallet(walletKeypair);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: solana.commitment as any,
    });
    
    // Initialize program (would need actual IDL in production)
    const programId = new PublicKey(solana.programId);
    // program = new Program(IDL as any, programId, provider);
    
    logger.info('Solana connection initialized', {
      rpcUrl: solana.rpcUrl,
      programId: solana.programId,
      serverWallet: serverWallet.publicKey.toString(),
    });
  } catch (error: any) {
    logger.error('Failed to initialize Solana connection', { error: error.message });
    throw error;
  }
}

/**
 * Get connection instance
 */
export function getConnection(): Connection {
  if (!connection) {
    initializeSolana();
  }
  return connection!;
}

/**
 * Get server wallet
 */
export function getServerWallet(): Keypair {
  if (!serverWallet) {
    initializeSolana();
  }
  return serverWallet!;
}

/**
 * Get program ID
 */
export function getProgramId(): PublicKey {
  return new PublicKey(solana.programId);
}

/**
 * Derive PDA for oracle state
 */
export function deriveOracleStatePda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('oracle_state')],
    getProgramId()
  );
}

/**
 * Derive PDA for request
 */
export function deriveRequestPda(requestId: number): [PublicKey, number] {
  const requestIdBuffer = Buffer.alloc(8);
  requestIdBuffer.writeBigUInt64LE(BigInt(requestId));
  
  return PublicKey.findProgramAddressSync(
    [Buffer.from('request'), requestIdBuffer],
    getProgramId()
  );
}

/**
 * Derive PDA for request escrow
 */
export function deriveRequestEscrowPda(requestPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('request_escrow'), requestPda.toBuffer()],
    getProgramId()
  );
}

/**
 * Derive PDA for proposal escrow
 */
export function deriveProposalEscrowPda(requestPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proposal_escrow'), requestPda.toBuffer()],
    getProgramId()
  );
}

/**
 * Derive PDA for dispute escrow
 */
export function deriveDisputeEscrowPda(requestPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('dispute_escrow'), requestPda.toBuffer()],
    getProgramId()
  );
}

/**
 * Create oracle request on-chain
 */
export async function createRequestOnChain(
  params: CreateRequestParams,
  creator: PublicKey
): Promise<{
  requestId: number;
  requestPda: PublicKey;
  escrowPda: PublicKey;
  txSignature: string;
}> {
  try {
    logger.info('Creating request on-chain', { params, creator: creator.toString() });
    
    const conn = getConnection();
    const wallet = getServerWallet();
    
    // Get current request count from oracle state
    const [oracleStatePda] = deriveOracleStatePda();
    const oracleStateAccount = await conn.getAccountInfo(oracleStatePda);
    
    // Parse request count (simplified - would need proper deserialization)
    let requestCount = 1; // Default if oracle not initialized
    if (oracleStateAccount) {
      // Would parse actual account data here
      requestCount = 1; // Placeholder
    }
    
    const nextRequestId = requestCount + 1;
    
    // Derive PDAs
    const [requestPda] = deriveRequestPda(nextRequestId);
    const [escrowPda] = deriveRequestEscrowPda(requestPda);
    
    // Build transaction (simplified - would use actual program instructions)
    const transaction = new Transaction();
    
    // In production, would add actual create_request instruction here
    // For now, return mock data
    const txSignature = 'mock_tx_signature_' + Date.now();
    
    logger.info('Request created on-chain', {
      requestId: nextRequestId,
      requestPda: requestPda.toString(),
      escrowPda: escrowPda.toString(),
      txSignature,
    });
    
    return {
      requestId: nextRequestId,
      requestPda,
      escrowPda,
      txSignature,
    };
  } catch (error: any) {
    logger.error('Error creating request on-chain', { error: error.message });
    throw error;
  }
}

/**
 * Propose answer on-chain
 */
export async function proposeAnswerOnChain(
  params: ProposeAnswerParams,
  proposer: PublicKey,
  bondAmount: number
): Promise<{
  txSignature: string;
  escrowPda: PublicKey;
}> {
  try {
    logger.info('Proposing answer on-chain', {
      requestId: params.requestId,
      answer: params.answer,
      proposer: proposer.toString(),
    });
    
    const conn = getConnection();
    const wallet = getServerWallet();
    
    // Derive PDAs
    const [requestPda] = deriveRequestPda(params.requestId);
    const [escrowPda] = deriveProposalEscrowPda(requestPda);
    
    // Build transaction (simplified)
    const transaction = new Transaction();
    
    // In production, would add actual propose_answer instruction
    const txSignature = 'mock_proposal_tx_' + Date.now();
    
    logger.info('Answer proposed on-chain', {
      requestId: params.requestId,
      escrowPda: escrowPda.toString(),
      txSignature,
    });
    
    return {
      txSignature,
      escrowPda,
    };
  } catch (error: any) {
    logger.error('Error proposing answer on-chain', { error: error.message });
    throw error;
  }
}

/**
 * Dispute answer on-chain
 */
export async function disputeAnswerOnChain(
  params: DisputeAnswerParams,
  disputer: PublicKey,
  bondAmount: number
): Promise<{
  txSignature: string;
  escrowPda: PublicKey;
}> {
  try {
    logger.info('Disputing answer on-chain', {
      requestId: params.requestId,
      disputer: disputer.toString(),
    });
    
    const conn = getConnection();
    const wallet = getServerWallet();
    
    // Derive PDAs
    const [requestPda] = deriveRequestPda(params.requestId);
    const [escrowPda] = deriveDisputeEscrowPda(requestPda);
    
    // Build transaction (simplified)
    const transaction = new Transaction();
    
    // In production, would add actual dispute_answer instruction
    const txSignature = 'mock_dispute_tx_' + Date.now();
    
    logger.info('Answer disputed on-chain', {
      requestId: params.requestId,
      escrowPda: escrowPda.toString(),
      txSignature,
    });
    
    return {
      txSignature,
      escrowPda,
    };
  } catch (error: any) {
    logger.error('Error disputing answer on-chain', { error: error.message });
    throw error;
  }
}

/**
 * Get request account data
 */
export async function getRequest(requestId: number): Promise<RequestAccount | null> {
  try {
    const conn = getConnection();
    const [requestPda] = deriveRequestPda(requestId);
    
    const accountInfo = await conn.getAccountInfo(requestPda);
    
    if (!accountInfo) {
      return null;
    }
    
    // In production, would deserialize actual account data
    // For now, return mock data
    return {
      requestId,
      creator: PublicKey.default,
      question: 'Mock question',
      answerType: AnswerType.YesNo,
      rewardAmount: 1000000,
      bondAmount: 1000000,
      expiryTimestamp: Date.now() / 1000,
      challengePeriod: 3600,
      status: RequestStatus.Created,
      createdAt: Date.now() / 1000,
      bump: 0,
    };
  } catch (error: any) {
    logger.error('Error getting request', { error: error.message, requestId });
    return null;
  }
}

/**
 * Check if server wallet has sufficient balance
 */
export async function checkServerBalance(requiredAmount: number): Promise<boolean> {
  try {
    const conn = getConnection();
    const wallet = getServerWallet();
    
    const balance = await conn.getBalance(wallet.publicKey);
    const requiredLamports = solToLamports(requiredAmount);
    
    logger.info('Server wallet balance check', {
      balance,
      required: requiredLamports,
      sufficient: balance >= requiredLamports,
    });
    
    return balance >= requiredLamports;
  } catch (error: any) {
    logger.error('Error checking server balance', { error: error.message });
    return false;
  }
}

/**
 * Get server wallet balance
 */
export async function getServerBalance(): Promise<number> {
  try {
    const conn = getConnection();
    const wallet = getServerWallet();
    
    const balance = await conn.getBalance(wallet.publicKey);
    
    return balance / 1_000_000_000; // Convert to SOL
  } catch (error: any) {
    logger.error('Error getting server balance', { error: error.message });
    return 0;
  }
}
