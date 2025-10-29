import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const IDL = require('./idl/optimistic_oracle.json');
const PROGRAM_ID = new PublicKey('4qdXVoVkqjHWXKTMii1kk98e8mCw3Ps7ctsgGNMgdkFU');

export interface RequestData {
  id: string;
  requestId: number;
  requester: string;
  question: string;
  reward: number;
  bond: number;
  expiryTime: number;
  challengePeriod: number;
  status: string;
  answer?: string;
  proposer?: string;
  proposedAt?: number;
  challengeEndsAt?: string;
  dataSource?: string;
  createdAt: string;
}

export class OptimisticOracleSDK {
  private connection: Connection;
  private wallet: Wallet;
  private provider: AnchorProvider;
  private program: Program<any>;

  constructor(network: 'devnet' | 'mainnet-beta' = 'devnet', walletPath?: string) {
    // SIMPLE FIX: Always use public Solana RPC
    const endpoint = 'https://api.devnet.solana.com';
    
    console.log('🔌 SDK connecting to:', endpoint);
    this.connection = new Connection(endpoint, 'confirmed');

    let keypair: Keypair;
    if (walletPath) {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      keypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    } else {
      keypair = Keypair.generate();
    }
    
    this.wallet = new Wallet(keypair);

    this.provider = new AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: 'confirmed' }
    );
    
    this.program = new Program(IDL as any, this.provider);
  }

  getWalletAddress(): string {
    return this.wallet.publicKey.toBase58();
  }

  private getRequestPDA(requestId: number): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('request'),
        new anchor.BN(requestId).toArrayLike(Buffer, 'le', 8)
      ],
      PROGRAM_ID
    );
    return pda;
  }

  async createRequest(
    question: string,
    expiryMinutes: number,
    rewardSOL: number,
    bondSOL: number,
    challengeHours: number,
    dataSource: string = ''
  ): Promise<{ requestId: number; signature: string }> {
    try {
      const [statePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('oracle_state')],
        PROGRAM_ID
      );

      const state: any = await (this.program.account as any).oracleState.fetch(statePDA);
      const requestId = state.requestCount;
      const requestPDA = this.getRequestPDA(requestId);
      const requestCount = new anchor.BN(requestId);
      
      const questionBytes = Buffer.from(question);
      const dataSourceBytes = Buffer.from(dataSource);
      const expiryTime = new anchor.BN(Date.now() / 1000 + expiryMinutes * 60);
      const reward = new anchor.BN(rewardSOL * 1e9);
      const bond = new anchor.BN(bondSOL * 1e9);
      const challengePeriod = new anchor.BN(challengeHours * 3600);

      const tx = await (this.program.methods as any)
        .createRequest(
          requestCount,
          questionBytes,
          expiryTime,
          reward,
          bond,
          challengePeriod,
          dataSourceBytes
        )
        .accountsPartial({
          request: requestPDA,
          oracleState: statePDA,
          requester: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Request created with ID:', requestId);
      console.log('Transaction signature:', tx);

      return { requestId, signature: tx };
    } catch (error) {
      console.error('Error creating request:', error);
      throw error;
    }
  }

  async proposeAnswer(
    requestId: number,
    answer: string
  ): Promise<{ signature: string; proposer: string }> {
    try {
      const requestPDA = this.getRequestPDA(requestId);
      const requestAccount: any = await (this.program.account as any).request.fetch(requestPDA);
      
      if (!requestAccount) {
        throw new Error('Request not found');
      }

      const answerBytes = Buffer.from(answer);
      
      const tx = await (this.program.methods as any)
        .proposeAnswer(answerBytes)
        .accounts({
          request: requestPDA,
          proposer: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Proposed answer:', answer);
      console.log('Transaction signature:', tx);

      return {
        signature: tx,
        proposer: this.wallet.publicKey.toBase58()
      };
    } catch (error) {
      console.error('Error proposing answer:', error);
      throw error;
    }
  }

  async getRequest(requestId: number): Promise<RequestData | null> {
    try {
      const requestPDA = this.getRequestPDA(requestId);
      const request: any = await (this.program.account as any).request.fetch(requestPDA);

      if (!request) return null;

      let status = 'unknown';
      if (request.status) {
        if (request.status.created) status = 'created';
        else if (request.status.proposed) status = 'proposed';
        else if (request.status.disputed) status = 'disputed';
        else if (request.status.resolved) status = 'resolved';
        else if (request.status.cancelled) status = 'cancelled';
      }

      const rewardAmount = request.rewardAmount ? parseInt(request.rewardAmount, 16) : 0;
      const bondAmount = request.bondAmount ? parseInt(request.bondAmount, 16) : 0;
      const expiryTimestamp = request.expiryTimestamp ? parseInt(request.expiryTimestamp, 16) : 0;
      const challengePeriod = request.challengePeriod ? parseInt(request.challengePeriod, 16) : 0;
      const createdAt = request.createdAt ? parseInt(request.createdAt, 16) : 0;
      const proposalTime = request.proposalTime ? parseInt(request.proposalTime, 16) : 0;

      return {
        id: requestPDA.toBase58(),
        requestId: parseInt(request.requestId, 16) || 0,
        requester: request.creator || 'unknown',
        question: request.question || 'No question',
        reward: rewardAmount / 1e9,
        bond: bondAmount / 1e9,
        expiryTime: expiryTimestamp,
        challengePeriod: challengePeriod,
        status,
        answer: request.answer || undefined,
        proposer: request.proposer || undefined,
        proposedAt: proposalTime || undefined,
        challengeEndsAt: proposalTime && challengePeriod
          ? new Date((proposalTime + challengePeriod) * 1000).toISOString()
          : undefined,
        dataSource: request.dataSource || undefined,
        createdAt: createdAt ? new Date(createdAt * 1000).toISOString() : new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching request:', error);
      return null;
    }
  }

  async getAllRequests(): Promise<RequestData[]> {
    try {
      const requests: any[] = await (this.program.account as any).request.all();
      
      const mappedRequests = requests.map(({ publicKey, account }: any) => {
        try {
          let status = 'unknown';
          if (account.status) {
            if (account.status.created) status = 'created';
            else if (account.status.proposed) status = 'proposed';
            else if (account.status.disputed) status = 'disputed';
            else if (account.status.resolved) status = 'resolved';
            else if (account.status.cancelled) status = 'cancelled';
          }

          const rewardAmount = account.rewardAmount ? parseInt(account.rewardAmount, 16) : 0;
          const bondAmount = account.bondAmount ? parseInt(account.bondAmount, 16) : 0;
          const expiryTimestamp = account.expiryTimestamp ? parseInt(account.expiryTimestamp, 16) : 0;
          const challengePeriod = account.challengePeriod ? parseInt(account.challengePeriod, 16) : 0;
          const createdAt = account.createdAt ? parseInt(account.createdAt, 16) : 0;
          const proposalTime = account.proposalTime ? parseInt(account.proposalTime, 16) : 0;

          return {
            id: publicKey.toBase58(),
            requestId: parseInt(account.requestId, 16) || 0,
            requester: account.creator || 'unknown',
            question: account.question || 'No question',
            reward: rewardAmount / 1e9,
            bond: bondAmount / 1e9,
            expiryTime: expiryTimestamp,
            challengePeriod: challengePeriod,
            status,
            answer: account.answer || undefined,
            proposer: account.proposer || undefined,
            proposedAt: proposalTime || undefined,
            challengeEndsAt: proposalTime && challengePeriod
              ? new Date((proposalTime + challengePeriod) * 1000).toISOString()
              : undefined,
            dataSource: account.dataSource || undefined,
            createdAt: createdAt ? new Date(createdAt * 1000).toISOString() : new Date().toISOString()
          } as RequestData;
        } catch (mapError) {
          console.error('Error mapping single request:', mapError);
          return null;
        }
      });

      return mappedRequests
        .filter((r: RequestData | null): r is RequestData => r !== null)
        .sort((a: RequestData, b: RequestData) => b.requestId - a.requestId);
    } catch (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
  }

  async resolveRequest(requestId: number): Promise<{ signature: string }> {
    try {
      const requestPDA = this.getRequestPDA(requestId);

      const tx = await (this.program.methods as any)
        .resolveRequest()
        .accounts({
          request: requestPDA,
          requester: this.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Request resolved:', requestId);
      console.log('Transaction signature:', tx);

      return { signature: tx };
    } catch (error) {
      console.error('Error resolving request:', error);
      throw error;
    }
  }
}