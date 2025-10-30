import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import {
  X402PaymentHeader,
  X402PaymentRequirement,
  X402Scheme,
  WalletAdapter,
} from '../types';
import { generateNonce, getCurrentTimestamp, encodePaymentHeader } from '../utils';

/**
 * X402 Payment Handler for Solana
 */
export class X402PaymentHandler {
  private connection: Connection;
  private wallet: WalletAdapter;

  constructor(connection: Connection, wallet: WalletAdapter) {
    this.connection = connection;
    this.wallet = wallet;
  }

  /**
   * Create X402 payment for given requirements
   */
  async createPayment(
    requirements: X402PaymentRequirement
  ): Promise<string> {
    // Select first scheme (in production, wallet should choose)
    const scheme = requirements.schemes[0];

    if (!scheme) {
      throw new Error('No payment schemes available');
    }

    // Validate scheme network
    if (!scheme.network.includes('solana')) {
      throw new Error(`Unsupported network: ${scheme.network}`);
    }

    // Create payment transaction
    const transaction = await this.createPaymentTransaction(scheme);

    // Sign transaction
    const signedTx = await this.wallet.signTransaction(transaction);

    // Send transaction
    const signature = await this.connection.sendRawTransaction(
      signedTx.serialize()
    );

    // Wait for confirmation
    await this.connection.confirmTransaction(signature, 'confirmed');

    // Create X402 payment header
    const paymentHeader = this.createPaymentHeader(scheme, signature);

    // Encode to base64
    return encodePaymentHeader(paymentHeader);
  }

  /**
   * Create Solana payment transaction
   */
  private async createPaymentTransaction(
    scheme: X402Scheme
  ): Promise<Transaction> {
    const fromPubkey = new PublicKey(this.wallet.publicKey);
    const toPubkey = new PublicKey(scheme.recipient);
    
    // Parse amount (assuming USDC micro-units or lamports)
    const lamports = this.parseAmount(scheme.amount, scheme.asset);

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
  }

  /**
   * Parse amount based on asset
   */
  private parseAmount(amount: string, asset: { address: string; decimals: number }): number {
    // For SOL transfers (native), convert from smallest unit
    // In production, handle SPL token transfers differently
    const parsedAmount = parseInt(amount, 10);
    
    // If it's USDC or SPL token, need different handling
    // For now, assume conversion from micro-units to lamports
    return Math.floor(parsedAmount / 1000); // Simplified conversion
  }

  /**
   * Create X402 payment header
   */
  private createPaymentHeader(
    scheme: X402Scheme,
    signature: string
  ): X402PaymentHeader {
    return {
      version: '1.0',
      scheme: scheme.scheme,
      network: scheme.network,
      signature,
      payload: {
        from: this.wallet.publicKey,
        to: scheme.recipient,
        amount: scheme.amount,
        asset: scheme.asset,
        nonce: generateNonce(),
        timestamp: getCurrentTimestamp(),
      },
    };
  }

  /**
   * Verify payment was successful
   */
  async verifyPayment(signature: string): Promise<boolean> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      return status.value?.confirmationStatus === 'confirmed' ||
             status.value?.confirmationStatus === 'finalized';
    } catch (error) {
      return false;
    }
  }
}

/**
 * Helper: Create payment handler
 */
export function createPaymentHandler(
  rpcUrl: string,
  wallet: WalletAdapter
): X402PaymentHandler {
  const connection = new Connection(rpcUrl, 'confirmed');
  return new X402PaymentHandler(connection, wallet);
}
